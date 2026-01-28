import { BusinessCard } from "@/components/explore/BusinessCard";
import { useUserLocation } from "@/src/context/LocationContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { usePaginatedQuery } from "convex/react"; 
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { encodeGeohash } from "@/convex/geohash";

export default function BusinessListScreen() {
  const router = useRouter();
  const { typeId, typeName } = useLocalSearchParams<{ typeId: string; typeName: string }>();
  const { location } = useUserLocation();
  
  // 1. Level State: 6 = Neighborhood (~1km), 5 = City Area (~5km)
  const [level, setLevel] = useState<6 | 5>(6);

  // 2. Memoize Geohashes to avoid recalculating on every render
  const hashes = useMemo(() => {
    if (!location) return { g6: "", g5: "" };
    const g6 = encodeGeohash(location.lat, location.lng, 6);
    return {
      g6,
      g5: g6.substring(0, 5)
    };
  }, [location?.lat, location?.lng]);
  

  // 3. Convex Paginated Query (Handles 20 at a time automatically)
  const { results, status, loadMore } = usePaginatedQuery(
    api.business.getBusinessesByScore,
    { 
      typeId: typeId as Id<"businessTypes">, 
      geohash: level === 6 ? hashes.g6 : hashes.g5,
      level: level
    },
    { initialNumItems: 20 }
  );

  // 4. Expansion Logic: Load next 20 OR Expand to Level 5
  const handleLoadMore = () => {
    if (status === "CanLoadMore") {
      loadMore(20);
    } else if (status === "Exhausted" && level === 6) {
      // If we finish all businesses in g6, jump to g5 (City Area)
      setLevel(5);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      {/* --- HEADER --- */}
      <View className="px-5 py-4 border-b border-gray-100 bg-white">
        <View className="flex-row items-center justify-between mb-1">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="p-2 -ml-2 rounded-full active:bg-gray-100"
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          
          <View className="items-center flex-1">
            <Text className="text-xl font-extrabold text-gray-900">{typeName}</Text>
            <View className="flex-row items-center mt-0.5">
              <Ionicons 
                name={level === 6 ? "navigate" : "map"} 
                size={12} 
                color={level === 6 ? "#10B981" : "#6366f1"} 
              />
              <Text className={`text-xs font-bold ml-1 ${level === 6 ? "text-emerald-600" : "text-indigo-600"}`}>
                {level === 6 ? "Neighborhood Top Spots" : "Expanding to City-Wide"}
              </Text>
            </View>
          </View>
          
          <View className="w-10" /> 
        </View>
      </View>

      {/* --- LIST --- */}
      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}

        ListEmptyComponent={
          status === "LoadingFirstPage" ? (
            <View className="mt-20 items-center">
              <ActivityIndicator size="large" color="#10B981" />
              <Text className="mt-4 text-gray-500 font-medium">Finding the best spots...</Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center mt-20 px-10">
              <View className="bg-gray-50 p-6 rounded-full mb-4">
                <Ionicons name="search-outline" size={48} color="#cbd5e1" />
              </View>
              <Text className="text-lg font-bold text-gray-800 text-center">No spots here yet</Text>
              <Text className="text-gray-500 text-center mt-2">Try checking back later or moving to a different area.</Text>
            </View>
          )
        }

        ListFooterComponent={
          status === "LoadingMore" ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#10B981" />
            </View>
          ) : (
            <View className="h-20" />
          )
        }
        
        renderItem={({ item }) => <BusinessCard business={item} />}
      />
    </SafeAreaView>
  );
}