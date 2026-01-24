import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FilterOverlayProps {
  visible: boolean;
  radius: number;
  setRadius: (r: number) => void;
  onClose: () => void;
}

const DISTANCE_OPTIONS = [1, 2, 5, 10, 15, 20, 30, 50];

export const FilterOverlay = ({
  visible,
  radius,
  setRadius,
  onClose,
}: FilterOverlayProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="absolute top-0 left-0 right-0 bottom-0 bg-black/60"
      />

      {/* Bottom Sheet */}
      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 pb-10 shadow-2xl">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-xl font-extrabold text-slate-900">
              Set Distance
            </Text>
            <Text className="text-slate-500 text-sm">
              How far should we search?
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="bg-slate-50 p-2 rounded-full"
          >
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 20 }}
          className="mb-6"
        >
          {DISTANCE_OPTIONS.map((opt) => {
            const isSelected = radius === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setRadius(opt)}
                className={`w-20 h-16 rounded-2xl items-center justify-center border ${
                  isSelected
                    ? "bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <Text
                  className={`font-bold text-lg ${
                    isSelected ? "text-white" : "text-slate-700"
                  }`}
                >
                  {opt} km
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={onClose}
          className="bg-slate-900 h-14 rounded-2xl items-center justify-center flex-row"
        >
          <Text className="text-white font-bold text-base mr-2">
            Apply Filter
          </Text>
          <Ionicons name="checkmark-circle" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
