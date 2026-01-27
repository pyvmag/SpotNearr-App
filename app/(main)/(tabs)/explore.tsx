import { api } from "@/convex/_generated/api";
import { useUserLocation } from "@/src/context/LocationContext";
import { useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
// Import Components
import { CategoryRail } from "@/components/explore/CategoryRail";
import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { FilterOverlay } from "@/components/explore/FilterOverlay";
import { LocationModal } from "@/components/explore/LocationModal";

export default function ExploreScreen() {
  const {
    location,
    loading: locationLoading,
    requestCurrentLocation,
    radius,
    setRadius,
  } = useUserLocation();

  const categories = useQuery(api.business.getExploreData);

  // State for Modals
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [isLocationVisible, setLocationVisible] = useState(false);

  useEffect(() => {
    if (!location && !locationLoading) {
      requestCurrentLocation();
    }
  }, [location]);

  if (categories === undefined) {
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
      >
        {/* Categories & Types Rails */}
        {categories.length > 0 ? (
          categories.map((category) => (
            <CategoryRail key={category._id} category={category} />
          ))
        ) : (
          <View className="px-5 py-10 items-center">
            <Text className="text-slate-400">No categories found in your area.</Text>
          </View>
        )}
      </ScrollView>

      {/* 2. Modals */}
      <FilterOverlay
        visible={isFilterVisible}
        radius={radius}
        setRadius={setRadius}
        onClose={() => setFilterVisible(false)}
      />

      <LocationModal
        visible={isLocationVisible}
        onClose={() => setLocationVisible(false)}
      />

    </View>
  );
}