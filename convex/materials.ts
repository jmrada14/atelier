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

// List all materials for a user
export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) return [];

    const materials = await ctx.db
      .query("materials")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return materials.map((material) => ({
      id: material._id,
      name: material.name,
      category: material.category,
      brand: material.brand,
      color: material.color,
      quantity: material.quantity,
      unit: material.unit,
      minQuantity: material.minQuantity,
      purchaseUrl: material.purchaseUrl,
      price: material.price,
      isWishlist: material.isWishlist,
      notes: material.notes,
      lastPurchased: material.lastPurchased,
      createdAt: material.createdAt,
    }));
  },
});

// Create a new material
export const create = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    category: v.string(),
    brand: v.optional(v.string()),
    color: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    minQuantity: v.optional(v.number()),
    purchaseUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    isWishlist: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const materialId = await ctx.db.insert("materials", {
      userId: user._id,
      name: args.name,
      category: args.category,
      brand: args.brand,
      color: args.color,
      quantity: args.quantity ?? 0,
      unit: args.unit,
      minQuantity: args.minQuantity,
      purchaseUrl: args.purchaseUrl,
      price: args.price,
      isWishlist: args.isWishlist ?? false,
      notes: args.notes,
      createdAt: Date.now(),
    });

    return { id: materialId };
  },
});

// Update a material
export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("materials"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    brand: v.optional(v.string()),
    color: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    minQuantity: v.optional(v.number()),
    purchaseUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    isWishlist: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    lastPurchased: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const material = await ctx.db.get(args.id);
    if (!material || material.userId !== user._id) {
      throw new Error("Material not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.category !== undefined) updates.category = args.category;
    if (args.brand !== undefined) updates.brand = args.brand;
    if (args.color !== undefined) updates.color = args.color;
    if (args.quantity !== undefined) updates.quantity = args.quantity;
    if (args.unit !== undefined) updates.unit = args.unit;
    if (args.minQuantity !== undefined) updates.minQuantity = args.minQuantity;
    if (args.purchaseUrl !== undefined) updates.purchaseUrl = args.purchaseUrl;
    if (args.price !== undefined) updates.price = args.price;
    if (args.isWishlist !== undefined) updates.isWishlist = args.isWishlist;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.lastPurchased !== undefined)
      updates.lastPurchased = args.lastPurchased;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

// Delete a material
export const remove = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("materials"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const material = await ctx.db.get(args.id);
    if (!material || material.userId !== user._id) {
      throw new Error("Material not found");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Batch import materials (for migration)
export const batchImport = mutation({
  args: {
    sessionToken: v.string(),
    materials: v.array(
      v.object({
        name: v.string(),
        category: v.string(),
        brand: v.optional(v.string()),
        color: v.optional(v.string()),
        quantity: v.optional(v.number()),
        unit: v.optional(v.string()),
        minQuantity: v.optional(v.number()),
        purchaseUrl: v.optional(v.string()),
        price: v.optional(v.number()),
        isWishlist: v.optional(v.boolean()),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const ids = [];
    for (const material of args.materials) {
      const id = await ctx.db.insert("materials", {
        userId: user._id,
        name: material.name,
        category: material.category,
        brand: material.brand,
        color: material.color,
        quantity: material.quantity ?? 0,
        unit: material.unit,
        minQuantity: material.minQuantity,
        purchaseUrl: material.purchaseUrl,
        price: material.price,
        isWishlist: material.isWishlist ?? false,
        notes: material.notes,
        createdAt: Date.now(),
      });
      ids.push(id);
    }

    return { imported: ids.length };
  },
});
