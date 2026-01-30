import { v } from "convex/values";

import { mutation, internalMutation, query } from "./_generated/server";

import { internal } from "./_generated/api";



// --- QUERIES ---



export const getContentByBusiness = query({

  args: { businessId: v.optional(v.id("businesses")) },

  handler: async (ctx, args) => {

    if (!args.businessId) return [];

    const now = Date.now();

    

    const results = await ctx.db

      .query("content")

      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))

      .order("desc")

      .collect();



    // Filter out expired offers

    return results.filter(item => !item.expiryDate || item.expiryDate > now);

  },

});



export const getPostById = query({

  args: { id: v.id("content") },

  handler: async (ctx, args) => {

    return await ctx.db.get(args.id);

  },

});



// --- MUTATIONS ---



export const createContent = mutation({

  args: {

    businessId: v.id("businesses"),

    type: v.union(v.literal("post"), v.literal("offer")),

    imageUrl: v.string(),

    imageUrlPublic: v.optional(v.string()),

    caption: v.string(),

    offerTitle: v.optional(v.string()),

    expiryDate: v.optional(v.number()),

  },

  handler: async (ctx, args) => {

    const business = await ctx.db.get(args.businessId);

    if (!business) throw new Error("Business not found");



    // 1. Create the Content (Master Record)

    const contentId = await ctx.db.insert("content", {

      businessId: args.businessId,

      type: args.type,

      imageUrl: args.imageUrl,

      imageUrlPublic: args.imageUrlPublic,

      caption: args.caption,

      offerTitle: args.offerTitle,

      expiryDate: args.expiryDate,

      createdAt: Date.now(),
      
      // Denormalized fields for Fast Discovery

      geohash_6: business.geohash_6,

      geohash_5: business.geohash_5,

      feedScore: 0, // Starts at 0, grows via interaction buffer
      
      // Denormalized business data for faster reads

      businessName: business.name,

      businessIcon: business.profileImage,

      isCelebrity: business.isCelebrity || false,

    });



    // 2. SMART FAN-OUT LOGIC - USER'S TOP 50 FAVORITES

    // Only push to users who have this business in their Top 50 favorites

    // This eliminates fan-out storm and scales to 100k+ users

    if (!business.isCelebrity) {

      await ctx.scheduler.runAfter(0, internal.content.fanOutToTopFavorites, {

        businessId: args.businessId,

        contentId: contentId,

        cursor: null,

      });

    }



    return contentId;

  },

});



export const deleteContent = mutation({

  args: { contentId: v.id("content") },

  handler: async (ctx, args) => {

    await ctx.db.delete(args.contentId);

  },

});



export const updateContent = mutation({

  args: {

    contentId: v.id("content"),

    caption: v.string(),

    offerTitle: v.optional(v.string()),

    expiryDate: v.optional(v.number()),

  },

  handler: async (ctx, args) => {

    const { contentId, ...updateData } = args;

    await ctx.db.patch(contentId, updateData);

    return contentId;

  },

});



// --- INTERNAL WORKERS ---



export const fanOutToTopFavorites = internalMutation({

  args: {

    businessId: v.id("businesses"),

    contentId: v.id("content"),

    cursor: v.union(v.string(), v.null()),

  },

  handler: async (ctx, args) => {

    // A. Get users with affinityScore > 100 using pagination

    const { page, isDone, continueCursor } = await ctx.db

      .query("favorites")

      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))

      .filter((q) => q.gt(q.field("affinityScore"), 100))

      .paginate({ cursor: args.cursor, numItems: 100 });

    // B. Insert into their UserFeed (for notification purposes)

    const writes = page.map((fav) => 

      ctx.db.insert("user_feed_items", {

        userId: fav.userId,

        contentId: args.contentId,

        businessId: args.businessId,

        createdAt: Date.now(),

      })

    );

    await Promise.all(writes);

    // C. Recursive Step (Process next batch)

    if (!isDone) {

      await ctx.scheduler.runAfter(0, internal.content.fanOutToTopFavorites, {

        businessId: args.businessId,

        contentId: args.contentId,

        cursor: continueCursor,

      });

    }

  },

});



export const fanOutToFollowers = internalMutation({

  args: {

    businessId: v.id("businesses"),

    contentId: v.id("content"),

    cursor: v.union(v.string(), v.null()),

  },

  handler: async (ctx, args) => {

    // A. Get Followers, but FILTER efficiently

    // We only push to users with affinityScore > 0.

    // This ignores "Ghost Followers" (people who never interact).

    const { page, isDone, continueCursor } = await ctx.db

      .query("favorites")

      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))

      .filter((q) => q.gt(q.field("affinityScore"), 0)) 

      .paginate({ cursor: args.cursor, numItems: 100 });



    // B. Insert into their Inbox (UserFeed)

    const writes = page.map((fav) => 

      ctx.db.insert("user_feed_items", {

        userId: fav.userId,

        contentId: args.contentId,

        businessId: args.businessId,

        createdAt: Date.now(),

      })

    );



    await Promise.all(writes);



    // C. Recursive Step (Process next batch)

    if (!isDone) {

      await ctx.scheduler.runAfter(0, internal.content.fanOutToFollowers, {

        businessId: args.businessId,

        contentId: args.contentId,

        cursor: continueCursor,

      });

    }

  },

});