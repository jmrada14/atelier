import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ==================== AUTHENTICATION ====================
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
    // Artist profile preferences
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
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["tokenHash"])
    .index("by_user", ["userId"]),

  // ==================== ART INVENTORY ====================
  artworks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    medium: v.string(),
    yearCompleted: v.optional(v.number()),
    price: v.optional(v.number()),
    location: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")), // For uploaded images
    thumbnailUrl: v.optional(v.string()), // For external URLs or legacy
    highResUrl: v.optional(v.string()),
    archived: v.boolean(),
    dimensions: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_archived", ["userId", "archived"]),

  // ==================== WORKS IN PROGRESS ====================
  pieces: defineTable({
    userId: v.id("users"),
    title: v.string(),
    deadline: v.optional(v.string()),
    status: v.string(), // 'not-started', 'in-progress', 'completed'
    type: v.optional(v.string()), // 'commission', 'gallery', 'exploration'
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  pieceNotes: defineTable({
    pieceId: v.id("pieces"),
    userId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_piece", ["pieceId"]),

  pieceImages: defineTable({
    pieceId: v.id("pieces"),
    userId: v.id("users"),
    storageId: v.optional(v.id("_storage")), // For uploaded files
    url: v.optional(v.string()), // For external URLs or legacy
    caption: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_piece", ["pieceId"]),

  // ==================== COLLECTORS & CONTACTS ====================
  collectors: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    category: v.optional(v.string()), // 'collector', 'gallery', 'curator', 'press', 'other'
    createdAt: v.number(),
    lastContactedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"]),

  // ==================== REMINDERS ====================
  reminders: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.string(),
    collectorIds: v.array(v.string()), // Store as strings for flexibility
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_completed", ["userId", "completed"]),

  // ==================== NEWSLETTERS ====================
  newsletters: defineTable({
    userId: v.id("users"),
    subject: v.string(),
    body: v.string(),
    recipientIds: v.array(v.string()), // Store as strings for flexibility
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ==================== OPEN CALLS ====================
  // User-specific saved call state (bookmarks, applications, notes)
  savedCallStates: defineTable({
    userId: v.id("users"),
    callId: v.string(), // External call ID from curated list
    bookmarked: v.boolean(),
    applied: v.boolean(),
    hidden: v.boolean(),
    applicationStatus: v.optional(v.string()),
    checklist: v.optional(
      v.array(
        v.object({
          item: v.string(),
          completed: v.boolean(),
        })
      )
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_call", ["userId", "callId"]),

  // User-added custom open calls
  customOpenCalls: defineTable({
    userId: v.id("users"),
    title: v.string(),
    organization: v.string(),
    location: v.optional(v.string()),
    deadline: v.optional(v.string()),
    entryFee: v.optional(v.number()),
    description: v.optional(v.string()),
    mediums: v.optional(v.array(v.string())),
    theme: v.optional(v.string()),
    url: v.optional(v.string()),
    type: v.optional(v.string()), // 'exhibition', 'residency', 'grant', 'fellowship', 'commission'
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // ==================== ART MATERIALS ====================
  materials: defineTable({
    userId: v.id("users"),
    name: v.string(),
    category: v.string(), // 'paints', 'brushes', 'surfaces', 'mediums', 'other'
    quantity: v.number(),
    brand: v.optional(v.string()),
    color: v.optional(v.string()),
    unit: v.optional(v.string()),
    minQuantity: v.optional(v.number()),
    purchaseUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    notes: v.optional(v.string()),
    isWishlist: v.boolean(), // true = wishlist, false = inventory
    lastPurchased: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_wishlist", ["userId", "isWishlist"])
    .index("by_user_category", ["userId", "category"]),
});
