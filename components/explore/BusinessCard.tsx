import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface BusinessCardProps {
  business: any; // Ideally use your Business type from Convex
}

export const BusinessCard = ({ business }: BusinessCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    // Navigate to the Profile Screen with the specific business ID
    router.push({
      pathname: "/(main)/(modals)/profile/BusinessProfile", // Adjust this path to match your file structure
      params: { businessId: business._id }
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className="mb-6 bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100"
      onPress={handlePress}
    >
      {/* Image Section */}
      <View className="h-44 bg-gray-200 relative">
        <View className="absolute top-4 left-4 z-10 bg-white/90 px-3 py-1 rounded-full shadow-sm">
          <Text className="text-emerald-600 font-bold text-xs">
            {business.distance.toFixed(1)} km away
          </Text>
        </View>
        
        {business.imageUrl ? (
          <Image 
            source={{ uri: business.imageUrl }} 
            className="w-full h-full" 
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="image-outline" size={48} color="#cbd5e1" />
          </View>
        )}
      </View>

      {/* Content Section */}
      <View className="p-5">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-xl font-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>
            {business.name}
          </Text>
          <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded-lg">
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text className="ml-1 font-bold text-yellow-700 text-xs">4.8</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-3">
          <Ionicons name="location-sharp" size={14} color="#9ca3af" />
          <Text className="text-gray-500 text-sm ml-1 flex-1" numberOfLines={1}>
            {business.address || "Location hidden"}
          </Text>
        </View>

        {business.bio && (
          <Text className="text-gray-400 text-sm leading-5 mb-4" numberOfLines={2}>
            {business.bio}
          </Text>
        )}

        <View className="h-[1px] bg-gray-100 w-full mb-4" />

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className="text-green-600 font-bold text-xs uppercase tracking-tighter">
              Open Now
            </Text>
          </View>
          <Text className="text-emerald-500 font-bold text-sm">View Details</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};