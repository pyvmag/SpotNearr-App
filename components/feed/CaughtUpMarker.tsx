import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CaughtUpMarker() {
  return (
    <View className="items-center justify-center py-16 px-10">
      {/* Visual Bridge: Pulsing Location Pin transitioning to Archive Gray */}
      <View className="mb-6 relative items-center justify-center">
        {/* Subtle background pulse */}
        <View className="absolute w-16 h-16 bg-slate-100 rounded-full animate-pulse" />
        <View className="bg-white p-5 rounded-full shadow-sm border border-slate-100">
          <Ionicons name="map-outline" size={32} color="#64748b" />
        </View>
      </View>
      
      <View className="items-center">
        <Text className="text-slate-900 font-black text-xl tracking-tight text-center">
          Neighborhood Explored
        </Text>
        
        <Text className="text-slate-400 text-[14px] text-center mt-3 leading-6 font-medium">
          You've seen every new spot.{"\n"}
          Diving back into older highlights...
        </Text>
      </View>

      {/* The "Bridge" Line: A vertical line that literally connects to the next card */}
      <View className="h-20 w-[2px] bg-slate-100 mt-8 items-center">
        <View className="bg-slate-50 px-3 py-1 -mb-1 rounded-full border border-slate-100">
          <Text className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Archive
          </Text>
        </View>
      </View>
    </View>
  );
}
