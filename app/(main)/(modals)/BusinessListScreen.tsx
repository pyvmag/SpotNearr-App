import { BusinessCard } from "@/components/explore/BusinessCard";
import { useUserLocation } from "@/src/context/LocationContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel"; // Import Id for casting
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function BusinessListScreen() {
  const { typeId, typeName } = useLocalSearchParams<{
    typeId: string;
    typeName: string;
  }>();
  const { location } = useUserLocation();
  const router = useRouter();

  // Cast typeId properly for Convex
  const rawBusinesses = useQuery(
    api.business.getBusinessesByType, 
    typeId ? { typeId: typeId as Id<"businessTypes"> } : "skip"
  );

  const filteredBusinesses = useMemo(() => {
    if (!rawBusinesses || !location) return [];
    const MAX_RADIUS_KM = 3; 

    return rawBusinesses
      .map((business) => {
        const distance = business.location
          ? getDistance(location.lat, location.lng, business.location.lat, business.location.lng)
          : Infinity;
        return { ...business, distance };
      })
      .filter((business) => business.distance <= MAX_RADIUS_KM)
      .sort((a, b) => a.distance - b.distance);
  }, [rawBusinesses, location]);

  if (!rawBusinesses) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 py-4 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900">{typeName}</Text>
          <Text className="text-xs text-emerald-500 font-medium">Within 3 km</Text>
        </View>
        <TouchableOpacity className="p-1">
          <Ionicons name="map-outline" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBusinesses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20 px-10">
            <View className="bg-gray-100 p-6 rounded-full mb-4">
              <Ionicons name="location-outline" size={40} color="#9ca3af" />
            </View>
            <Text className="text-lg font-bold text-gray-800 text-center">
              No {typeName} found nearby
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              There are no businesses within 3km of your location.
            </Text>
          </View>
        }
        renderItem={({ item }) => <BusinessCard business={item} />}
      />
    </SafeAreaView>
  );
}