import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

interface BusinessProfileHeaderProps {
  business: any;
  isOwner: boolean;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onEditProfile: () => void;
  coverImage?: string;
}

export default function BusinessProfileHeader({
  business,
  isOwner,
  isFavorited,
  onToggleFavorite,
  onEditProfile,
}: BusinessProfileHeaderProps) {
  const router = useRouter();

  // Helper to navigate to reviews
  const openReviews = () => {
    router.push({
      pathname: "/(main)/(modals)/reviews/[businessId]",
      params: { businessId: business._id }
    });
  };

  return (
    <View className="bg-white pb-4">
      {/* --- HERO IMAGE --- */}
      <View>
        <Image
          source={{
            uri: business.coverImage || "https://images.unsplash.com/photo-1517248135467-4c7ed9d4c44b?auto=format&fit=crop&w=800&q=80",
          }}
          className="w-full h-64 bg-gray-200"
        />
        {/* Profile Image */}
        <View className="absolute -bottom-10 left-6">
          <View className="p-1 bg-white rounded-full shadow-lg">
            <Image
              source={{ uri: business.profileImage || "https://via.placeholder.com/150" }}
              className="h-24 w-24 rounded-full bg-gray-100 border-2 border-white"
            />
          </View>
        </View>
      </View>

      <View className="px-6 mt-12">
        {/* Title & Bio */}
        <View className="mb-3">
          <Text className="text-2xl font-bold text-slate-900">{business.name}</Text>
          <Text className="text-gray-500 font-medium leading-5 mt-1">
            {business.bio || "Neighborhood Favorite"}
          </Text>
        </View>

        {/* --- OPTION 3: THE STATS ROW --- */}
        <TouchableOpacity 
            onPress={openReviews}
            activeOpacity={0.7}
            className="flex-row items-center mb-6"
        >
            {/* Rating */}
            <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-md mr-3 border border-green-100">
                <Text className="font-bold text-emerald-700 text-sm mr-1">
                    {business.rating ? Number(business.rating).toFixed(1) : "N/A"}
                </Text>
                <Ionicons name="star" size={12} color="#047857" />
            </View>

            {/* Review Count */}
            <Text className="text-slate-600 font-medium text-sm underline decoration-slate-300 decoration-dotted">
                {business.reviewCount || 0} Reviews
            </Text>

            {/* Separator Dot */}
            <Text className="text-slate-300 mx-2">•</Text>

            {/* Verification Badge (Visual Flair) */}
            <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={14} color="#94a3b8" />
                <Text className="text-slate-400 text-xs ml-1 font-medium">Verified</Text>
            </View>
            
            {/* Chevron to indicate clickability */}
            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" style={{ marginLeft: "auto" }} />
        </TouchableOpacity>


        {/* --- MAIN ACTION BUTTON (Full Width) --- */}
        {isOwner ? (
          <TouchableOpacity
            onPress={onEditProfile}
            className="bg-emerald-500 w-full py-3.5 rounded-2xl items-center shadow-md shadow-emerald-200"
          >
            <Text className="text-white font-bold text-lg">Edit Business Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onToggleFavorite}
            className={`w-full py-3.5 rounded-2xl items-center flex-row justify-center border-2 ${
                isFavorited ? "bg-white border-rose-500" : "bg-rose-500 border-rose-500"
            }`}
          >
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={22}
              color={isFavorited ? "#F43F5E" : "white"}
            />
            <Text className={`font-bold text-lg ml-2 ${isFavorited ? "text-rose-500" : "text-white"}`}>
              {isFavorited ? "Saved" : "Save to Favourites"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}