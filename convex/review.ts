import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 1. Get Reviews for a Business
export const getReviews = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    // Enrich with user details (name/avatar)
    return Promise.all(
      reviews.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return { ...r, author: user };
      })
    );
  },
});

// 2. Submit Review & Update Average
export const submitReview = mutation({
  args: {
    businessId: v.id("businesses"),
    rating: v.number(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get the user from your database
    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // A. Save the Review
    await ctx.db.insert("reviews", {
      userId: user._id,
      businessId: args.businessId,
      rating: args.rating,
      content: args.content,
      createdAt: Date.now(),
    });

    // B. Recalculate Business Average (Simple Math)
    const allReviews = await ctx.db
      .query("reviews")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const totalStars = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const newRating = totalStars / allReviews.length;

    // C. Update the Business
    await ctx.db.patch(args.businessId, {
      rating: parseFloat(newRating.toFixed(1)), // Keep it to 1 decimal (e.g. 4.8)
      reviewCount: allReviews.length,
    });
  },
});