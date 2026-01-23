import { DatabaseReader } from "../_generated/server";

const FEED_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function getFavoriteFeedSourceInternal(
  ctx: { db: DatabaseReader },
  userId: string,
  limit: number,
  cursor: number
) {
  const cutoff = Date.now() - FEED_WINDOW_MS;
  const favorites = await ctx.db
    .query("favorites")
    .withIndex("by_userId", (q) => q.eq("userId", userId as any))
    .collect();

  if (favorites.length === 0) return [];

  const results: any[] = [];
  
  for (const fav of favorites) {
    const content = await ctx.db
      .query("content")
      .withIndex("by_business", (q) =>
        q.eq("businessId", fav.businessId)
      )
      .filter((q) =>
        q.and(
          q.lt(q.field("createdAt"), cursor), // 👈 cursor paging
          q.gte(q.field("createdAt"), cutoff)
        )
      )
      .order("desc")
      .take(3);

    results.push(...content);
  }

  results.sort((a, b) => b.createdAt - a.createdAt);
  return results.slice(0, limit);
}
