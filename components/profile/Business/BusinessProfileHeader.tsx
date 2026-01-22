import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

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
  onEditProfile, // This will now navigate to the Edit Screen
}: BusinessProfileHeaderProps) {
  return (
    <View className="bg-white pb-2">
      {/* --- HERO IMAGE (Cover Image) --- */}
      <View>
        <Image
          source={{
            uri: business.coverImage || "https://images.unsplash.com/photo-1517248135467-4c7ed9d4c44b?auto=format&fit=crop&w=800&q=80",
          }}
          className="w-full h-64 bg-gray-200"
        />

        {/* Profile Image (Circular) */}
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
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-4">
            <Text className="text-2xl font-bold text-slate-900">{business.name}</Text>
            <Text className="text-gray-500 font-medium leading-5">
              {business.bio || "Neighborhood Favorite"}
            </Text>
          </View>
          {/* ... call/chat buttons ... */}
        </View>

        {/* DYNAMIC PRIMARY BUTTON */}
        {isOwner ? (
          <TouchableOpacity
            onPress={onEditProfile}
            className="bg-emerald-500 w-full py-3 rounded-2xl mt-6 items-center shadow-sm"
          >
            <Text className="text-white font-bold text-lg">Edit Business Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onToggleFavorite}
            className={`w-full py-3 rounded-2xl mt-6 items-center flex-row justify-center border-2 ${
                isFavorited ? "bg-white border-rose-500" : "bg-rose-500 border-rose-500"
            }`}
          >
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={22}
              color={isFavorited ? "#F43F5E" : "white"}
            />
            <Text className={`font-bold text-lg ml-2 ${isFavorited ? "text-rose-500" : "text-white"}`}>
              {isFavorited ? "Favourite" : "Add to Favourites"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}