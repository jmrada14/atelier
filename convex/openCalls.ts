import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { hashToken } from "./lib/crypto";

// Helper to get user from session token
async function getUserFromSession(ctx: any, sessionToken: string) {
  const tokenHash = await hashToken(sessionToken);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("tokenHash", tokenHash))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return await ctx.db.get(session.userId);
}

// Get saved call states for user (bookmarked, applied, hidden, etc.)
export const getSavedStates = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) return [];

    const states = await ctx.db
      .query("savedCallStates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return states.map((state) => ({
      id: state._id,
      callId: state.callId,
      bookmarked: state.bookmarked,
      hidden: state.hidden,
      applied: state.applied,
      applicationStatus: state.applicationStatus,
      checklist: state.checklist,
    }));
  },
});

// Get custom open calls for user
export const getCustomCalls = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) return [];

    const calls = await ctx.db
      .query("customOpenCalls")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return calls.map((call) => ({
      id: call._id,
      title: call.title,
      organization: call.organization,
      deadline: call.deadline,
      type: call.type,
      location: call.location,
      url: call.url,
      description: call.description,
      entryFee: call.entryFee,
      mediums: call.mediums,
      theme: call.theme,
      createdAt: call.createdAt,
    }));
  },
});

// Get artist preferences
export const getPreferences = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) return null;

    return user.artistProfile || null;
  },
});

// Update artist preferences
export const updatePreferences = mutation({
  args: {
    sessionToken: v.string(),
    mediums: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    careerStage: v.optional(v.string()),
    themes: v.optional(v.array(v.string())),
    maxEntryFee: v.optional(v.number()),
    preferNoFee: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const currentProfile = user.artistProfile || {
      mediums: [],
      location: "",
      careerStage: "",
      themes: [],
      preferNoFee: false,
    };

    const updatedProfile = {
      ...currentProfile,
      ...(args.mediums !== undefined && { mediums: args.mediums }),
      ...(args.location !== undefined && { location: args.location }),
      ...(args.careerStage !== undefined && { careerStage: args.careerStage }),
      ...(args.themes !== undefined && { themes: args.themes }),
      ...(args.maxEntryFee !== undefined && { maxEntryFee: args.maxEntryFee }),
      ...(args.preferNoFee !== undefined && { preferNoFee: args.preferNoFee }),
    };

    await ctx.db.patch(user._id, { artistProfile: updatedProfile });

    return { success: true };
  },
});

// Save or update call state (bookmark, hide, apply, etc.)
export const saveCallState = mutation({
  args: {
    sessionToken: v.string(),
    callId: v.string(),
    bookmarked: v.optional(v.boolean()),
    hidden: v.optional(v.boolean()),
    applied: v.optional(v.boolean()),
    applicationStatus: v.optional(v.string()),
    checklist: v.optional(
      v.array(
        v.object({
          item: v.string(),
          completed: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    // Find existing state for this call
    const states = await ctx.db
      .query("savedCallStates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const existing = states.find((s) => s.callId === args.callId);

    if (existing) {
      const updates: Record<string, unknown> = {};
      if (args.bookmarked !== undefined) updates.bookmarked = args.bookmarked;
      if (args.hidden !== undefined) updates.hidden = args.hidden;
      if (args.applied !== undefined) updates.applied = args.applied;
      if (args.applicationStatus !== undefined)
        updates.applicationStatus = args.applicationStatus;
      if (args.checklist !== undefined) updates.checklist = args.checklist;

      await ctx.db.patch(existing._id, updates);
      return { id: existing._id };
    } else {
      const stateId = await ctx.db.insert("savedCallStates", {
        userId: user._id,
        callId: args.callId,
        bookmarked: args.bookmarked ?? false,
        hidden: args.hidden ?? false,
        applied: args.applied ?? false,
        applicationStatus: args.applicationStatus,
        checklist: args.checklist,
      });
      return { id: stateId };
    }
  },
});

// Create a custom open call
export const createCustomCall = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    organization: v.string(),
    deadline: v.optional(v.string()),
    type: v.optional(v.string()),
    location: v.optional(v.string()),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
    entryFee: v.optional(v.number()),
    mediums: v.optional(v.array(v.string())),
    theme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const callId = await ctx.db.insert("customOpenCalls", {
      userId: user._id,
      title: args.title,
      organization: args.organization,
      deadline: args.deadline,
      type: args.type,
      location: args.location,
      url: args.url,
      description: args.description,
      entryFee: args.entryFee,
      mediums: args.mediums,
      theme: args.theme,
      createdAt: Date.now(),
    });

    return { id: callId };
  },
});

// Update a custom open call
export const updateCustomCall = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("customOpenCalls"),
    title: v.optional(v.string()),
    organization: v.optional(v.string()),
    deadline: v.optional(v.string()),
    type: v.optional(v.string()),
    location: v.optional(v.string()),
    url: v.optional(v.string()),
    description: v.optional(v.string()),
    entryFee: v.optional(v.number()),
    mediums: v.optional(v.array(v.string())),
    theme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const call = await ctx.db.get(args.id);
    if (!call || call.userId !== user._id) {
      throw new Error("Call not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.organization !== undefined)
      updates.organization = args.organization;
    if (args.deadline !== undefined) updates.deadline = args.deadline;
    if (args.type !== undefined) updates.type = args.type;
    if (args.location !== undefined) updates.location = args.location;
    if (args.url !== undefined) updates.url = args.url;
    if (args.description !== undefined) updates.description = args.description;
    if (args.entryFee !== undefined) updates.entryFee = args.entryFee;
    if (args.mediums !== undefined) updates.mediums = args.mediums;
    if (args.theme !== undefined) updates.theme = args.theme;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

// Delete a custom open call
export const deleteCustomCall = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("customOpenCalls"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const call = await ctx.db.get(args.id);
    if (!call || call.userId !== user._id) {
      throw new Error("Call not found");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});
