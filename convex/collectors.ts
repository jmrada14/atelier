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

// List all collectors for a user
export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) return [];

    const collectors = await ctx.db
      .query("collectors")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return collectors.map((collector) => ({
      id: collector._id,
      name: collector.name,
      email: collector.email,
      phone: collector.phone,
      category: collector.category,
      notes: collector.notes,
      lastContactedAt: collector.lastContactedAt,
      createdAt: collector.createdAt,
    }));
  },
});

// Create a new collector
export const create = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const collectorId = await ctx.db.insert("collectors", {
      userId: user._id,
      name: args.name,
      email: args.email,
      phone: args.phone,
      category: args.category,
      notes: args.notes,
      createdAt: Date.now(),
    });

    return { id: collectorId };
  },
});

// Update a collector
export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("collectors"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const collector = await ctx.db.get(args.id);
    if (!collector || collector.userId !== user._id) {
      throw new Error("Collector not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.category !== undefined) updates.category = args.category;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.lastContactedAt !== undefined)
      updates.lastContactedAt = args.lastContactedAt;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

// Delete a collector
export const remove = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("collectors"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const collector = await ctx.db.get(args.id);
    if (!collector || collector.userId !== user._id) {
      throw new Error("Collector not found");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Mark collector as contacted
export const markContacted = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("collectors"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const collector = await ctx.db.get(args.id);
    if (!collector || collector.userId !== user._id) {
      throw new Error("Collector not found");
    }

    await ctx.db.patch(args.id, { lastContactedAt: Date.now() });

    return { success: true };
  },
});

// Batch import collectors (for migration)
export const batchImport = mutation({
  args: {
    sessionToken: v.string(),
    collectors: v.array(
      v.object({
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        category: v.optional(v.string()),
        notes: v.optional(v.string()),
        lastContactedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const ids = [];
    for (const collector of args.collectors) {
      const id = await ctx.db.insert("collectors", {
        userId: user._id,
        name: collector.name,
        email: collector.email,
        phone: collector.phone,
        category: collector.category,
        notes: collector.notes,
        lastContactedAt: collector.lastContactedAt,
        createdAt: Date.now(),
      });
      ids.push(id);
    }

    return { imported: ids.length };
  },
});
