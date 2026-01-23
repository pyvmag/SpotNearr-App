import { v } from "convex/values";
import { query } from "../_generated/server";
import { getFavoriteFeedSourceInternal } from "./feedSources";

export const getFavoriteFeedSource = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // 👈 NEW
  },
  handler: async (ctx, args) => {
    return getFavoriteFeedSourceInternal(
      ctx,
      args.userId,
      args.limit ?? 20,
      args.cursor ?? Date.now()
    );
  },
});
