import { useUserLocation } from "@/src/context/LocationContext";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform
} from "react-native";

const OPENCAGE_API_KEY = process.env.EXPO_PUBLIC_OPENCAGE_KEY || "";

type OpenCageResult = {
  formatted: string;
  geometry: { lat: number; lng: number };
};

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationModal = ({ visible, onClose }: LocationModalProps) => {
  const { setManualLocation } = useUserLocation();
  const [mode, setMode] = useState<"search" | "current">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpenCageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCurrent, setFetchingCurrent] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setMode("search");
      setQuery("");
      setResults([]);
    }
  }, [visible]);

  // Search Logic (Debounced)
  useEffect(() => {
    if (mode !== "search" || !query || query.length < 3) {
      if (!query) setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&limit=5&countrycode=in`
        );
        const data = await res.json();
        if (data.results) {
          setResults(
            data.results.map((r: any) => ({
              formatted: r.formatted,
              geometry: r.geometry,
            }))
          );
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [query, mode]);

  const handleSelect = async (lat: number, lng: number, label: string) => {
    await setManualLocation({ lat, lng, label });
    onClose();
  };

  const handleCurrentLocation = async () => {
    setMode("current");
    setFetchingCurrent(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission denied. Please enable location services.");
        setFetchingCurrent(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = loc.coords;

      let locationLabel = "Unknown Location";

      if (OPENCAGE_API_KEY) {
        try {
          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}`
          );
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            locationLabel = data.results[0].formatted;
          }
        } catch (err) {
          console.error("OpenCage Reverse Error:", err);
        }
      } else {
        const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (addresses.length > 0) {
          const addr = addresses[0];
          locationLabel = `${addr.city || addr.subregion || addr.region}, ${addr.region}`; 
        }
      }

      await handleSelect(latitude, longitude, locationLabel);

    } catch (e) {
      console.error(e);
      alert("Could not fetch location details.");
    } finally {
      setFetchingCurrent(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true} // 👈 Critical: Ensures modal covers the full screen (status bar & nav bar)
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end w-full h-full">
        {/* Transparent touch area to close modal */}
        <TouchableOpacity 
          className="flex-1" 
          activeOpacity={1} 
          onPress={onClose} 
        />

        {/* Bottom Sheet Container */}
        {/* Using w-full and Removing p-5 from here ensures background hits the edge */}
        <View className="bg-white w-full rounded-t-3xl h-[85%] shadow-2xl overflow-hidden">
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
          >
            {/* Inner Content with Padding */}
            <View className="flex-1 p-5">
              
              {/* Handle bar */}
              <View className="items-center mb-4">
                <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </View>

              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-slate-900">Select Location</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Ionicons name="close-circle" size={28} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Quick Action: Use Current Location */}
              <TouchableOpacity
                onPress={handleCurrentLocation}
                disabled={fetchingCurrent}
                className={`flex-row items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-6 ${fetchingCurrent ? 'opacity-70' : ''}`}
              >
                <View className="w-10 h-10 bg-emerald-100 rounded-full items-center justify-center mr-3">
                  {fetchingCurrent ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <Ionicons name="navigate" size={20} color="#059669" />
                  )}
                </View>
                <View>
                  <Text className="font-bold text-emerald-800">
                    {fetchingCurrent ? "Fetching address..." : "Use Current Location"}
                  </Text>
                  <Text className="text-xs text-emerald-600">
                    {fetchingCurrent ? "Please wait a moment" : "Get nearby updates instantly"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Search Input */}
              <View className="flex-row items-center bg-gray-100 h-12 px-4 rounded-xl mb-4 border border-gray-200">
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput
                  placeholder="Search city, village, or PIN..."
                  className="flex-1 ml-2 font-medium text-slate-800"
                  placeholderTextColor="#94a3b8"
                  value={query}
                  onChangeText={setQuery}
                  onFocus={() => setMode("search")}
                  autoCorrect={false}
                />
              </View>

              {/* Results List */}
              {loading ? (
                <ActivityIndicator className="mt-4" />
              ) : (
                <>
                  {results.length > 0 ? (
                    <FlatList
                      data={results}
                      keyExtractor={(item, i) => i.toString()}
                      keyboardShouldPersistTaps="handled" // Allows tapping results while keyboard is open
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() =>
                            handleSelect(item.geometry.lat, item.geometry.lng, item.formatted)
                          }
                          className="py-4 border-b border-gray-100 flex-row items-center"
                        >
                          <Ionicons name="location-outline" size={20} color="#64748b" />
                          <Text className="ml-3 text-slate-700 font-medium flex-1">
                            {item.formatted}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                      )}
                    />
                  ) : (
                    // ✨ NO RESULTS FOUND STATE
                    query.length > 2 && (
                      <View className="items-center justify-center py-10 opacity-80">
                        <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-3">
                          <Ionicons name="search-outline" size={32} color="#94a3b8" />
                        </View>
                        <Text className="text-slate-500 text-center px-10 leading-5">
                          We couldn't find "{query}".{"\n"}
                          <Text className="font-semibold text-emerald-600">Try searching by PIN code</Text> (e.g. 416106)
                        </Text>
                      </View>
                    )
                  )}
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};