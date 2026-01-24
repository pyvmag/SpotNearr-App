import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getExploreData = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("businessCategories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const groupedData = await Promise.all(
      categories.map(async (category) => {
        const types = await ctx.db
          .query("businessTypes")
          .withIndex("by_categoryId", (q) => q.eq("categoryId", category._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        return {
          ...category,
          types, 
        };
      })
    );

    return groupedData.filter((cat) => cat.types.length > 0);
  },
});



function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export const getBusinessesByTypeAndLocation = query({
  args: { 
    typeId: v.id("businessTypes"),
    userLat: v.optional(v.float64()),
    userLng: v.optional(v.float64()),
    radius: v.optional(v.number()), // Radius in Km (default 1)
  },
  handler: async (ctx, args) => {
    // 1. Safety Check: If location is missing, return empty list
    if (!args.userLat || !args.userLng) {
      return []; 
    }

    const radius = args.radius ?? 1;
    
    // 2. Calculate the "Bounding Box" for Latitude
    const latDegrees = radius / 111.32; 
    const minLat = args.userLat - latDegrees;
    const maxLat = args.userLat + latDegrees;

    // 3. DATABASE QUERY (Fast Filter)
    const candidates = await ctx.db
      .query("businesses")
      .withIndex("by_type_lat", (q) => 
        q.eq("typeId", args.typeId)
         .gte("lat", minLat)
         .lte("lat", maxLat)
      )
      .collect();

    // 4. MEMORY FILTER (Precise Filter)
    const nearbyBusinesses = candidates.map((b) => {

       const distance = (b.lat && b.lng) 
         ? getDistanceFromLatLonInKm(
             args.userLat!,
             args.userLng!,
             b.lat,
             b.lng
           ) 
         : Infinity;

       return { ...b, distance };
    })
    .filter((b) => b.distance <= radius) // Infinity will fail this check
    .sort((a, b) => a.distance - b.distance); // Sort: Nearest first

    return nearbyBusinesses;
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
      .collect();
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
      .collect();
  },
});

export const getBusinessCategories = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("businessCategories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
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
      .collect();
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