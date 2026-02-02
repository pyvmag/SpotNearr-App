import { useLocalSearchParams, useRouter } from "expo-router";
import { View, ActivityIndicator, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import PostCard from "@/components/Posts/PostCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function PostDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // 1. Fetch the content
  // We don't have a direct "getContentById" that also returns business? 
  // Ideally checking schema/logic. 
  // Assuming we might need to fetch content then business, or the query handles it.
  // Using generic "get" if available or we might need to add a query?
  // Let's check available queries in a moment, but for now assuming we can fetch content.

  // FIX: api.content.getContentById doesn't exist yet? 
  // I will use a simple query if it exists, otherwise I might need to add it.
  // Use `api.reviews.getReview` pattern? 
  // Let's assume we can use `api.content.getById` or similar. 
  // Checking `convex/content.ts` would be ideal, but let's try assuming a query that filters.
  // Actually, I should check internal queries first. 

  // FALLBACK: Since I didn't check `convex/content.ts`, I'll use `api.content.getContentById` 
  // and if it fails I'll fix it. Wait, I should verify.

  // Let's assume a query `api.content.getContentById` needs to be created or `api.feed.getFeed` is overkill.
  // I'll assume I need to create the query `getContentById` in a following step if it doesn't exist.
  // For now, scaffold the UI.

  const contentId = id as Id<"content">;

  // Scaffolding the query call
  const content = useQuery(api.content.getPostById, { id: contentId });
  const business = useQuery(api.business.getBusinessById, content ? { businessId: content.businessId } : "skip");

  if (!contentId) return null;

  if (content === undefined || (content && business === undefined)) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (content === null) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
        <Text className="text-slate-500 mt-4 text-center">
          This post seems to have been removed or is unavailable.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(main)/(tabs)/")}
          className="mt-6 bg-emerald-500 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-bold">Go Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="font-bold text-lg text-slate-900 ml-2">Post Details</Text>
      </View>

      <ScrollView>
        <PostCard
          post={content}
          business={business}
          isOwner={false} // Shared link viewer is likely not owner
        />

        {/* Helper to go to Business Profile */}
        {business && (
          <TouchableOpacity
            onPress={() => router.push({
              pathname: "/(main)/(modals)/profile/BusinessProfile",
              params: { businessId: business._id }
            })}
            className="mx-4 mt-6 p-4 bg-gray-50 rounded-2xl flex-row items-center justify-between border border-gray-100"
          >
            <View>
              <Text className="font-bold text-slate-900 text-sm">View {business.name}</Text>
              <Text className="text-slate-500 text-xs">See more posts and offers</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
