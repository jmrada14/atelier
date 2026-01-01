import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  hashToken,
} from "./lib/crypto";

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Sign up a new user
export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email format");
    }

    // Validate password length
    if (args.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Validate name
    if (args.name.trim().length < 1) {
      throw new Error("Name is required");
    }

    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existing) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      passwordHash,
      name: args.name.trim(),
      createdAt: Date.now(),
    });

    // Create session
    const sessionToken = generateSessionToken();
    const tokenHash = await hashToken(sessionToken);

    await ctx.db.insert("sessions", {
      userId,
      tokenHash,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      createdAt: Date.now(),
    });

    return {
      sessionToken,
      user: {
        id: userId,
        email: args.email.toLowerCase(),
        name: args.name.trim(),
      },
    };
  },
});

// Log in an existing user
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const validPassword = await verifyPassword(args.password, user.passwordHash);
    if (!validPassword) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await ctx.db.patch(user._id, { lastLoginAt: Date.now() });

    // Create new session
    const sessionToken = generateSessionToken();
    const tokenHash = await hashToken(sessionToken);

    await ctx.db.insert("sessions", {
      userId: user._id,
      tokenHash,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      createdAt: Date.now(),
    });

    return {
      sessionToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        artistProfile: user.artistProfile,
      },
    };
  },
});

// Log out (delete session)
export const logout = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.sessionToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return { success: true };
  },
});

// Validate a session and get user
export const validateSession = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;

    const tokenHash = await hashToken(args.sessionToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      artistProfile: user.artistProfile,
    };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    sessionToken: v.string(),
    name: v.optional(v.string()),
    artistProfile: v.optional(
      v.object({
        mediums: v.array(v.string()),
        location: v.string(),
        careerStage: v.string(),
        themes: v.array(v.string()),
        maxEntryFee: v.optional(v.number()),
        preferNoFee: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.sessionToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid session");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.artistProfile !== undefined)
      updates.artistProfile = args.artistProfile;

    await ctx.db.patch(session.userId, updates);

    const user = await ctx.db.get(session.userId);
    return {
      id: user!._id,
      email: user!.email,
      name: user!.name,
      artistProfile: user!.artistProfile,
    };
  },
});

// Change password
export const changePassword = mutation({
  args: {
    sessionToken: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters");
    }

    const tokenHash = await hashToken(args.sessionToken);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid session");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const validPassword = await verifyPassword(
      args.currentPassword,
      user.passwordHash
    );
    if (!validPassword) {
      throw new Error("Current password is incorrect");
    }

    const newPasswordHash = await hashPassword(args.newPassword);
    await ctx.db.patch(session.userId, { passwordHash: newPasswordHash });

    // Invalidate all other sessions
    const allSessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();

    for (const s of allSessions) {
      if (s._id !== session._id) {
        await ctx.db.delete(s._id);
      }
    }

    return { success: true };
  },
});

// Clean up expired sessions (can be called periodically)
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db.query("sessions").collect();

    let deleted = 0;
    for (const session of sessions) {
      if (session.expiresAt < now) {
        await ctx.db.delete(session._id);
        deleted++;
      }
    }

    return { deleted };
  },
});
