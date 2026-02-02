import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function FeedCard({
  content,
  business,
  onPressCTA,
}: any) {
  const router = useRouter();
  const isOffer = content.type === "offer"; //

  // Conditional styling to differentiate Posts vs Offers without clutter
  const cardBg = isOffer ? "bg-pink-100/30" : "bg-white"; 
  const accentColor = isOffer ? "#ba0054ff" : "#10b981"; // Pink-600 vs Emerald-500

  const handleBusinessPress = () => {
    // Navigate to business profile as requested
    router.push({
      pathname: "/(main)/(modals)/profile/BusinessProfile",
      params: { businessId: business?._id }
    });
  };

  return (
    <View className={`${cardBg} mb-8 rounded-[36px] overflow-hidden`}>
      
      {/* Header: Simplified for spaciousness */}
      <View className="flex-row items-center px-6 py-5">
        <TouchableOpacity 
          onPress={handleBusinessPress} 
          className="flex-row items-center flex-1"
        >
          <Image
            source={{
              uri: business?.logoUrl || business?.profileImage || "https://via.placeholder.com/100",
            }}
            className="w-9 h-9 rounded-full bg-gray-100"
          />
          <View className="ml-3">
            <Text className="font-bold text-slate-900 text-[15px]">
              {business?.name || "Local Spot"}
            </Text>
            <Text className="text-gray-400 text-[11px] font-medium">
              {business?.address || "Neighborhood"}
            </Text>
          </View>
        </TouchableOpacity>

        {business?.isCelebrity && ( //
          <View className="bg-purple-100 px-3 py-1 rounded-full">
            <Text className="text-purple-600 text-[9px] font-black uppercase">VIP</Text>
          </View>
        )}
      </View>

      {/* Main Content: Large visual with generous rounding */}
      <View className="px-5">
        <Image
          source={{ uri: content.imageUrl }}
          style={{ width: width - 32, height: width - 32 }}
          className="rounded-[28px] bg-gray-100"
          resizeMode="cover"
        />
      </View>

      {/* Body: High-hierarchy typography */}
      <View className="px-8 pt-6 pb-2">
        {isOffer && content.offerTitle && ( //
          <Text className="text-xl font-black text-slate-900 mb-2">
            {content.offerTitle}
          </Text>
        )}

        <Text className="text-slate-600 text-[14px] leading-6">
          {content.caption}
        </Text>
      </View>

      {/* Action Row: The "Spot" (Location Pin) instead of Heart */}
      <View className="flex-row items-center justify-between px-8 py-5">
        <View className="flex-row items-center space-x-6">
          <TouchableOpacity className="items-center justify-center min-w-[48px]">
            {/* Phase 1: Using Location Pin for "Spotting" */}
            <Ionicons name="star" size={24} color={accentColor} />
            <Text className="text-[10px] font-bold mt-1 text-slate-400">12</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center justify-center min-w-[48px]">
            <Ionicons name="chatbubble-outline" size={24} color="#64748b" />
            <Text className="text-[10px] font-bold mt-1 text-slate-400">3</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center justify-center min-w-[48px] -mt-5">
            <Ionicons name="share-outline" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {isOffer && ( //
          <TouchableOpacity
            onPress={onPressCTA}
            className="bg-slate-900 px-6 py-3 rounded-2xl"
          >
            <Text className="text-white font-black text-[11px] uppercase tracking-tighter">
              Get Offer
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Subtle Expiry Tag for Offers */}
      {isOffer && content.expiryDate && ( //
        <View className="px-8 pb-6">
          <Text className="text-pink-500/60 text-[10px] font-bold uppercase tracking-widest">
            Ends {new Date(content.expiryDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      )}
    </View>
  );
}