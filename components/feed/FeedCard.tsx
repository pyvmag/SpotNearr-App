import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function FeedCard({
  content,
  business,
  onPressCTA,
}: any) {
  const isOffer = content.type === "offer";

  return (
    <View className="bg-white mb-4 rounded-3xl overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <View className={`p-[1px] border rounded-full ${business?.isCelebrity ? "border-purple-500" : "border-emerald-500"}`}>
          <Image
            source={{
              uri: business?.logoUrl || business?.profileImage || "https://via.placeholder.com/100",
            }}
            className="w-9 h-9 rounded-full bg-gray-100"
          />
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-bold text-slate-900 text-sm">
            {business?.name || "Business"}
          </Text>
          <Text className="text-gray-500 text-[10px]">
            {business?.isCelebrity ? "Celebrity" : "Local Business"}
          </Text>
        </View>
        {business?.isCelebrity && (
          <View className="bg-purple-100 px-2 py-1 rounded-full">
            <Text className="text-purple-600 text-[10px] font-semibold">VIP</Text>
          </View>
        )}
      </View>

      {/* Image */}
      <View className="px-4">
        <Image
          source={{ uri: content.imageUrl }}
          style={{ width: width - 32, height: width - 32 }}
          className="rounded-[28px] bg-gray-100"
          resizeMode="cover"
        />
      </View>

      {/* Body */}
      <View className="px-6 pt-4">
        {isOffer && (
          <Text className="text-xl font-extrabold text-slate-900 mb-1">
            {content.offerTitle}
          </Text>
        )}

        <Text className="text-slate-700 text-sm leading-5">
          {content.caption}
        </Text>

        {isOffer && content.expiryDate && (
          <Text className="text-emerald-600 text-[11px] font-semibold mt-2">
            Valid till{" "}
            {new Date(content.expiryDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        )}
      </View>

      {/* CTA + Actions */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center space-x-6">
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="heart-outline" size={22} color="#1e293b" />
            <Text className="ml-1 text-slate-600 text-sm">12</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="bookmark-outline" size={22} color="#1e293b" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="paper-plane-outline" size={22} color="#1e293b" />
          </TouchableOpacity>
        </View>

        {isOffer && (
          <TouchableOpacity
            onPress={onPressCTA}
            className="bg-emerald-500 px-4 py-2 rounded-full"
          >
            <Text className="text-white font-bold text-xs">
              View Offer
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Timestamp */}
      <View className="px-6 pb-4">
        <Text className="text-gray-400 text-[10px] uppercase">
          {new Date(content.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>
    </View>
  );
}
