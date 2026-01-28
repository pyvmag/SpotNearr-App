import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const getReviews = query({
  args: { 
    businessId: v.id("businesses"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const reviewsPage = await ctx.db
      .query("reviews")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc") // Show newest first
      .paginate(args.paginationOpts);

    // Map authors to the reviews in this specific page
    const reviewsWithAuthors = await Promise.all(
      reviewsPage.page.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return { ...r, author: user };
      })
    );

    return { ...reviewsPage, page: reviewsWithAuthors };
  },
});

export const submitReview = mutation({
  args: {
    businessId: v.id("businesses"),
    rating: v.number(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const business = await ctx.db.get(args.businessId);
    if (!business) throw new Error("Business not found");

    // 1. Save the New Review
    await ctx.db.insert("reviews", {
      userId: user._id,
      businessId: args.businessId,
      rating: args.rating,
      content: args.content,
      createdAt: Date.now(),
    });

    // 2. Math for Rating & Score
    const newCount = (business.reviewCount ?? 0) + 1;
    const currentTotalStars = (business.rating ?? 0) * (business.reviewCount ?? 0);
    const newAverageRating = (currentTotalStars + args.rating) / newCount;

    // YOUR SMART SCORE FORMULA: (Rating * 10) + ReviewCount
    const newRecommendationScore = (newAverageRating * 10) + newCount;

    // 3. Single Patch to update everything
    await ctx.db.patch(args.businessId, {
      rating: parseFloat(newAverageRating.toFixed(1)),
      reviewCount: newCount,
      recommendationScore: newRecommendationScore,
    });

    return { success: true };
  },
});