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

// List all artworks for a user
export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) return [];

    const artworks = await ctx.db
      .query("artworks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Resolve storage URLs
    const artworksWithUrls = await Promise.all(
      artworks.map(async (artwork) => {
        let imageUrl = artwork.thumbnailUrl;
        if (artwork.storageId) {
          imageUrl = await ctx.storage.getUrl(artwork.storageId);
        }
        return {
          id: artwork._id,
          title: artwork.title,
          medium: artwork.medium,
          yearCompleted: artwork.yearCompleted,
          price: artwork.price,
          location: artwork.location,
          storageId: artwork.storageId,
          thumbnailUrl: imageUrl ?? artwork.thumbnailUrl,
          highResUrl: imageUrl ?? artwork.highResUrl,
          archived: artwork.archived,
          dimensions: artwork.dimensions,
          notes: artwork.notes,
          createdAt: artwork.createdAt,
        };
      })
    );

    return artworksWithUrls;
  },
});

// Create a new artwork
export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    medium: v.string(),
    yearCompleted: v.optional(v.number()),
    price: v.optional(v.number()),
    location: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    thumbnailUrl: v.optional(v.string()),
    highResUrl: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    dimensions: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const artworkId = await ctx.db.insert("artworks", {
      userId: user._id,
      title: args.title,
      medium: args.medium,
      yearCompleted: args.yearCompleted,
      price: args.price,
      location: args.location,
      storageId: args.storageId,
      thumbnailUrl: args.thumbnailUrl,
      highResUrl: args.highResUrl,
      archived: args.archived ?? false,
      dimensions: args.dimensions,
      notes: args.notes,
      createdAt: Date.now(),
    });

    return { id: artworkId };
  },
});

// Update an artwork
export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("artworks"),
    title: v.optional(v.string()),
    medium: v.optional(v.string()),
    yearCompleted: v.optional(v.number()),
    price: v.optional(v.number()),
    location: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    highResUrl: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    dimensions: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const artwork = await ctx.db.get(args.id);
    if (!artwork || artwork.userId !== user._id) {
      throw new Error("Artwork not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.medium !== undefined) updates.medium = args.medium;
    if (args.yearCompleted !== undefined)
      updates.yearCompleted = args.yearCompleted;
    if (args.price !== undefined) updates.price = args.price;
    if (args.location !== undefined) updates.location = args.location;
    if (args.thumbnailUrl !== undefined)
      updates.thumbnailUrl = args.thumbnailUrl;
    if (args.highResUrl !== undefined) updates.highResUrl = args.highResUrl;
    if (args.archived !== undefined) updates.archived = args.archived;
    if (args.dimensions !== undefined) updates.dimensions = args.dimensions;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

// Delete an artwork
export const remove = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("artworks"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const artwork = await ctx.db.get(args.id);
    if (!artwork || artwork.userId !== user._id) {
      throw new Error("Artwork not found");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Batch import artworks (for migration)
export const batchImport = mutation({
  args: {
    sessionToken: v.string(),
    artworks: v.array(
      v.object({
        title: v.string(),
        medium: v.string(),
        yearCompleted: v.optional(v.number()),
        price: v.optional(v.number()),
        location: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        highResUrl: v.optional(v.string()),
        archived: v.optional(v.boolean()),
        dimensions: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const ids = [];
    for (const artwork of args.artworks) {
      const id = await ctx.db.insert("artworks", {
        userId: user._id,
        title: artwork.title,
        medium: artwork.medium,
        yearCompleted: artwork.yearCompleted,
        price: artwork.price,
        location: artwork.location,
        thumbnailUrl: artwork.thumbnailUrl,
        highResUrl: artwork.highResUrl,
        archived: artwork.archived ?? false,
        dimensions: artwork.dimensions,
        notes: artwork.notes,
        createdAt: Date.now(),
      });
      ids.push(id);
    }

    return { imported: ids.length };
  },
});
