import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
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
  const [localRadius, setLocalRadius] = useState(radius);

  // Sync local state only when modal opens
  useEffect(() => {
    if (visible) {
      setLocalRadius(radius);
    }
  }, [visible, radius]);

  const handleSelectDistance = useCallback((distance: number) => {
    setLocalRadius(distance);
  }, []);

  const handleApplyFilter = useCallback(() => {
    setRadius(localRadius);
    onClose();
  }, [localRadius, setRadius, onClose]);

  // Don't render anything if not visible to prevent re-renders
  if (!visible) return null;

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
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}
      />

      {/* Bottom Sheet - Using inline styles to avoid Tailwind re-renders */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a' }}>
              Set Distance
            </Text>
            <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
              How far should we search?
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} style={{
            backgroundColor: '#f1f5f9',
            padding: 8,
            borderRadius: 9999,
          }}>
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Current Selection Indicator */}
        <View style={{
          marginBottom: 16,
          padding: 12,
          backgroundColor: '#ecfdf5',
          borderWidth: 1,
          borderColor: '#bbf7d0',
          borderRadius: 12,
        }}>
          <Text style={{ color: '#166534', fontWeight: '600', fontSize: 14 }}>
            Selected: {localRadius} km
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 32 }}
          contentContainerStyle={{ gap: 10, paddingRight: 20 }}
        >
          {DISTANCE_OPTIONS.map((opt) => {
            const isSelected = localRadius === opt;
            return (
              <TouchableOpacity
                key={opt.toString()}
                onPress={() => handleSelectDistance(opt)}
                style={{
                  width: 80,
                  height: 64,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  backgroundColor: isSelected ? '#059669' : 'white',
                  borderColor: isSelected ? '#059669' : '#e2e8f0',
                  shadowColor: isSelected ? '#059669' : '#000',
                  shadowOffset: isSelected ? { width: 0, height: 4 } : { width: 0, height: 0 },
                  shadowOpacity: isSelected ? 0.3 : 0,
                  shadowRadius: isSelected ? 8 : 0,
                  elevation: isSelected ? 8 : 0,
                }}
              >
                <Text style={{
                  fontWeight: 'bold',
                  fontSize: 18,
                  color: isSelected ? 'white' : '#334155',
                }}>
                  {opt} km
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Apply Filter Button */}
        <TouchableOpacity
          onPress={handleApplyFilter}
          style={{
            backgroundColor: '#059669',
            height: 56,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            shadowColor: '#059669',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginRight: 8 }}>
            Apply Filter ({localRadius}km)
          </Text>
          <Ionicons name="checkmark-circle" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
