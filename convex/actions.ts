"use node";

import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { deleteCloudinaryImage } from "./lib/cloudinary";

export const deletePostFull = action({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    const authUser = await ctx.auth.getUserIdentity();
    if (!authUser) throw new Error("Not authenticated");

    const user = await ctx.runQuery(api.users.getUserByAuthUserId, {
      authUserId: authUser.subject,
    });
    if (!user) throw new Error("User not found");

    const post = await ctx.runQuery(api.content.getPostById, {
      id: args.contentId,
    });
    if (!post) throw new Error("Post not found");

    // Check ownership via the business
    const business = await ctx.runQuery(api.business.getBusinessById, {
      businessId: post.businessId,
      userId: user._id,
    });
    
    if (!business || business.ownerId !== user._id) {
      throw new Error("Unauthorized");
    }

    // ✅ FIX: Use the stored Public ID instead of extracting from URL
    if (post.imageUrlPublic) {
      await deleteCloudinaryImage(post.imageUrlPublic);
    }

    await ctx.runMutation(api.content.deleteContent, {
      contentId: args.contentId,
    });

    return { success: true };
  },
});

export const updateBusinessFull = action({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    bio: v.string(),
    address: v.string(),
    profileImage: v.string(),
    profileImagePublicId: v.optional(v.string()),
    coverImage: v.string(),
    coverImagePublicId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Fetch current business to see if we need to delete old images
    const currentBusiness = await ctx.runQuery(api.business.getBusinessById, { 
        businessId: args.businessId 
    });

    // 2. If new profile image uploaded, delete old one from Cloudinary
    if (args.profileImagePublicId && currentBusiness?.profileImagePublicId) {
       await deleteCloudinaryImage(currentBusiness.profileImagePublicId);
    }

    // 3. If new cover image uploaded, delete old one from Cloudinary
    if (args.coverImagePublicId && currentBusiness?.coverImagePublicId) {
       await deleteCloudinaryImage(currentBusiness.coverImagePublicId);
    }

    // 4. Update the database using the mutation
    await ctx.runMutation(api.business.updateBusiness, {
      businessId: args.businessId,
      name: args.name,
      bio: args.bio,
      address: args.address,
      profileImage: args.profileImage,
      profileImagePublicId: args.profileImagePublicId ?? currentBusiness?.profileImagePublicId,
      coverImage: args.coverImage,
      coverImagePublicId: args.coverImagePublicId ?? currentBusiness?.coverImagePublicId,
    });
  },
});
