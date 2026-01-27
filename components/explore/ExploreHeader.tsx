import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ExploreHeaderProps {
  locationLabel: string;
  radius: number;
  onPressLocation: () => void;
  onPressFilter: () => void;
}

export const ExploreHeader = ({
  locationLabel,
  radius,
  onPressLocation,
  onPressFilter,
}: ExploreHeaderProps) => {
  return (
    <View className="bg-white pb-4 rounded-b-3xl shadow-sm shadow-slate-200 z-10">
      <SafeAreaView edges={["top"]} className="px-5">
        
        {/* 1. Top Search Bar */}
        <View className="mt-4 flex-row items-center bg-slate-50 h-12 px-4 rounded-2xl border border-slate-200">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search businesses, services..."
            className="flex-1 ml-2 font-medium text-slate-700"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* 2. Title Section */}
        <View className="mt-5 mb-3">
          <Text className="text-3xl font-extrabold text-slate-900">
            Discover <Text className="text-emerald-600">Local.</Text>
          </Text>
        </View>

        {/* 3. Action Chips Row */}
        <View className="flex-row gap-1">
          
          {/* LOCATION CHIP (Takes 70% width) */}
          <TouchableOpacity
            onPress={onPressLocation}
            className="flex-[2.5] flex-row items-center bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl active:bg-blue-100"
          >
            {/* Icon */}
            <View className="bg-blue-100 p-2 rounded-full mr-3 self-start mt-0.5">
              <Ionicons name="location" size={18} color="#2563eb" />
            </View>
            
            {/* Text Container */}
            <View className="flex-1">
              <Text className="text-[8px] uppercase text-blue-400 font-bold tracking-wider mb-0.5">
                Viewing near
              </Text>
              <Text
                numberOfLines={1}
                className="text-sm font-bold text-slate-900 leading-5 uppercase"
              >
                {locationLabel || "Select Area"}
              </Text>
            </View>
            
            {/* Chevron */}
            <Ionicons name="chevron-down" size={16} color="#94a3b8" style={{marginLeft: 4}} />
          </TouchableOpacity>

          {/* RADIUS CHIP (Takes 30% width) */}
          <TouchableOpacity
            onPress={onPressFilter}
            className="flex-0.8 flex-row items-center bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl active:bg-emerald-100"
          >
            <View className="bg-emerald-100 p-1.5 rounded-full mr-2">
              <Feather name="target" size={14} color="#059669" />
            </View>
            <View>
              <Text className="text-[8px] uppercase text-emerald-500 font-bold tracking-wider">
                Within
              </Text>
              <Text className="text-sm font-bold text-slate-800">
                {radius} km
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#94a3b8" className="ml-2"/>
          </TouchableOpacity>
          
        </View>
      </SafeAreaView>
    </View>
  );
};