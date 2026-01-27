import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface BusinessCardProps {
  business: any;
}

export const BusinessCard = ({ business }: BusinessCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/(main)/(modals)/profile/BusinessProfile",
      params: { businessId: business._id }
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className="mb-5 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100"
      onPress={handlePress}
    >
      {/* --- HERO IMAGE SECTION (Pure Image) --- */}
      <View className="h-32 bg-slate-100 relative">
        {business.coverImage ? (
          <Image
            source={{ uri: business.coverImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center bg-slate-200">
            <Ionicons name="image-outline" size={32} color="#94a3b8" />
          </View>
        )}
      </View>

      {/* --- CONTENT SECTION --- */}
      <View className="px-4 pb-4 pt-2">
        <View className="flex-row">
          
          {/* Profile Avatar (Floating Up) */}
          <View className="-mt-8 mr-3">
            <View className="p-1 bg-white rounded-full shadow-sm">
              {business.profileImage ? (
                <Image
                  source={{ uri: business.profileImage }}
                  className="w-14 h-14 rounded-full bg-slate-100"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-14 h-14 rounded-full bg-slate-100 items-center justify-center border border-slate-200">
                  <Text className="text-xl font-bold text-slate-400">
                    {business.name?.charAt(0) || "?"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Header Info (Name & Distance) */}
          <View className="flex-1 mt-1 flex-row justify-between items-start">
            <View className="flex-1 mr-2">
               <Text className="text-lg font-extrabold text-slate-900 leading-tight" numberOfLines={1}>
                {business.name}
              </Text>
            </View>

            {/* Distance Badge (Now safe on white background) */}
            <View className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
               <Text className="text-[10px] font-bold text-slate-500">
                 {business.distance?.toFixed(1) || 0} KM
               </Text>
            </View>
          </View>
        </View>

        {/* Second Row: Rating & Address */}
        <View className="mt-2 flex-row items-center justify-between">
            {/* Address */}
            <View className="flex-row items-center flex-1 mr-4">
              <Ionicons name="location-sharp" size={14} color="#64748b" />
              <Text className="text-slate-500 text-xs font-medium ml-1 flex-1" numberOfLines={1}>
                {business.address || "Location unavailable"}
              </Text>
            </View>

            {/* Rating (Clean Star) */}
            {business.rating ? (
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text className="ml-1 text-sm font-extrabold text-slate-700">
                   {business.rating}
                </Text>
              </View>
            ) : (
              <Text className="text-xs font-bold text-slate-400">New</Text>
            )}
        </View>

        {/* Bio (Optional) */}
        {business.bio && (
          <Text className="mt-3 text-slate-400 text-xs leading-4" numberOfLines={2}>
            {business.bio}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};