import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const markSeen = mutation({
  args: {
    userId: v.id("users"),
    contentIds: v.array(v.id("content")),
  },
  handler: async (ctx, args) => {
    for (const contentId of args.contentIds) {
      const exists = await ctx.db
        .query("seenContent")
        .withIndex("by_user_content", (q) =>
          q.eq("userId", args.userId).eq("contentId", contentId)
        )
        .unique();

      if (!exists) {
        await ctx.db.insert("seenContent", {
          userId: args.userId,
          contentId,
          contentCreatedAt: Date.now(),
        });
      }
    }
  },
});



const FEED_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const cleanupSeenContent = mutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - FEED_WINDOW_MS;

    const oldSeen = await ctx.db
      .query("seenContent")
      .withIndex("content_createdAt", (q) =>
        q.lt("contentCreatedAt", cutoff)
      )
      .collect();

    for (const doc of oldSeen) {
      await ctx.db.delete(doc._id);
    }
  },
});
