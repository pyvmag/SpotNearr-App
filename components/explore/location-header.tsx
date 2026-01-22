// components/LocationHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface LocationHeaderProps {
  label?: string;
}

export const LocationHeader = ({ label }: LocationHeaderProps) => {
  const router = useRouter();

  return (
    <View className="mt-6 mb-2">
      <TouchableOpacity
        onPress={() => router.push("/(main)/(modals)/location-picker")}
        className="flex-row items-center"
      >
        <Ionicons name="location" size={20} color="#3b82f6" />
        {/* flex-1 and numberOfLines ensures it stays on one line */}
        <View className="flex-1 ml-1 mr-2">
          <Text 
            className="text-sm font-bold text-gray-800" 
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label ?? "Select Location"}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#9ca3af" />
      </TouchableOpacity>
    </View>
  );
};