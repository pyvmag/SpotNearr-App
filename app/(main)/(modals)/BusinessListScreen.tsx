import { BusinessCard } from "@/components/explore/BusinessCard";
import { useUserLocation } from "@/src/context/LocationContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BusinessListScreen() {
  const router = useRouter();
  
  // 1. Get Type ID and Name from route params
  const { typeId, typeName } = useLocalSearchParams<{
    typeId: string;
    typeName: string;
  }>();

  // 2. Get Location AND Global Radius from Context
  const { location, radius } = useUserLocation();

  // 3. OPTIMIZED QUERY:
  // We pass the global radius and location to the backend.
  // The backend does the filtering and sorting, returning only what we need.
  const businesses = useQuery(
    api.business.getBusinessesByTypeAndLocation,
    typeId && location
      ? {
          typeId: typeId as Id<"businessTypes">,
          userLat: location.lat,
          userLng: location.lng,
          radius: radius, // Uses the global setting (e.g., 5km, 10km)
        }
      : "skip"
  );

  // Loading State
  if (!businesses) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 py-4 border-b border-gray-100 flex-row items-center justify-between z-10 bg-white">
        
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="chevron-back" size={28} color="#1f2937" />
        </TouchableOpacity>

        {/* Title & Radius Indicator */}
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
            {typeName}
          </Text>
          {/* Dynamic Radius Pill */}
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-sharp" size={10} color="#10B981" />
            <Text className="text-xs text-emerald-600 font-bold ml-1">
              Within {radius} km
            </Text>
          </View>
        </View>

        {/* Placeholder for symmetry (or Map view toggle in future) */}
        <View className="w-8" />
      </View>

      {/* Business List */}
      <FlatList
        data={businesses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        
        // Empty State (Dynamic based on Radius)
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20 px-10">
            <View className="bg-gray-50 p-6 rounded-full mb-4">
              <Ionicons name="compass-outline" size={48} color="#cbd5e1" />
            </View>
            <Text className="text-lg font-bold text-gray-800 text-center">
              No {typeName} nearby
            </Text>
            <Text className="text-gray-500 text-center mt-2 leading-5">
              We couldn't find any results within <Text className="font-bold text-gray-700">{radius}km</Text>.
              {"\n"}Try increasing the distance on the Explore screen.
            </Text>
          </View>
        }
        
        renderItem={({ item }) => <BusinessCard business={item} />}
      />
    </SafeAreaView>
  );
}