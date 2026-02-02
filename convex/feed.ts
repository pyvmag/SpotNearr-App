import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getGeohashNeighbors } from "./geohash";

export const getFeed = query({
  args: {
    geohash: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor || Date.now(); // Use timestamp as cursor
    const identity = await ctx.auth.getUserIdentity();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

    // --- 1. GUEST MODE (Location Only) ---
    // If not logged in, just show what's trending nearby
    if (!identity) {
      return await getLocalTrends(ctx, args.geohash, limit, sevenDaysAgo, cursor);
    }

    // --- 2. RESOLVE USER (Better Auth Fix) ---
    // We search by 'authUserId' (identity.subject) because tokenIdentifier 
    // format is different when using external auth providers.
    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .unique();

    // If user record is missing for some reason, fallback to Guest Mode
    if (!user) {
      console.log("User not found in DB:", identity.subject);
      return await getLocalTrends(ctx, args.geohash, limit, sevenDaysAgo, cursor);
    }

    // --- 3. AUTHENTICATED MODE (Hybrid Feed) ---

    // A. Get user's seen content IDs (for filtering)
    const seenContentIds = new Set(
      (await ctx.db
        .query("seen_content")
        .withIndex("by_user_content", (q) => q.eq("userId", user._id))
        .collect())
        .map(item => item.contentId)
    );

    // B. Fetch "Celebrity Pull" (Celebrity Business Content)
    const celebrityContent = await getCelebrityPull(ctx, user._id, seenContentIds, sevenDaysAgo, cursor);

    // C. Fetch "Inbox" (Pushed Content) - Only within 7 days, paginated by cursor
    const inboxItems = await ctx.db
      .query("user_feed_items")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .filter((q: any) => q.and(
        q.gte(q.field("createdAt"), sevenDaysAgo),
        q.lt(q.field("createdAt"), cursor)
      ))
      .order("desc")
      .take(limit * 2); // Fetch more to account for seen content filtering

    // C. Fetch "Local Discovery" (Nearby Content) - Only within 7 days, paginated by cursor
    const neighborHashes = getGeohashNeighbors(args.geohash);
    const localItemsArrays = await Promise.all(
      neighborHashes.map(async (hash) => {
        return await ctx.db
          .query("content")
          .withIndex("by_geo_score", (q) => q.eq("geohash_6", hash))
          .filter((q: any) => q.and(
            q.gte(q.field("createdAt"), sevenDaysAgo),
            q.lt(q.field("createdAt"), cursor)
          ))
          .order("desc")
          .take(Math.ceil(limit * 2 / neighborHashes.length)); // Distribute limit across neighbors
      })
    );

    // Merge and deduplicate local items
    const localItems = localItemsArrays.flat().filter((content, index, self) =>
      index === self.findIndex((c) => c._id === content._id)
    );

    // --- 4. FILTER SEEN CONTENT & MERGE & DEDUPLICATE ---

    // Resolve the Feed Pointers (from Inbox) to actual Content IDs
    const inboxContentDocs = await Promise.all(
      inboxItems.map((item) => ctx.db.get(item.contentId))
    );

    // Filter out nulls (in case a post was deleted but feed item remained)
    const validInboxContent = inboxContentDocs.filter((c): c is Doc<"content"> => c !== null);

    // Merge: Celebrity first, then Inbox, then Local
    const allContent = [...celebrityContent, ...validInboxContent, ...localItems];

    // Filter out seen content and deduplicate
    const uniqueMap = new Map<string, Doc<"content">>();
    for (const item of allContent) {
      // Skip if already seen or already added
      if (!seenContentIds.has(item._id) && !uniqueMap.has(item._id)) {
        uniqueMap.set(item._id, item);
      }
    }

    // --- 5. FINAL SORT & RETURN ---
    const sortedFeed = Array.from(uniqueMap.values())
      .sort((a, b) => b.createdAt - a.createdAt) // Newest first
      .slice(0, limit);

    return {
      items: sortedFeed,
      nextCursor: sortedFeed.length > 0 ? sortedFeed[sortedFeed.length - 1].createdAt : null,
      hasMore: sortedFeed.length === limit,
    };
  },
});


// 2. Guest Mode Helper
async function getLocalTrends(ctx: any, geohash: string, limit: number, sevenDaysAgo: number, cursor: number) {
  // Get neighboring geohashes to handle edge cases
  const neighborHashes = getGeohashNeighbors(geohash);

  // Query all neighboring geohashes and merge results
  const contentArrays = await Promise.all(
    neighborHashes.map(async (hash) => {
      return await ctx.db
        .query("content")
        .withIndex("by_geo_score", (q: any) => q.eq("geohash_6", hash))
        .filter((q: any) => q.and(
          q.gte(q.field("createdAt"), sevenDaysAgo),
          q.lt(q.field("createdAt"), cursor)
        ))
        .order("desc")
        .take(Math.ceil(limit / neighborHashes.length)); // Distribute limit across neighbors
    })
  );

  // Merge and deduplicate content
  const content = contentArrays.flat().filter((item, index, self) =>
    index === self.findIndex((c) => c._id === item._id)
  );

  // Sort by feedScore (highest first) then by createdAt (newest first) for tie-breaking
  content.sort((a, b) => {
    if (b.feedScore !== a.feedScore) {
      return b.feedScore - a.feedScore;
    }
    return b.createdAt - a.createdAt;
  });

  // Apply final limit
  const finalContent = content.slice(0, limit);

  return {
    items: finalContent,
    nextCursor: finalContent.length > 0 ? finalContent[finalContent.length - 1].createdAt : null,
    hasMore: finalContent.length === limit,
  };
}

// 3. Celebrity Pull Helper (Optimized for Scale)
async function getCelebrityPull(ctx: any, userId: string, seenContentIds: Set<string>, sevenDaysAgo: number, cursor: number): Promise<Doc<"content">[]> {
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

  // Flatten results and filter out seen content
  const allCelebrityContent = celebrityContentArrays
    .flat()
    .filter((content) => !seenContentIds.has(content._id));

  // Return max 40 items: 20 businesses × 2 posts each
  return allCelebrityContent;
}
