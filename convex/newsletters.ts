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

// List all newsletters for a user
export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) return [];

    const newsletters = await ctx.db
      .query("newsletters")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return newsletters.map((newsletter) => ({
      id: newsletter._id,
      subject: newsletter.subject,
      body: newsletter.body,
      recipientIds: newsletter.recipientIds,
      sentAt: newsletter.sentAt,
      createdAt: newsletter.createdAt,
      updatedAt: newsletter.updatedAt,
    }));
  },
});

// Save (create or update) a newsletter
export const save = mutation({
  args: {
    sessionToken: v.string(),
    id: v.optional(v.id("newsletters")),
    subject: v.string(),
    body: v.string(),
    recipientIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    if (args.id) {
      // Update existing
      const newsletter = await ctx.db.get(args.id);
      if (!newsletter || newsletter.userId !== user._id) {
        throw new Error("Newsletter not found");
      }

      await ctx.db.patch(args.id, {
        subject: args.subject,
        body: args.body,
        recipientIds: args.recipientIds || [],
        updatedAt: Date.now(),
      });

      return { id: args.id };
    } else {
      // Create new
      const newsletterId = await ctx.db.insert("newsletters", {
        userId: user._id,
        subject: args.subject,
        body: args.body,
        recipientIds: args.recipientIds || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { id: newsletterId };
    }
  },
});

// Delete a newsletter
export const remove = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("newsletters"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const newsletter = await ctx.db.get(args.id);
    if (!newsletter || newsletter.userId !== user._id) {
      throw new Error("Newsletter not found");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Mark newsletter as sent
export const markSent = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("newsletters"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const newsletter = await ctx.db.get(args.id);
    if (!newsletter || newsletter.userId !== user._id) {
      throw new Error("Newsletter not found");
    }

    await ctx.db.patch(args.id, { sentAt: Date.now() });

    return { success: true };
  },
});

// Batch import newsletters (for migration)
export const batchImport = mutation({
  args: {
    sessionToken: v.string(),
    newsletters: v.array(
      v.object({
        subject: v.string(),
        body: v.string(),
        recipientIds: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const ids = [];
    for (const newsletter of args.newsletters) {
      const id = await ctx.db.insert("newsletters", {
        userId: user._id,
        subject: newsletter.subject,
        body: newsletter.body,
        recipientIds: newsletter.recipientIds || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      ids.push(id);
    }

    return { imported: ids.length };
  },
});
