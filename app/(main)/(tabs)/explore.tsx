import { CategorySection } from "@/components/explore/CategorySection";
import { LocationHeader } from "@/components/explore/location-header";
import { SearchBar } from "@/components/SearchBar";
import { useUserLocation } from "@/src/context/LocationContext";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function ExploreScreen() {
  const { location, loading: locationLoading, requestCurrentLocation } = useUserLocation();
  const categories = useQuery(api.business.getExploreData);

  useEffect(() => {
    if (!location) {
      requestCurrentLocation();
    }
  }, [location, requestCurrentLocation]);

  if (locationLoading || !categories) {
    return (
      <View className="flex-1 items-center justify-center bg-white mt-4">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FB]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Simplified Header */}
        <View className="mt-10">
          <LocationHeader label={location?.label} />
        </View>

        <Text className="text-2xl font-extrabold text-[#111] mt-4 leading-[44px]">
          What are you looking for?
        </Text>

        {/* Reusable Search Bar */}
        <SearchBar />

        {/* Content */}
        {categories.length > 0 ? (
          categories.map((category) => (
            <CategorySection key={category._id} category={category} />
          ))
        ) : (
          <View className="items-center py-10">
            <Text className="text-gray-400">No categories found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}