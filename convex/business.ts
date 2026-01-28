import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { encodeGeohash } from "./geohash";
import { paginationOptsValidator } from "convex/server";

export const getExploreData = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("businessCategories")
      .withIndex("by_isActive", q => q.eq("isActive", true))
      .take(20);

    if (!categories.length) return [];

    const data = await Promise.all(
      categories.map(async (category) => {
        const types = await ctx.db
          .query("businessTypes")
          .withIndex("by_category_active", q =>
            q.eq("categoryId", category._id).eq("isActive", true)
          )
          .take(20);

        return {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          types,
        };
      })
    );
    return data.filter(c => c.types.length > 0);
  },
});


export const getBusinessesByScore = query({
  // Only define the filters you are passing from the frontend
  args: {
    typeId: v.id("businessTypes"),
    geohash: v.string(),
    level: v.union(v.literal(6), v.literal(5)),
    paginationOpts: paginationOptsValidator, // Use the official validator from convex/server
  },
  handler: async (ctx, args) => {
    const indexName = args.level === 6 ? "by_type_geo6_score" : "by_type_geo5_score";
    const hashField = args.level === 6 ? "geohash_6" : "geohash_5";

    return await ctx.db
      .query("businesses")
      .withIndex(indexName, (q) =>
        q.eq("typeId", args.typeId).eq(hashField as any, args.geohash)
      )
      .order("desc") // Show highest Recommendation Score first
      .paginate(args.paginationOpts); 
  },
});
export const updateBusinessScore = mutation({
  args: { businessId: v.id("businesses"), rating: v.number() },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    if (!business) return;

    const newCount = (business.reviewCount ?? 0) + 1;
    const newRating = ((business.rating ?? 0) * (business.reviewCount ?? 0) + args.rating) / newCount;
    
    // SMART SCORE FORMULA: (Rating * 10) + (ReviewCount)
    // This makes sure active shops rise to the top of the neighborhood
    const newScore = (newRating * 10) + newCount;

    await ctx.db.patch(args.businessId, {
      rating: newRating,
      reviewCount: newCount,
      recommendationScore: newScore,
    });
  },
});


export const getBusinessByOwnerId = query({
  args: { 
    ownerId: v.id("users") 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("businesses")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
      .unique();
  },
});

// business.ts

export const getBusinessById = query({
  args: { 
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    if (!business) return null;

    let isFavorited = false;

    if (args.userId) {
      // UPDATED: Using the compound index for instant lookup
      const favorite = await ctx.db
        .query("favorites")
        .withIndex("by_user_and_business", (q) => 
          q.eq("userId", args.userId!).eq("businessId", args.businessId)
        )
        .unique();
      
      isFavorited = !!favorite;
    }

    return {
      ...business,
      isFavorited, 
    };
  },
});

export const getBusinessesByOwner = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("businesses")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
      .take(20);
  },
});

const BUSINESS_NAME_REGEX = /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/;

export const createBusiness = mutation({
  args: {
    ownerId: v.id("users"),
    name: v.string(),
    business_name: v.string(),
    typeId: v.id("businessTypes"),
    lat: v.float64(),
    lng: v.float64(),
    location: v.optional(v.string()),
    address: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const g6 = encodeGeohash(args.lat, args.lng, 6);
    const g5 = g6.substring(0, 5);
    const businessName = args.business_name.toLowerCase();

    // 1. Format Validation
    if (!BUSINESS_NAME_REGEX.test(businessName)) {
      throw new Error("Invalid business name format. Use letters, numbers, dots, or underscores.");
    }

    // 2. Uniqueness Check
    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_business_name", (q) => q.eq("business_name", businessName))
      .unique();

    if (existing) {
      throw new Error("This business name is already taken.");
    }

    const type = await ctx.db.get(args.typeId);
    if (!type || !type.isActive) {
      throw new Error("Invalid business type");
    }

    return await ctx.db.insert("businesses", {
      ownerId: args.ownerId,
      name: args.name,
      business_name: businessName,
      typeId: args.typeId,
      lat: args.lat,
      lng: args.lng,
      location: args.location,
      address: args.address,
      bio: args.bio,
      createdAt: Date.now(),
      geohash_6: g6,
      geohash_5: g5,
      recommendationScore: 0,
    });
  },
});

// Query to check availability as the user types
export const checkBusinessNameAvailability = query({
  args: { business_name: v.string() },
  handler: async (ctx, args) => {
    const name = args.business_name.toLowerCase();
    if (!BUSINESS_NAME_REGEX.test(name)) return false;

    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_business_name", (q) => q.eq("business_name", name))
      .unique();

    return !existing;
  },
});

export const getBusinessTypes = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("businessTypes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(20);
  },
});

export const getBusinessCategories = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("businessCategories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(20);
  },
});

export const getBusinessTypesByCategory = query({
  args: { categoryId: v.id("businessCategories") },
  handler: async (ctx, { categoryId }) => {
    return ctx.db
      .query("businessTypes")
      .withIndex("by_categoryId", (q) =>
        q.eq("categoryId", categoryId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(20);
  },
});

export const updateBusiness = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    bio: v.optional(v.string()),
    address: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    profileImagePublicId: v.optional(v.string()), // Add this
    coverImage: v.optional(v.string()),
    coverImagePublicId: v.optional(v.string()),   // Add this
  },
  handler: async (ctx, args) => {
    const { businessId, ...updateData } = args;
    await ctx.db.patch(businessId, updateData);
    return businessId;
  },
});