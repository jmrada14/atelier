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

// List all reminders for a user
export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) return [];

    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return reminders.map((reminder) => ({
      id: reminder._id,
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.dueDate,
      collectorIds: reminder.collectorIds,
      completed: reminder.completed,
      completedAt: reminder.completedAt,
      createdAt: reminder.createdAt,
    }));
  },
});

// Create a new reminder
export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.string(),
    collectorIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const reminderId = await ctx.db.insert("reminders", {
      userId: user._id,
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      collectorIds: args.collectorIds || [],
      completed: false,
      createdAt: Date.now(),
    });

    return { id: reminderId };
  },
});

// Update a reminder
export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("reminders"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    collectorIds: v.optional(v.array(v.string())),
    completed: v.optional(v.boolean()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const reminder = await ctx.db.get(args.id);
    if (!reminder || reminder.userId !== user._id) {
      throw new Error("Reminder not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.collectorIds !== undefined)
      updates.collectorIds = args.collectorIds;
    if (args.completed !== undefined) updates.completed = args.completed;
    if (args.completedAt !== undefined) updates.completedAt = args.completedAt;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

// Delete a reminder
export const remove = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("reminders"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const reminder = await ctx.db.get(args.id);
    if (!reminder || reminder.userId !== user._id) {
      throw new Error("Reminder not found");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Complete a reminder
export const complete = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("reminders"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const reminder = await ctx.db.get(args.id);
    if (!reminder || reminder.userId !== user._id) {
      throw new Error("Reminder not found");
    }

    await ctx.db.patch(args.id, {
      completed: true,
      completedAt: Date.now(),
    });

    return { success: true };
  },
});

// Batch import reminders (for migration)
export const batchImport = mutation({
  args: {
    sessionToken: v.string(),
    reminders: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        dueDate: v.optional(v.string()),
        collectorIds: v.optional(v.array(v.string())),
        completed: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const ids = [];
    for (const reminder of args.reminders) {
      const id = await ctx.db.insert("reminders", {
        userId: user._id,
        title: reminder.title,
        description: reminder.description,
        dueDate: reminder.dueDate || new Date().toISOString(),
        collectorIds: reminder.collectorIds || [],
        completed: reminder.completed || false,
        createdAt: Date.now(),
      });
      ids.push(id);
    }

    return { imported: ids.length };
  },
});
