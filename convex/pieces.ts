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

// List all pieces for a user with their notes and images
export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) return [];

    const pieces = await ctx.db
      .query("pieces")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get notes and images for each piece
    const piecesWithDetails = await Promise.all(
      pieces.map(async (piece) => {
        const notes = await ctx.db
          .query("pieceNotes")
          .withIndex("by_piece", (q) => q.eq("pieceId", piece._id))
          .collect();

        const images = await ctx.db
          .query("pieceImages")
          .withIndex("by_piece", (q) => q.eq("pieceId", piece._id))
          .collect();

        // Resolve storage URLs for images
        const imagesWithUrls = await Promise.all(
          images.map(async (i) => {
            let url: string | null | undefined = i.url;
            if (i.storageId) {
              url = await ctx.storage.getUrl(i.storageId);
            }
            return {
              id: i._id,
              storageId: i.storageId,
              url: url ?? "",
              caption: i.caption,
              createdAt: i.createdAt,
            };
          })
        );

        return {
          id: piece._id,
          title: piece.title,
          deadline: piece.deadline,
          status: piece.status,
          type: piece.type,
          notes: notes.map((n) => ({
            id: n._id,
            text: n.text,
            createdAt: n.createdAt,
          })),
          images: imagesWithUrls,
          createdAt: piece.createdAt,
        };
      })
    );

    return piecesWithDetails;
  },
});

// Create a new piece
export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    deadline: v.optional(v.string()),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const pieceId = await ctx.db.insert("pieces", {
      userId: user._id,
      title: args.title,
      deadline: args.deadline,
      status: args.status || "not-started",
      type: args.type,
      createdAt: Date.now(),
    });

    return { id: pieceId };
  },
});

// Update a piece
export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("pieces"),
    title: v.optional(v.string()),
    deadline: v.optional(v.string()),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const piece = await ctx.db.get(args.id);
    if (!piece || piece.userId !== user._id) {
      throw new Error("Piece not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.deadline !== undefined) updates.deadline = args.deadline;
    if (args.status !== undefined) updates.status = args.status;
    if (args.type !== undefined) updates.type = args.type;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

// Delete a piece and its notes/images
export const remove = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("pieces"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const piece = await ctx.db.get(args.id);
    if (!piece || piece.userId !== user._id) {
      throw new Error("Piece not found");
    }

    // Delete all notes for this piece
    const notes = await ctx.db
      .query("pieceNotes")
      .withIndex("by_piece", (q) => q.eq("pieceId", args.id))
      .collect();
    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    // Delete all images for this piece
    const images = await ctx.db
      .query("pieceImages")
      .withIndex("by_piece", (q) => q.eq("pieceId", args.id))
      .collect();
    for (const image of images) {
      await ctx.db.delete(image._id);
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Add a note to a piece
export const addNote = mutation({
  args: {
    sessionToken: v.string(),
    pieceId: v.id("pieces"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const piece = await ctx.db.get(args.pieceId);
    if (!piece || piece.userId !== user._id) {
      throw new Error("Piece not found");
    }

    const noteId = await ctx.db.insert("pieceNotes", {
      pieceId: args.pieceId,
      userId: user._id,
      text: args.text,
      createdAt: Date.now(),
    });

    return { id: noteId };
  },
});

// Update a note
export const updateNote = mutation({
  args: {
    sessionToken: v.string(),
    noteId: v.id("pieceNotes"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== user._id) {
      throw new Error("Note not found");
    }

    await ctx.db.patch(args.noteId, { text: args.text });

    return { success: true };
  },
});

// Delete a note
export const deleteNote = mutation({
  args: {
    sessionToken: v.string(),
    noteId: v.id("pieceNotes"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== user._id) {
      throw new Error("Note not found");
    }

    await ctx.db.delete(args.noteId);

    return { success: true };
  },
});

// Add an image to a piece (supports both storageId and url)
export const addImage = mutation({
  args: {
    sessionToken: v.string(),
    pieceId: v.id("pieces"),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const piece = await ctx.db.get(args.pieceId);
    if (!piece || piece.userId !== user._id) {
      throw new Error("Piece not found");
    }

    if (!args.storageId && !args.url) {
      throw new Error("Either storageId or url is required");
    }

    const imageId = await ctx.db.insert("pieceImages", {
      pieceId: args.pieceId,
      userId: user._id,
      storageId: args.storageId,
      url: args.url,
      caption: args.caption,
      createdAt: Date.now(),
    });

    return { id: imageId };
  },
});

// Delete an image
export const deleteImage = mutation({
  args: {
    sessionToken: v.string(),
    imageId: v.id("pieceImages"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    const image = await ctx.db.get(args.imageId);
    if (!image || image.userId !== user._id) {
      throw new Error("Image not found");
    }

    await ctx.db.delete(args.imageId);

    return { success: true };
  },
});

// Batch import pieces (for migration)
export const batchImport = mutation({
  args: {
    sessionToken: v.string(),
    pieces: v.array(
      v.object({
        title: v.string(),
        deadline: v.optional(v.string()),
        status: v.optional(v.string()),
        type: v.optional(v.string()),
        notes: v.optional(
          v.array(
            v.object({
              text: v.string(),
            })
          )
        ),
        images: v.optional(
          v.array(
            v.object({
              url: v.string(),
              caption: v.optional(v.string()),
            })
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.sessionToken);
    if (!user) throw new Error("Not authenticated");

    let imported = 0;
    for (const piece of args.pieces) {
      const pieceId = await ctx.db.insert("pieces", {
        userId: user._id,
        title: piece.title,
        deadline: piece.deadline,
        status: piece.status || "not-started",
        type: piece.type,
        createdAt: Date.now(),
      });

      // Import notes
      if (piece.notes) {
        for (const note of piece.notes) {
          await ctx.db.insert("pieceNotes", {
            pieceId,
            userId: user._id,
            text: note.text,
            createdAt: Date.now(),
          });
        }
      }

      // Import images
      if (piece.images) {
        for (const image of piece.images) {
          await ctx.db.insert("pieceImages", {
            pieceId,
            userId: user._id,
            url: image.url,
            caption: image.caption,
            createdAt: Date.now(),
          });
        }
      }

      imported++;
    }

    return { imported };
  },
});
