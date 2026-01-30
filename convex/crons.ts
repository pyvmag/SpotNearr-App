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
        affinityUpdates.set(key, (affinityUpdates.get(key) || 0) + weights.affinity);
      }

      // B. Update Business Score
      businessUpdates.set(item.businessId, (businessUpdates.get(item.businessId) || 0) + weights.business);

      // C. Update Content Score (If content exists)
      if (item.contentId) {
        contentUpdates.set(item.contentId, (contentUpdates.get(item.contentId) || 0) + weights.content);
      }
    }

    // 4. Execute Updates (Parallel for speed) with error handling
    const promises = [];
    const successfulItems = new Set<Id<"interaction_buffer">>();

    try {
      // Update Favorites
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
              const newScore = Math.min(100, fav.affinityScore + boost);
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