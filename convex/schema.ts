import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";



export const User = {

  email: v.string(),

  authUserId: v.string(),

  imageUrl: v.optional(v.string()),

  username: v.optional(v.string()),

  tokenIdentifier: v.optional(v.string()),

  name: v.optional(v.string()),

  bio: v.optional(v.string()),

  websiteUrl: v.optional(v.string()),

  favoritesCount: v.optional(v.number()),

  friendsCount: v.optional(v.number()),

  pushToken: v.optional(v.string()),

  role: v.optional(

    v.union(v.literal("user"), v.literal("service_provider"))

  ),

  profileCompleted: v.optional(v.boolean()),

};



export const BusinessCategory = {

  name: v.string(),

  slug: v.string(),

  isActive: v.boolean(),

  createdAt: v.number(),

};



export const BusinessType = {

  name: v.string(),

  slug: v.string(),

  categoryId: v.id("businessCategories"),

  isActive: v.boolean(),

  createdAt: v.number(),

  iconName: v.optional(v.string()),

};



export const Business = {

  ownerId: v.id("users"),



  name: v.string(),

  business_name: v.optional(v.string()),

  typeId: v.id("businessTypes"),

  lat: v.float64(),

  lng: v.float64(),

  location: v.optional(v.string()),

  profileImage: v.optional(v.string()),

  profileImagePublicId: v.optional(v.string()),



  coverImage: v.optional(v.string()),

  coverImagePublicId: v.optional(v.string()),

  address: v.optional(v.string()),

  bio: v.optional(v.string()),

  createdAt: v.number(),

  rating: v.optional(v.number()),

  reviewCount: v.optional(v.number()),

  

  // Location & Scoring

  geohash_6: v.string(),

  geohash_5: v.string(),

  recommendationScore: v.number(),

  isCelebrity: v.optional(v.boolean()),

};



export const Content = {

  businessId: v.id("businesses"),

  type: v.union(v.literal("post"), v.literal("offer")),

  imageUrl: v.string(),

  imageUrlPublic: v.optional(v.string()),

  caption: v.string(),

  offerTitle: v.optional(v.string()),

  expiryDate: v.optional(v.number()),

  isExpired: v.optional(v.boolean()),

  
  // IMPORTANT: These must exist to be indexed

  geohash_6: v.string(), 

  geohash_5: v.string(), 

  feedScore: v.number(),

  createdAt: v.number(),
  
  // Denormalized business data for faster reads

  businessName: v.string(),

  businessIcon: v.optional(v.string()),

  isCelebrity: v.boolean(),

};



export const Favorite = {

  userId: v.id("users"),

  businessId: v.id("businesses"),

  isCelebrity: v.boolean(),

  affinityScore: v.number(),

};



export const Friends = {

  userAId: v.id("users"),

  userBId: v.id("users"), 

  status: v.union(

    v.literal("pending"),

    v.literal("accepted"),

    v.literal("blocked")

  )

};



export const Review = {

  userId: v.id("users"),

  businessId: v.id("businesses"),

  rating: v.number(), // 1 to 5

  content: v.string(),

  imageUrl: v.optional(v.string()),

  createdAt: v.number(),

};



// THE BUFFER: Stores raw events temporarily

export const InteractionBuffer = {

  userId: v.optional(v.id("users")),       // Optional: Guests have no ID

  businessId: v.id("businesses"),

  contentId: v.optional(v.id("content")),  // Optional: Profile visits have no content

  

  type: v.union(

    v.literal("view"), 

    v.literal("like"), 

    v.literal("share"), 

    v.literal("visit")

  ),

  

  createdAt: v.number(),

};



export const UserFeedItem = {

  userId: v.id("users"),

  contentId: v.id("content"),

  businessId: v.id("businesses"),

  createdAt: v.number(),

};



export const SeenContent = {

  userId: v.id("users"),

  contentId: v.id("content"),

  createdAt: v.number(),

};



export default defineSchema({

  users: defineTable(User)

    .index("by_username", ["username"])

    .index("by_authUserId", ["authUserId"])

    .index("by_token", ["tokenIdentifier"]),



  businesses: defineTable(Business)

    .index("by_ownerId", ["ownerId"])

    .index("by_typeId", ["typeId"])

    .index("by_business_name", ["business_name"])

    // For filtering by specific Category + Location (e.g., "Food near me")

    .index("by_type_geo6_score", ["typeId", "geohash_6", "recommendationScore"])

    .index("by_type_geo5_score", ["typeId", "geohash_5", "recommendationScore"])

    // For General Explore ("Best spots near me regardless of type")

    .index("by_geo6_score", ["geohash_6", "recommendationScore"]),



  businessTypes: defineTable(BusinessType)

    .index("by_slug", ["slug"])

    .index("by_categoryId", ["categoryId"])

    .index("by_isActive", ["isActive"])

    .index("by_category_active", ["categoryId", "isActive"]),



  businessCategories: defineTable(BusinessCategory)

    .index("by_slug", ["slug"])

    .index("by_isActive", ["isActive"]),



  content: defineTable(Content)

    .index("by_business", ["businessId"])

    .index("by_type", ["type"])

    // The main index for Local Trending Feed

    .index("by_geo_score", ["geohash_6", "feedScore"]),



  favorites: defineTable(Favorite)

    .index("by_userId", ["userId"])

    .index("by_businessId", ["businessId"])

    .index("by_user_and_business", ["userId", "businessId"])

    // The main index for "Top 30" Affinity Feed

    .index("by_user_score", ["userId", "affinityScore"]),



  friends: defineTable(Friends)

    .index("by_userAId", ["userAId"])

    .index("by_userBId", ["userBId"])

    .index("by_both_users", ["userAId", "userBId"]),



  reviews: defineTable(Review)

    .index("by_business", ["businessId"])

    .index("by_user", ["userId"]),

    

  // The Buffer Table

  interaction_buffer: defineTable(InteractionBuffer)

    .index("by_created", ["createdAt"]),

    

  // Cron uses this to grab oldest items
  user_feed_items: defineTable(UserFeedItem)
    .index("by_created", ["createdAt"])
    .index("by_user_created", ["userId", "createdAt"]),

  // Track seen content for users
  seen_content: defineTable(SeenContent)
    .index("by_user_content", ["userId", "contentId"])
    .index("by_created", ["createdAt"]),
});