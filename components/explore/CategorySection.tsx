// components/category-section.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export const CategorySection = ({ category }: { category: any }) => {
  const router = useRouter();

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-gray-900">{category.name}</Text>
      </View>

      <View className="flex-row flex-wrap justify-between">
        {category.types.map((type: any) => (
          <TouchableOpacity
            key={type._id}
            onPress={() =>
              router.push({
                pathname: "/(main)/(modals)/BusinessListScreen",
                params: { typeId: type._id, typeName: type.name },
              })
            }
            activeOpacity={0.7}
            className="w-[48%] bg-white p-5 rounded-[28px] mb-4 shadow-sm border border-gray-50"
          >
            <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mb-4">
              {/* Dynamic Icon from DB with a fallback */}
              <MaterialCommunityIcons 
                name={type.iconName || "briefcase-outline"} 
                size={24} 
                color="#3b82f6" 
              />
            </View>
            <Text className="font-bold text-gray-800 text-base" numberOfLines={1}>
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};