import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

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

    // B. Fetch "Inbox" (Pushed Content) - Only within 7 days, paginated by cursor
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
    const localItems = await ctx.db
      .query("content")
      .withIndex("by_geo_score", (q) => q.eq("geohash_6", args.geohash))
      .filter((q: any) => q.and(
        q.gte(q.field("createdAt"), sevenDaysAgo),
        q.lt(q.field("createdAt"), cursor)
      ))
      .order("desc")
      .take(limit * 2); // Fetch more to account for seen content filtering

    // --- 4. FILTER SEEN CONTENT & MERGE & DEDUPLICATE ---
    
    // Resolve the Feed Pointers (from Inbox) to actual Content IDs
    const inboxContentDocs = await Promise.all(
      inboxItems.map((item) => ctx.db.get(item.contentId))
    );

    // Filter out nulls (in case a post was deleted but feed item remained)
    const validInboxContent = inboxContentDocs.filter((c): c is Doc<"content"> => c !== null);

    // Merge: Inbox first, then Local
    const allContent = [...validInboxContent, ...localItems];

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
      items: sortedFeed, // No enrichment needed - data is denormalized
      nextCursor: sortedFeed.length > 0 ? sortedFeed[sortedFeed.length - 1].createdAt : null,
      hasMore: sortedFeed.length === limit,
    };
  },
});


// 2. Guest Mode Helper
async function getLocalTrends(ctx: any, geohash: string, limit: number, sevenDaysAgo: number, cursor: number) {
  const content = await ctx.db
    .query("content")
    .withIndex("by_geo_score", (q: any) => q.eq("geohash_6", geohash))
    .filter((q: any) => q.and(
      q.gte(q.field("createdAt"), sevenDaysAgo),
      q.lt(q.field("createdAt"), cursor)
    ))
    .order("desc")
    .take(limit);

  return {
    items: content, // No enrichment needed - data is denormalized
    nextCursor: content.length > 0 ? content[content.length - 1].createdAt : null,
    hasMore: content.length === limit,
  };
}