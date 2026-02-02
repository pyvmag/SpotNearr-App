import { internalMutation } from "./_generated/server";
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api"; // Fix 1: Import internal
import { Id } from "./_generated/dataModel"; // Fix 2: Import Id type

const crons = cronJobs();

// Run every 15 minutes (Optimized time)
crons.interval(
  "process-interactions",
  { minutes: 15 },
  internal.crons.processInteractionBuffer
);

// Run daily at midnight to clean up old seen content
crons.interval(
  "cleanup-seen-content",
  { hours: 24 },
  internal.crons.cleanupSeenContent
);

// Run daily at 2 AM to apply time decay to content scores
crons.interval(
  "apply-content-time-decay",
  { hours: 24 },
  internal.crons.applyContentTimeDecay
);

export default crons;

// Weights Configuration
// We define the type explicitly to avoid index errors
const SCORES: Record<string, { affinity: number; business: number; content: number }> = {
  view: { affinity: 1, business: 0.1, content: 1 },
  like: { affinity: 5, business: 2, content: 5 },
  share: { affinity: 10, business: 5, content: 10 },
  visit: { affinity: 3, business: 1, content: 0 },
};

export const processInteractionBuffer = internalMutation({
  handler: async (ctx) => {
    // 1. Get oldest 500 items
    const items = await ctx.db.query("interaction_buffer")
      .withIndex("by_created")
      .take(500);

    if (items.length === 0) return;

    // 2. Prepare Aggregations
    const affinityUpdates = new Map<string, number>(); // Key: userId_businessId
    const viewPatterns = new Map<string, number>(); // Track view counts for negative scoring
    const likePatterns = new Map<string, number>(); // Track like counts for ratio calculation
    // Fix 3: Explicitly type the ID maps to avoid casting issues later
    const businessUpdates = new Map<Id<"businesses">, number>();
    const contentUpdates = new Map<Id<"content">, number>();

    // 3. Process Items
    for (const item of items) {
      // Safety check: ensure the type exists in our SCORES object
      const weights = SCORES[item.type] || SCORES.view;

      // A. Update Affinity (Only if user is logged in)
      if (item.userId) {
        const key = `${item.userId}_${item.businessId}`;

        // Track view and like patterns for negative scoring
        if (item.type === "view") {
          viewPatterns.set(key, (viewPatterns.get(key) || 0) + 1);
        } else if (item.type === "like") {
          likePatterns.set(key, (likePatterns.get(key) || 0) + 1);
        }

        // Apply positive affinity scores
        affinityUpdates.set(key, (affinityUpdates.get(key) || 0) + weights.affinity);
      }

      // B. Update Business Score
      businessUpdates.set(item.businessId, (businessUpdates.get(item.businessId) || 0) + weights.business);

      // C. Update Content Score (If content exists) - We'll apply time decay later
      if (item.contentId) {
        contentUpdates.set(item.contentId, (contentUpdates.get(item.contentId) || 0) + weights.content);
      }
    }

    // 4. Execute Updates (Parallel for speed) with error handling
    const promises = [];
    const successfulItems = new Set<Id<"interaction_buffer">>();

    try {
      // Apply Negative Affinity Scoring First
      for (const [key, viewCount] of viewPatterns) {
        const likeCount = likePatterns.get(key) || 0;

        // Calculate penalty based on view-to-like ratio
        let penalty = 0;
        if (viewCount >= 1 && likeCount === 0) {
          penalty = -5; // 1 view, no like
        } else if (viewCount >= 2 && likeCount === 0) {
          penalty = -10; // 2+ views, no like
        } else if (viewCount >= 5 && likeCount === 0) {
          penalty = -15; // 5+ views, no like
        }

        if (penalty !== 0) {
          const parts = key.split("_");
          const uId = parts[0] as Id<"users">;
          const bId = parts[1] as Id<"businesses">;

          promises.push((async () => {
            try {
              const fav = await ctx.db.query("favorites")
                .withIndex("by_user_and_business", q => q.eq("userId", uId).eq("businessId", bId))
                .unique();

              if (fav) {
                const newScore = Math.max(50, fav.affinityScore + penalty); // Minimum score of 50
                await ctx.db.patch(fav._id, { affinityScore: newScore });
              }
            } catch (error) {
              console.error("Failed to apply negative affinity:", error);
            }
          })());
        }
      }

      // Update Favorites with Positive Scores
      for (const [key, boost] of affinityUpdates) {
        const parts = key.split("_");
        // Fix 4: Correctly cast strings back to IDs
        const uId = parts[0] as Id<"users">;
        const bId = parts[1] as Id<"businesses">;

        promises.push((async () => {
          try {
            const fav = await ctx.db.query("favorites")
              .withIndex("by_user_and_business", q => q.eq("userId", uId).eq("businessId", bId))
              .unique();

            if (fav) {
              const newScore = Math.min(200, fav.affinityScore + boost); // Max score of 200
              await ctx.db.patch(fav._id, { affinityScore: newScore });
            }
          } catch (error) {
            console.error("Failed to update favorite:", error);
            throw error; // Re-throw to track which items failed
          }
        })());
      }

      // Update Businesses
      for (const [bId, boost] of businessUpdates) {
        promises.push((async () => {
          try {
            const biz = await ctx.db.get(bId);
            if (biz) {
              await ctx.db.patch(biz._id, { recommendationScore: (biz.recommendationScore || 0) + boost });
            }
          } catch (error) {
            console.error("Failed to update business:", error);
            throw error;
          }
        })());
      }

      // Update Content
      for (const [cId, boost] of contentUpdates) {
        promises.push((async () => {
          try {
            const content = await ctx.db.get(cId);
            if (content) {
              await ctx.db.patch(content._id, { feedScore: (content.feedScore || 0) + boost });
            }
          } catch (error) {
            console.error("Failed to update content:", error);
            throw error;
          }
        })());
      }

      // Wait for all updates to complete
      await Promise.all(promises);

      // If we get here, all updates succeeded
      items.forEach(item => successfulItems.add(item._id));

    } catch (error) {
      console.error("Some updates failed in processInteractionBuffer:", error);
      // Still try to clean up what we can - this is a best effort
      // In a production system, you might want more sophisticated error handling
    }

    // 5. Cleanup - Always clean up successful items, even if some updates failed
    try {
      await Promise.all(
        Array.from(successfulItems).map(itemId => {
          const item = items.find(i => i._id === itemId);
          return item ? ctx.db.delete(item._id) : Promise.resolve();
        })
      );
    } catch (cleanupError) {
      console.error("Failed to cleanup interaction buffer:", cleanupError);
    }
  },
});

export const cleanupSeenContent = internalMutation({
  handler: async (ctx) => {
    // Delete seen content older than 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    const oldSeenContent = await ctx.db
      .query("seen_content")
      .withIndex("by_created", (q) => q.lt("createdAt", sevenDaysAgo))
      .take(1000); // Process in batches

    if (oldSeenContent.length > 0) {
      await Promise.all(oldSeenContent.map(item => ctx.db.delete(item._id)));
    }
  },
});

export const applyContentTimeDecay = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - (14 * oneDay); // Only process content from last 14 days

    // Get content from last 14 days only (relevant window for decay)
    const content = await ctx.db
      .query("content")
      .filter((q) => q.gte(q.field("createdAt"), fourteenDaysAgo))
      .take(500); // Larger batch size since we're processing fewer items

    if (content.length === 0) return;

    const updates = [];

    for (const item of content) {
      const ageInDays = Math.floor((now - (item.createdAt || 0)) / oneDay);
      let decayFactor = 1.0;

      // Calculate time decay factor
      if (ageInDays >= 14) {
        decayFactor = 0.1; // 14+ days: 10% of original score
      } else if (ageInDays >= 7) {
        decayFactor = 0.2; // 7-13 days: 20% of original score
      } else if (ageInDays >= 3) {
        decayFactor = 0.6; // 3-6 days: 60% of original score
      } else if (ageInDays >= 2) {
        decayFactor = 0.8; // 2 days: 80% of original score
      }
      // Day 0-1: 100% (no decay)

      // Apply decay to feedScore
      const currentScore = item.feedScore || 0;
      const baseScore = currentScore / (item.lastDecayFactor || 1.0); // Remove previous decay
      const newScore = Math.floor(baseScore * decayFactor);

      if (newScore !== currentScore) {
        updates.push(
          ctx.db.patch(item._id, {
            feedScore: newScore,
            lastDecayFactor: decayFactor
          })
        );
      }
    }

    // Execute updates in parallel
    await Promise.all(updates);
  },
});