import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

const USERNAME_REGEX = /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/;

/**
 * Create user on first login
 */
export const createUserIfNotExists = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) throw new Error("Not authenticated");

    // FIX: Better Auth unique ID is 'id'. 
    // Do not use ._id as that refers to Convex internal IDs.
    const authUserId = authUser._id; 

    if (!authUserId) {
      throw new Error("Missing auth user identifier from session");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
      .unique();

    if (existingUser) return existingUser;

    const userId = await ctx.db.insert("users", {
      authUserId,
      email: authUser.email!,
      name: authUser.name || "New User",
      imageUrl: authUser.image?? undefined,
      role: "user",
      profileCompleted: false,
    })

    return await ctx.db.get(userId);
  },
});

export const updateProfile = mutation({
  args: {
    role: v.optional(v.union(v.literal("user"), v.literal("service_provider"))),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    profileCompleted: v.optional(v.boolean()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) throw new Error("Not authenticated");

    // FIX: Query by authUserId using authUser._id
    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUser._id))
      .unique();

    if (!user) throw new Error("User record not found");

    if (args.username) {
      const username = args.username.toLowerCase();
      if (!USERNAME_REGEX.test(username)) throw new Error("Invalid username");

      if (username !== user.username) {
        const taken = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", username))
          .unique();
        if (taken) throw new Error("Username already taken");
      }
    }

    await ctx.db.patch(user._id, {
      ...args,
      username: args.username?.toLowerCase() ?? user.username,
    });

    return user._id;
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    try {
      // 1. We wrap this in a try/catch because the helper throws 
      // an 'Unauthenticated' error if the session is not yet active.
      const authUser = await authComponent.getAuthUser(ctx);
      
      if (!authUser || !authUser._id) {
        return null;
      }

      // 2. Look up the profile in your custom users table
      return await ctx.db
        .query("users")
        .withIndex("by_authUserId", (q) => 
          q.eq("authUserId", authUser._id as string)
        )
        .unique();
        
    } catch (error) {
      // 3. If authComponent throws 'Unauthenticated', we catch it 
      // and return null. This prevents the frontend from crashing.
      return null;
    }
  },
});


/**
 * Get user by Convex user ID
 */
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Check username availability
 */
export const checkUsernameAvailability = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const username = args.username.toLowerCase();

    if (!USERNAME_REGEX.test(username)) return false;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) =>
        q.eq("username", username)
      )
      .unique();

    return !existingUser;
  },
});

/**
 * Admin / internal lookup only
 */
export const getUserByAuthUserId = query({
  args: { authUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) =>
        q.eq("authUserId", args.authUserId)
      )
      .unique();
  },
});

/**
 * Admin / internal existence check
 */
export const checkUserExistsByAuthUserId = query({
  args: { authUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) =>
        q.eq("authUserId", args.authUserId)
      )
      .unique();

    return !!user;
  },
});
