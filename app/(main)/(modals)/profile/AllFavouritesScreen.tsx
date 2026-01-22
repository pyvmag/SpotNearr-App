import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { api } from "@/convex/_generated/api";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function AllFavoritesScreen() {
  const router = useRouter();
  const userProfile = useUserProfile();

  // Fetch the full list of favorites
  const favorites = useQuery(api.favourites.getUserFavorites, userProfile?._id ? { 
    userId: userProfile._id 
  } : "skip");

  if (!favorites) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-14 pb-4 border-b border-gray-50">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900">My Favorites</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 24 }}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Ionicons name="heart-dislike-outline" size={64} color="#e2e8f0" />
            <Text className="text-gray-400 mt-4 text-center text-lg">
              You haven't saved any businesses yet.
            </Text>
          </View>
        }
        renderItem={({ item: business }) => (
          <TouchableOpacity
            onPress={() => router.push({
              pathname: "/(main)/(modals)/profile/BusinessProfile", // Adjust this path to match your file structure
              params: { businessId: business._id }
            })}
            className="flex-row items-center mb-6 bg-slate-50 p-4 rounded-3xl border border-slate-100"
          >
            {/* Business Logo */}
            <View className="w-16 h-16 rounded-full overflow-hidden bg-white border border-gray-100">
              <Image
                source={{ uri: business.profileImage || "https://via.placeholder.com/150" }}
                className="w-full h-full"
              />
            </View>

            {/* Business Info */}
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-slate-900" numberOfLines={1}>
                {business.name}
              </Text>
              <Text className="text-slate-500 text-sm" numberOfLines={1}>
                {business.bio || "Neighborhood Favorite"}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}