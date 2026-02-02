import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getGeohashNeighbors } from "./geohash";

export const getFeed = query({
  args: {
    geohash: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    useFallback: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor || Date.now(); // Use timestamp as cursor
    const useFallback = args.useFallback || false;
    const identity = await ctx.auth.getUserIdentity();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

    if (!identity) {
      return await getLocalTrends(ctx, args.geohash, limit, sevenDaysAgo, cursor);
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .unique();

    if (!user) {
      return await getLocalTrends(ctx, args.geohash, limit, sevenDaysAgo, cursor);
    }

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const allContent = await ctx.db
      .query("content")
      .filter((q: any) => q.and(
        q.gte(q.field("createdAt"), thirtyDaysAgo),
        q.lt(q.field("createdAt"), cursor)
      ))
      .order("desc")
      .take(limit);

    const feedWithSeenStatus = allContent.map(content => ({
      ...content,
      isSeen: false
    }));

    return {
      items: feedWithSeenStatus,
      nextCursor: feedWithSeenStatus.length > 0 ? feedWithSeenStatus[feedWithSeenStatus.length - 1].createdAt : null,
      hasMore: feedWithSeenStatus.length === limit,
    };
  },
});

// 2. Guest Mode Helper - Ultra Simple
async function getLocalTrends(ctx: any, geohash: string, limit: number, sevenDaysAgo: number, cursor: number) {
  
  // Simple content query - no geohash complexity
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  const content = await ctx.db
    .query("content")
    .filter((q: any) => q.and(
      q.gte(q.field("createdAt"), thirtyDaysAgo),
      q.lt(q.field("createdAt"), cursor)
    ))
    .order("desc")
    .take(limit);

  return {
    items: content,
    nextCursor: content.length > 0 ? content[content.length - 1].createdAt : null,
    hasMore: content.length === limit,
  };
}

// 3. Celebrity Pull Helper (Optimized for Scale)
async function getCelebrityPull(ctx: any, userId: string, seenContentIds: Set<string>, sevenDaysAgo: number, cursor: number): Promise<(Doc<"content"> & { isSeen: boolean })[]> {
  // Limit to top 20 celebrity businesses to prevent memory issues
  const celebrityFavorites = await ctx.db
    .query("favorites")
    .withIndex("by_user_score", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.and(
      q.gt(q.field("affinityScore"), 100),
      q.eq(q.field("isCelebrity"), true)
    ))
    .order("desc") // Get highest affinity scores first
    .take(20); // Limit to prevent performance issues

  if (celebrityFavorites.length === 0) {
    return [];
  }

  // Extract business IDs for parallel queries
  const businessIds = celebrityFavorites.map((fav: any) => fav.businessId);

  // Query each business separately in parallel using the by_business index
  const celebrityContentArrays = await Promise.all(
    businessIds.map(async (businessId: any) =>
      ctx.db
        .query("content")
        .withIndex("by_business", (q: any) => q.eq("businessId", businessId))
        .filter((q: any) => q.and(
          q.gte(q.field("createdAt"), sevenDaysAgo),
          q.lt(q.field("createdAt"), cursor),
          q.eq(q.field("isCelebrity"), true)
        ))
        .order("desc")
        .take(2) // Take latest 2 posts per business
    )
  );

  // Flatten results and include seen content
  const allCelebrityContent = celebrityContentArrays
    .flat()
    .map((content) => ({ ...content, isSeen: seenContentIds.has(content._id) }));

  // Return max 40 items: 20 businesses × 2 posts each
  return allCelebrityContent;
}
