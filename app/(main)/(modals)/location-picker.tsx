import { useUserLocation } from "@/src/context/LocationContext";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const OPENCAGE_API_KEY = process.env.EXPO_PUBLIC_OPENCAGE_KEY || "";

type OpenCageResult = {
  formatted: string;
  geometry: {
    lat: number;
    lng: number;
  };
};

export default function LocationPicker() {
  const { setManualLocation } = useUserLocation();
  const router = useRouter();

  const [mode, setMode] = useState<"search" | "current">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpenCageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCurrent, setFetchingCurrent] = useState(false);

  // 🔍 OpenCage autocomplete (debounced)
  useEffect(() => {
    if (mode !== "search" || !query || query.length < 3) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        if (!OPENCAGE_API_KEY || OPENCAGE_API_KEY === "your_opencage_api_key_here") {
          console.warn("OpenCage API key not configured");
          return;
        }

        const res = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
            query
          )}&key=${OPENCAGE_API_KEY}&limit=5&countrycode=in`
        );
        const data = await res.json();

        if (data.status && data.status.code === 200) {
          const formattedResults: OpenCageResult[] = data.results.map((r: any) => ({
            formatted: r.formatted,
            geometry: {
              lat: r.geometry.lat,
              lng: r.geometry.lng,
            },
          }));

          setResults(formattedResults);
        } else {
          console.error("OpenCage API error:", data.status);
        }
      } catch (err) {
        console.error("OpenCage search error:", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [query, mode]);

  const selectLocation = async (item: OpenCageResult) => {
    await setManualLocation({
      lat: item.geometry.lat,
      lng: item.geometry.lng,
      label: item.formatted,
    });
    router.back();
  };

  // 📍 Use current location
  const useCurrentLocation = async () => {
    try {
      setFetchingCurrent(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied. Please enable location permissions in your device settings.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = position.coords;

      if (!OPENCAGE_API_KEY || OPENCAGE_API_KEY === "your_opencage_api_key_here") {
        // Fallback: use coordinates directly if API key is not configured
        await setManualLocation({
          lat: latitude,
          lng: longitude,
          label: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
        });
        router.back();
        return;
      }

      const res = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}`
      );
      const data = await res.json();

      const result = data.results?.[0];
      if (!result) {
        // Fallback to coordinates if reverse geocoding fails
        await setManualLocation({
          lat: latitude,
          lng: longitude,
          label: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
        });
        router.back();
        return;
      }

      await setManualLocation({
        lat: latitude,
        lng: longitude,
        label: result.formatted,
      });
      console.log("Selected location:", {
        lat: latitude,
        lng: longitude,
        label: result.formatted,
      });
      router.back();
    } catch (err) {
      console.error(err);
      alert("Failed to get current location. Please ensure location services are enabled and try again.");
    } finally {
      setFetchingCurrent(false);
    }
  };

  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-lg font-semibold mb-4">
        Choose your location
      </Text>

      {/* Mode selector */}
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          onPress={() => setMode("search")}
          className={`flex-1 py-3 rounded-xl border ${
            mode === "search" ? "bg-black" : "border-gray-300"
          }`}
        >
          <Text className={`text-center ${mode === "search" ? "text-white" : ""}`}>
            Search Location
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setMode("current");
            useCurrentLocation();
          }}
          className={`flex-1 py-3 rounded-xl border ${
            mode === "current" ? "bg-black" : "border-gray-300"
          }`}
        >
          <Text className={`text-center ${mode === "current" ? "text-white" : ""}`}>
            Use Current Location
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search mode */}
      {mode === "search" && (
        <>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Village, town, city, area"
            className="border rounded-lg px-4 py-3 mb-3"
          />

          {loading && <Text className="text-gray-500 mb-2">Searching...</Text>}

          <FlatList
            data={results}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selectLocation(item)}
                className="py-3 border-b border-gray-200"
              >
                <Text>{item.formatted}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* Current location loading */}
      {fetchingCurrent && (
        <View className="mt-6">
          <ActivityIndicator />
          <Text className="text-center mt-2 text-gray-500">
            Fetching current location...
          </Text>
        </View>
      )}
    </View>
  );
}
