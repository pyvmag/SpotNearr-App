import { v } from "convex/values";
import { mutation } from "./_generated/server";

// 1. LOG INTERACTION (Buffer Writer)
export const logInteraction = mutation({
  args: {
    businessId: v.id("businesses"),
    contentId: v.optional(v.id("content")), 
    type: v.union(v.literal("view"), v.literal("like"), v.literal("share"), v.literal("visit")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let userId = undefined;
    
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
        .unique();
      userId = user?._id;
    }

    // Insert into Buffer
    await ctx.db.insert("interaction_buffer", {
      userId: userId,
      businessId: args.businessId,
      contentId: args.contentId,
      type: args.type,
      createdAt: Date.now(),
    });
  },
});

export const markAsSeen = mutation({
  args: { contentIds: v.array(v.id("content")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .unique();

    if (!user) return;

    // Batch process: Check existing seen content in parallel
    const existingSeenItems = await Promise.all(
      args.contentIds.map(async (contentId) => {
        const existing = await ctx.db
          .query("seen_content")
          .withIndex("by_user_content", (q) => 
            q.eq("userId", user._id).eq("contentId", contentId)
          )
          .unique();
        return { contentId, exists: !!existing };
      })
    );

    // Filter only new content to insert
    const newContentIds = existingSeenItems
      .filter(item => !item.exists)
      .map(item => item.contentId);

    if (newContentIds.length === 0) return; // All content already seen

    // Batch insert new seen content
    await Promise.all(
      newContentIds.map(contentId =>
        ctx.db.insert("seen_content", {
          userId: user._id,
          contentId: contentId,
          createdAt: Date.now(),
        })
      )
    );
  },
});