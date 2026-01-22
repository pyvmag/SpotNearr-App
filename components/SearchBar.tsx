// components/SearchBar.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TextInput, View } from "react-native";

export const SearchBar = () => {
  return (
    <View className="flex-row items-center bg-white rounded-2xl px-4 py-1 mb-8 shadow-sm border border-gray-100">
      <Ionicons name="search" size={20} color="#9ca3af" />
      <TextInput
        placeholder="Search for restaurants, plumbers.."
        placeholderTextColor="#9ca3af"
        className="flex-1 ml-3 text-base text-gray-800"
      />
    </View>
  );
};