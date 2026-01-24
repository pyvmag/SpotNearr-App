import { api } from "@/convex/_generated/api";
import { useUserLocation } from "@/src/context/LocationContext";
import { LocationHeader } from "@/components/explore/location-header";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { CategoryRail } from "@/components/explore/CategoryRail";
import { FilterOverlay } from "@/components/explore/FilterOverlay";

export default function ExploreScreen() {
  const {
    location,
    loading: locationLoading,
    requestCurrentLocation,
    radius,
    setRadius,
  } = useUserLocation();

  const categories = useQuery(api.business.getExploreData);
  const [isFilterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    if (!location) requestCurrentLocation();
  }, [location]);

  if (locationLoading || !categories) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8F9FB]">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FB] relative">
      {/* REMOVED Stack.Screen - this was causing the error */}
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-5 pt-6 pb-2">
          <LocationHeader label={location?.label} />
          <Text className="text-3xl font-extrabold text-slate-900 mt-4">
            {`Discover `}
            <Text className="text-emerald-600">{`Local.`}</Text>
          </Text>
        </View>

        {/* Search & Filter Button */}
        <View className="px-5 mt-4 mb-8 flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center bg-white h-12 px-4 rounded-2xl border border-slate-200 shadow-sm">
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Search businesses..."
              className="flex-1 ml-2 font-medium text-slate-700"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterVisible(true)}
            className="h-12 w-12 bg-emerald-600 rounded-2xl items-center justify-center shadow-md shadow-emerald-200"
          >
            <Feather name="sliders" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Active Filter Indicator */}
        {radius !== 5 && (
          <View className="px-5 mb-6">
            <View className="self-start bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex-row items-center">
              <Text className="text-emerald-700 text-xs font-bold">
                {`Filtered: Within ${radius}km`}
              </Text>
            </View>
          </View>
        )}

        {/* Categories */}
        {categories.map((category) => (
          <CategoryRail key={category._id} category={category} />
        ))}

        <View className="h-20" />
      </ScrollView>

      {/* Filter Overlay */}
      <FilterOverlay
        visible={isFilterVisible}
        radius={radius}
        setRadius={setRadius}
        onClose={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
}
