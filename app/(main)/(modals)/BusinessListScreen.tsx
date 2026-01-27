import { BusinessCard } from "@/components/explore/BusinessCard";
import { useUserLocation } from "@/src/context/LocationContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "convex/react"; 
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BusinessListScreen() {
  const router = useRouter();
  const { typeId, typeName } = useLocalSearchParams<{ typeId: string; typeName: string }>();
  const { location, radius } = useUserLocation();
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");

  // --- MANUAL PAGINATION STATE ---
  const [listData, setListData] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 1. Fetch current "Page"
  const pageResult = useQuery(api.business.getBusinessesPaginated, {
    typeId: typeId as Id<"businessTypes">,
    userLat: location?.lat ?? 0,
    userLng: location?.lng ?? 0,
    radius: radius,
    sortBy: sortBy,
    offset: offset,
    pageSize: 50,
  });

  // 2. Append Data Logic
  useEffect(() => {
    if (pageResult) {
      if (offset === 0) {
        // New sort or refresh -> Replace list
        setListData(pageResult.page);
      } else {
        // Load more -> Append to list (prevent duplicates if strict mode is on)
        setListData((prev) => {
             // Optional safety: check if last item in prev is same as first in new page
             return [...prev, ...pageResult.page];
        });
      }
      setIsDone(pageResult.isDone);
      setIsLoadingMore(false);
    }
  }, [pageResult, offset]);

  // 3. Reset when Filter Changes
  useEffect(() => {
    setOffset(0);
    setListData([]);
    setIsDone(false);
    setIsLoadingMore(false);
  }, [sortBy, radius, location]);

  // 4. FIXED: Safe Load More Function
  const handleLoadMore = () => {
    // Safety check: Don't run if we are already loading or if pageResult isn't ready
    if (isLoadingMore || isDone || !pageResult) return;

    // Strict check: Ensure nextOffset exists and is a number
    if (typeof pageResult.nextOffset === 'number') {
      setIsLoadingMore(true);
      setOffset(pageResult.nextOffset);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      {/* --- HEADER --- */}
      <View className="px-5 py-3 border-b border-gray-100 z-10 bg-white">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-gray-100">
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View className="items-center">
             <Text className="text-lg font-extrabold text-gray-900">{typeName}</Text>
             <View className="flex-row items-center mt-0.5">
                <Ionicons name="location-sharp" size={10} color="#6b7280" />
                <Text className="text-xs text-gray-500 font-medium ml-1">
                  {location?.label?.split(",")[0] || "Location"} • {radius} km
                </Text>
             </View>
          </View>
          <View className="w-8" />
        </View>

        {/* Filters */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setSortBy("distance")}
            className={`flex-1 flex-row items-center justify-center py-2 rounded-xl border ${
              sortBy === "distance" ? "bg-slate-900 border-slate-900" : "bg-white border-gray-200"
            }`}
          >
            <MaterialIcons name="near-me" size={16} color={sortBy === "distance" ? "white" : "#6b7280"} />
            <Text className={`ml-2 text-sm font-bold ${sortBy === "distance" ? "text-white" : "text-gray-600"}`}>
              Nearest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSortBy("rating")}
            className={`flex-1 flex-row items-center justify-center py-2 rounded-xl border ${
              sortBy === "rating" ? "bg-slate-900 border-slate-900" : "bg-white border-gray-200"
            }`}
          >
            <Ionicons name="star" size={16} color={sortBy === "rating" ? "#FFD700" : "#6b7280"} />
            <Text className={`ml-2 text-sm font-bold ${sortBy === "rating" ? "text-white" : "text-gray-600"}`}>
              Top Rated
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- LIST --- */}
      <FlatList
        data={listData}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}

        // Empty State Handling
        ListEmptyComponent={
            !pageResult && listData.length === 0 ? (
                 // Loading Spinner for initial load
                <View className="mt-20 items-center">
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : listData.length === 0 ? (
                // Actual No Results
                <View className="flex-1 items-center justify-center mt-20 px-10">
                    <View className="bg-gray-50 p-6 rounded-full mb-4">
                        <Ionicons name="compass-outline" size={48} color="#cbd5e1" />
                    </View>
                    <Text className="text-lg font-bold text-gray-800 text-center">No results found</Text>
                </View>
            ) : null
        }

        ListFooterComponent={
            isLoadingMore ? (
                <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#10B981" />
                </View>
            ) : <View className="h-10"/>
        }
        
        renderItem={({ item }) => <BusinessCard business={item} />}
      />
    </SafeAreaView>
  );
}