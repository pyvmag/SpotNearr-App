import { v } from "convex/values";
import { query } from "../_generated/server";
import { getFavoriteFeedSourceInternal } from "./feedSources";
const FEED_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const getFeed = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const cursor = args.cursor ?? Date.now();
    const cutoff = Date.now() - FEED_WINDOW_MS;

    const candidates = await getFavoriteFeedSourceInternal(
      ctx,
      args.userId,
      limit * 2,
      cursor
    );

    if (candidates.length === 0) return [];

    const seen = await ctx.db
      .query("seenContent")
      .withIndex("by_user_content", (q) =>
        q.eq("userId", args.userId)
      )
      .filter((q) =>
        q.gte(q.field("contentCreatedAt"), cutoff)
      )
      .collect();

    const seenSet = new Set(seen.map((s) => s.contentId));

    const unseen = candidates.filter(
      (post) => !seenSet.has(post._id)
    );

    return unseen.slice(0, limit);
  },
});

