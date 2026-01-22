import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_ACTIVE_OFFERS = 3;

export const getContentByBusiness = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];
    const now = Date.now();
    
    const results = await ctx.db
      .query("content")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .order("desc")
      .collect();

    // Filter out expired offers
    return results.filter(item => !item.expiryDate || item.expiryDate > now);
  },
});

export const getPostById = query({
  args: { id: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createContent = mutation({
  args: {
    businessId: v.id("businesses"),
    type: v.union(v.literal("post"), v.literal("offer")),
    imageUrl: v.string(),
    imageUrlPublic: v.optional(v.string()),
    caption: v.string(),
    offerTitle: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // ... (Your existing createContent logic)
    return await ctx.db.insert("content", {
      businessId: args.businessId,
      type: args.type,
      imageUrl: args.imageUrl,
      imageUrlPublic: args.imageUrlPublic,
      caption: args.caption,
      offerTitle: args.offerTitle,
      expiryDate: args.expiryDate,
      createdAt: Date.now(),
    });
  },
});

export const deleteContent = mutation({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.contentId);
  },
});

export const updateContent = mutation({
  args: {
    contentId: v.id("content"),
    caption: v.string(),
    offerTitle: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { contentId, ...updateData } = args;
    await ctx.db.patch(contentId, updateData);
    return contentId;
  },
});