import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const toggleFavorite = mutation({
  args: { userId: v.id("users"), businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("businessId"), args.businessId))
      .unique();

    const user = await ctx.db.get(args.userId);
    const currentCount = user?.favoritesCount ?? 0;

    if (existing) {
      await ctx.db.delete(existing._id);
      // Decrease count
      await ctx.db.patch(args.userId, { 
        favoritesCount: Math.max(0, currentCount - 1) 
      });
      return false;
    } else {
      await ctx.db.insert("favorites", { userId: args.userId, businessId: args.businessId });
      // Increase count
      await ctx.db.patch(args.userId, { 
        favoritesCount: currentCount + 1 
      });
      return true;
    }
  },
});

export const getUserFavorites = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // 1. Get the favorite link records
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // 2. Fetch the actual business data for each favorite
    const businesses = await Promise.all(
      favorites.map(async (fav) => {
        return await ctx.db.get(fav.businessId);
      })
    );

    // 3. Filter out any nulls and return
    return businesses.filter((b) => b !== null);
  },
});
