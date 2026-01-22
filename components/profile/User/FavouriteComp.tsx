import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function FavoritesCarousel({ favorites }: { favorites: any[] }) {
  const router = useRouter();
  
  // Show only first 4 on the main profile preview
  const displayFavorites = favorites.slice(0, 4);

  return (
    <View className="px-6 mt-8">
      <View className="flex-row justify-between items-end mb-4">
        <Text className="text-xl font-bold text-slate-900">My Favorites</Text>
        <TouchableOpacity onPress={() => router.push("/(main)/(modals)/profile/AllFavouritesScreen")}>
          <Text className="text-emerald-500 font-bold">View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {displayFavorites.map((business) => (
          <TouchableOpacity 
            key={business._id}
            // ✅ CORRECT: Navigate to the dynamic business profile route
            onPress={() => router.push({
              pathname: "/(main)/(modals)/profile/BusinessProfile", // Adjust this path to match your file structure
              params: { businessId: business._id }
            })}
            className="mr-4 items-center"
          >
            <View className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
              <Image 
                source={{ uri: business.logoUrl || "https://via.placeholder.com/150" }} 
                className="w-full h-full"
              />
            </View>
            <Text 
              numberOfLines={1} 
              className="text-xs mt-2 font-medium text-slate-600 w-20 text-center"
            >
              {business.name}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Empty state if user has no favorites yet */}
        {displayFavorites.length === 0 && (
          <View className="py-2">
            <Text className="text-gray-400 italic text-sm">Discover local gems to save them here!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}