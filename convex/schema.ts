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
  lat: v.optional(v.float64()),
  lng: v.optional(v.float64()),
  location: v.optional(v.string()),
  profileImage: v.optional(v.string()),
  profileImagePublicId: v.optional(v.string()),

  coverImage: v.optional(v.string()),
  coverImagePublicId: v.optional(v.string()),
  address: v.optional(v.string()),
  bio: v.optional(v.string()),
  createdAt: v.number(),
};

export const Content = {
  businessId: v.id("businesses"),
  type: v.union(v.literal("post"), v.literal("offer")),

  imageUrl: v.string(),
  imageUrlPublic: v.optional(v.string()),
  caption: v.string(),

  // Offer-only
  offerTitle: v.optional(v.string()),
  expiryDate: v.optional(v.number()),
  isExpired: v.optional(v.boolean()),

  createdAt: v.number(),
};

export const seenContent = {
  userId: v.id("users"),
  contentId: v.id("content"),
  contentCreatedAt: v.number(),
}

export const Favorite = {
  userId: v.id("users"),
  businessId: v.id("businesses"),
};

export const Friends = {
  userAId: v.id("users"), // The person who sent the request
  userBId: v.id("users"), // The person receiving it
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("blocked")
  )
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
    .index("by_type_lat", ["typeId", "lat"]),

  businessTypes: defineTable(BusinessType)
    .index("by_slug", ["slug"])
    .index("by_categoryId", ["categoryId"]),


  businessCategories: defineTable(BusinessCategory)
    .index("by_slug", ["slug"]),

  content: defineTable(Content)
    .index("by_business", ["businessId"])
    .index("by_type", ["type"]),

  favorites: defineTable(Favorite)
    .index("by_userId", ["userId"])
    .index("by_businessId", ["businessId"])
    .index("by_user_and_business", ["userId", "businessId"]),

  friends: defineTable(Friends)
    .index("by_userAId", ["userAId"])
    .index("by_userBId", ["userBId"])
    .index("by_both_users", ["userAId", "userBId"]),

  seenContent: defineTable(seenContent)
    .index("by_user_content", ["userId", "contentId"])
    .index("content_createdAt", ["contentCreatedAt"]),
});
