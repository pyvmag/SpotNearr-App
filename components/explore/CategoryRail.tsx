import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

interface CategoryRailProps {
  category: {
    _id: string;
    name: string;
    types: any[];
  };
}

export const CategoryRail = ({ category }: CategoryRailProps) => {
  const router = useRouter();

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-end px-6 mb-4">
        <Text className="text-lg font-bold text-slate-800">
          {category.name}
        </Text>
      </View>

      <FlatList
        data={category.types}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/(main)/(modals)/BusinessListScreen",
                params: { typeId: item._id, typeName: item.name },
              })
            }
            className="w-28 mr-1"
          >
            <View className="w-28 h-28 bg-white rounded-2xl items-center justify-center shadow-sm border border-slate-100 mb-2">
              <View className="w-12 h-12 bg-emerald-50 rounded-full items-center justify-center mb-1">
                <MaterialCommunityIcons
                  name={item.iconName || "storefront-outline"}
                  size={24}
                  color="#059669"
                />
              </View>
            </View>
            <Text className="text-center text-xs font-bold text-slate-600">
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};