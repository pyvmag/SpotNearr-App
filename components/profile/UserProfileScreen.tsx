import FavoritesCarousel from "@/components/profile/User/FavouriteComp";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Image, ScrollView, Text, View } from "react-native";

export default function UserProfileScreen({ userId }: { userId: any }) {
  const user = useQuery(api.users.getUserById, { userId });
  const favorites = useQuery(api.favourites.getUserFavorites, { userId });

  if (!user) return null;

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      {/* Profile Section */}
      <View className="items-center mt-10">
        <View className="w-32 h-32 rounded-full p-1 bg-orange-100">
            <Image 
              source={{ uri: user.imageUrl }} 
              className="w-full h-full rounded-full bg-white" 
            />
        </View>
        <Text className="text-3xl font-bold text-slate-900 mt-4">{user.name}</Text>
      </View>

      {/* Stats Row */}
      <View className="flex-row mt-8 border-y border-gray-50 py-4">
        <View className="flex-1 items-center border-r border-gray-100">
          <Text className="text-xl font-bold text-slate-900">12</Text>
          <Text className="text-gray-400 text-xs uppercase tracking-widest">Vouches</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-xl font-bold text-slate-900">{user.favoritesCount || 0}</Text>
          <Text className="text-gray-400 text-xs uppercase tracking-widest">Favourites</Text>
        </View>
      </View>

      {/* Favorites Carousel Component */}
      <FavoritesCarousel favorites={favorites || []} />

      {/* My Activity Section (Settings removed) */}
      <View className="px-6 mt-10 mb-20">
        <Text className="text-xl font-bold text-slate-900 mb-4">My Activity</Text>
        <View className="bg-slate-50 rounded-3xl p-4 flex-row items-center">
            <View className="bg-white p-3 rounded-2xl shadow-sm">
                <Ionicons name="time-outline" size={24} color="#6366f1" />
            </View>
            <View className="ml-4 flex-1">
                <Text className="font-bold text-slate-900">Interaction History</Text>
                <Text className="text-slate-500 text-sm">Posts and comments history</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </View>
      </View>
    </ScrollView>
  );
}