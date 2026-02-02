import { api } from "@/convex/_generated/api";
import { useUserLocation } from "@/src/context/LocationContext";
import { useQuery } from "convex/react";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
// Import Components
import { CategoryRail } from "@/components/explore/CategoryRail";
import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { LocationModal } from "@/components/explore/LocationModal";
// Import Cache Service
import { CACHE_DURATIONS, CACHE_KEYS, getCachedData, setCachedData } from "@/lib/cacheService";

// Type for category data
type CategoryData = {
  _id: string;
  name: string;
  slug: string;
  types: any[];
};

export default function ExploreScreen() {
  const {
    location,
    loading: locationLoading,
    requestCurrentLocation,
    radius,
    setRadius,
  } = useUserLocation();

  // Server data from Convex (lazy loaded)
  const serverCategories = useQuery(api.business.getExploreData);

  // Local state
  const [cachedCategories, setCachedCategories] = useState<CategoryData[] | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State for Modals
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [isLocationVisible, setLocationVisible] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    loadCachedCategories();
  }, []);

  // Update cache when server data arrives (but only if not refreshing manually)
  useEffect(() => {
    if (serverCategories && serverCategories.length > 0 && !refreshing) {
      // Save to cache silently
      setCachedData(CACHE_KEYS.CATEGORIES, serverCategories).catch((err) =>
        console.error("Failed to cache categories:", err)
      );

      // Update local state if we don't have cached data yet
      if (!cachedCategories) {
        setCachedCategories(serverCategories);
      }
    }
  }, [serverCategories]);

  // Load from cache
  const loadCachedCategories = async () => {
    try {
      setIsLoadingCache(true);
      const cached = await getCachedData<CategoryData[]>(
        CACHE_KEYS.CATEGORIES,
        CACHE_DURATIONS.SEVEN_DAYS
      );

      if (cached && cached.length > 0) {
        console.log("[Explore] Loaded from cache:", cached.length, "categories");
        setCachedCategories(cached);
      } else {
        console.log("[Explore] No valid cache found, will load from server");
      }
    } catch (error) {
      console.error("[Explore] Error loading cache:", error);
    } finally {
      setIsLoadingCache(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    console.log("[Explore] Manual refresh triggered");
    setRefreshing(true);

    try {
      // Force refetch from server by temporarily setting cache to null
      // The useQuery will automatically refetch
      // Wait a bit for the query to complete
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update cache with latest server data
      if (serverCategories && serverCategories.length > 0) {
        await setCachedData(CACHE_KEYS.CATEGORIES, serverCategories);
        setCachedCategories(serverCategories);
        console.log("[Explore] Cache updated from manual refresh");
      }
    } catch (error) {
      console.error("[Explore] Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  }, [serverCategories]);

  // Request location on mount
  useEffect(() => {
    if (!location && !locationLoading) {
      requestCurrentLocation();
    }
  }, [location]);

  // Determine what data to display
  const displayCategories = cachedCategories || serverCategories || [];
  const isLoading = isLoadingCache && !cachedCategories && serverCategories === undefined;

  // Show loading spinner only on first load with no cache
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8F9FB]">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-4 text-slate-500 font-medium">Loading local spots...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ExploreHeader
        locationLabel={locationLoading ? "Locating..." : location?.label || "Select Location"}
        radius={radius}
        onPressLocation={() => setLocationVisible(true)}
        onPressFilter={() => setFilterVisible(true)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
            colors={["#059669"]}
            title="Pull to refresh"
            titleColor="#64748b"
          />
        }
      >
        {/* Categories & Types Rails */}
        {displayCategories.length > 0 ? (
          displayCategories.map((category) => (
            <CategoryRail key={category._id} category={category} />
          ))
        ) : (
          <View className="px-5 py-10 items-center">
            <Text className="text-slate-400">No categories found in your area.</Text>
          </View>
        )}
      </ScrollView>

      <LocationModal
        visible={isLocationVisible}
        onClose={() => setLocationVisible(false)}
      />

    </View>
  );
}