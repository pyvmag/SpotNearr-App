import { ModeContext } from "@/src/context/ModeContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const OPENCAGE_API_KEY = process.env.EXPO_PUBLIC_OPENCAGE_KEY || "";

export default function CreateBusinessScreen() {
  const userProfile = useUserProfile();
  const router = useRouter();
  const { setMode, setActiveBusinessId } = useContext(ModeContext) as any;

  // --- Step State ---
  const [step, setStep] = useState(1);

  // --- Form State ---
  const [businessName, setBusinessName] = useState("");
  const [uniqueBusinessName, setUniqueBusinessName] = useState(""); 
  const [bio, setBio] = useState("");
  const [detailedAddress, setDetailedAddress] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"businessCategories"> | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<Id<"businessTypes"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Unique Name Availability Logic ---
  const isCheckingAvailability = uniqueBusinessName.length > 2;
  const availabilityResult = useQuery(
    api.business.checkBusinessNameAvailability,
    isCheckingAvailability ? { business_name: uniqueBusinessName } : "skip"
  );

  useEffect(() => {
    if (businessName && !uniqueBusinessName) {
      const suggested = businessName
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9._]/g, "");
      setUniqueBusinessName(suggested);
    }
  }, [businessName]);

  // --- Location State ---
  const [locationMode, setLocationMode] = useState<"search" | "current">("search");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
  // Stores the clean coordinates and formatted address
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | undefined>(undefined);

  // --- Convex ---
  const categories = useQuery(api.business.getBusinessCategories);
  const subTypes = useQuery(
    api.business.getBusinessTypesByCategory,
    selectedCategoryId ? { categoryId: selectedCategoryId } : "skip"
  );
  const createBusiness = useMutation(api.business.createBusiness);
  const updateUserProfile = useMutation(api.users.updateProfile);

  // 🔍 Location Search Logic
  useEffect(() => {
    if (locationMode !== "search" || !locationQuery || locationQuery.length < 3 || selectedLocation) {
      setLocationResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        if (!OPENCAGE_API_KEY) return;
        const res = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(locationQuery)}&key=${OPENCAGE_API_KEY}&limit=5&countrycode=in`
        );
        const data = await res.json();
        if (data.status?.code === 200) {
          setLocationResults(data.results || []);
        }
      } catch (err) { 
        console.error("Location search error:", err); 
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [locationQuery, locationMode, selectedLocation]);

  const handleUseCurrentLocation = async () => {
    try {
      setIsFetchingLocation(true);
      setSelectedLocation(undefined);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      if (!OPENCAGE_API_KEY) {
        setSelectedLocation({
          address: `Lat: ${loc.coords.latitude.toFixed(6)}, Lng: ${loc.coords.longitude.toFixed(6)}`,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude
        });
        return;
      }

      const res = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${loc.coords.latitude}+${loc.coords.longitude}&key=${OPENCAGE_API_KEY}`
      );
      const data = await res.json();
      const result = data.results?.[0];

      setSelectedLocation({
        address: result ? result.formatted : "Current Location",
        lat: loc.coords.latitude,
        lng: loc.coords.longitude
      });
      
    } catch (e) { 
      console.error("Location error:", e);
      alert("Failed to get location."); 
    } finally { 
      setIsFetchingLocation(false); 
    }
  };

  const handleContinue = async () => {
    // Step 1 Validation
    if (step === 1) {
      if (!businessName || !selectedLocation || availabilityResult !== true) return;
      setStep(2);
      return;
    }

    // Step 2 Validation & Submission
    if (!userProfile || !selectedTypeId) return;

    setIsLoading(true);
    try {
      // ✅ OPTIMIZED: Flattened Args for new Schema
      const newBusinessId = await createBusiness({
        ownerId: userProfile._id,
        name: businessName.trim(),
        business_name: uniqueBusinessName.trim().toLowerCase(),
        typeId: selectedTypeId,
        
        // 🚀 New Location Fields (Top Level)
        lat: selectedLocation!.lat,
        lng: selectedLocation!.lng,
        // Use manual address if typed, otherwise use GPS address
        address: detailedAddress.trim() ? detailedAddress.trim() : selectedLocation!.address,
        
        bio: bio.trim(),
      });

      await updateUserProfile({ role: "service_provider" });
      
      if (setActiveBusinessId) await setActiveBusinessId(newBusinessId);
      if (setMode) await setMode("business");
      router.replace("/profile");
      
    } catch (e) {
      console.error("Create Business Error:", e);
      alert("Error creating business profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const isStep1Valid = businessName && selectedLocation && availabilityResult === true;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* HEADER */}
      <View className="px-6 py-6 flex-row justify-between items-center border-b border-gray-50">
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)} className="p-2">
          <Ionicons name={step === 1 ? "close" : "arrow-back"} size={28} color="black" />
        </TouchableOpacity>
        <View>
          <Text className="text-lg font-bold text-center">Register Business</Text>
          <Text className="text-[10px] text-gray-400 text-center uppercase tracking-widest">Step {step} of 2</Text>
        </View>
        <TouchableOpacity 
          onPress={handleContinue} 
          disabled={!isStep1Valid || isLoading}
          className={`px-6 py-3 rounded-xl ${!isStep1Valid ? "bg-gray-100" : "bg-emerald-500"} ${isLoading ? "opacity-50" : ""}`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className={`font-bold ${!isStep1Valid ? "text-gray-400" : "text-white"}`}>
              {step === 1 ? "Next" : "Done"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          {step === 1 ? (
            <View>
              <Input label="Business Name" value={businessName} onChange={setBusinessName} placeholder="e.g. Urban Cafe" />

              {/* UNIQUE BUSINESS NAME (HANDLE) */}
              <View className="mb-6">
                <Text className="font-semibold mb-2 text-gray-700">Business ID (Unique)</Text>
                <View className="relative">
                  <TextInput
                    className={`border-2 rounded-xl px-4 py-3 bg-gray-50 ${
                        availabilityResult === true ? "border-emerald-500" : 
                        availabilityResult === false ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="unique_business_name"
                    value={uniqueBusinessName}
                    onChangeText={(val) => setUniqueBusinessName(val.toLowerCase().replace(/\s+/g, "_"))}
                    autoCapitalize="none"
                  />
                  <View className="absolute right-3 top-3.5">
                    {availabilityResult === true ? (
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    ) : availabilityResult === false ? (
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    ) : null}
                  </View>
                </View>
                <Text className="text-[10px] text-gray-400 mt-1 ml-1">This is your unique handle in the neighborhood.</Text>
              </View>

              <Text className="font-semibold mb-2 text-gray-700">Neighborhood / Area</Text>
              <View className="flex-row gap-2 mb-4">
                <TouchableOpacity
                  onPress={() => { setLocationMode("search"); setSelectedLocation(undefined); setLocationQuery(""); }}
                  className={`flex-1 py-3 rounded-xl border ${locationMode === "search" ? "bg-slate-900 border-slate-900" : "border-gray-200"}`}
                >
                  <Text className={`text-center font-medium ${locationMode === "search" ? "text-white" : "text-gray-500"}`}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setLocationMode("current"); handleUseCurrentLocation(); }}
                  className={`flex-1 py-3 rounded-xl border ${locationMode === "current" ? "bg-slate-900 border-slate-900" : "border-gray-200"}`}
                >
                  <Text className={`text-center font-medium ${locationMode === "current" ? "text-white" : "text-gray-500"}`}>Use GPS</Text>
                </TouchableOpacity>
              </View>

              {locationMode === "search" && !selectedLocation && (
                <View className="mb-4">
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
                    placeholder="Search area..."
                    value={locationQuery}
                    onChangeText={setLocationQuery}
                  />
                  {locationResults.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      className="p-4 border-b border-gray-50 bg-white"
                      onPress={() => setSelectedLocation({ address: item.formatted, lat: item.geometry.lat, lng: item.geometry.lng })}
                    >
                      <Text className="text-gray-600 text-sm">{item.formatted}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {isFetchingLocation && <ActivityIndicator size="small" className="my-4" color="#10B981" />}

              {selectedLocation && (
                <View className="mb-6">
                  <View className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex-row items-center justify-between mb-4">
                    <View className="flex-1 pr-2">
                      <Text className="text-emerald-700 font-bold text-[10px] uppercase mb-1">Pinned Neighborhood</Text>
                      <Text className="text-emerald-900 text-sm" numberOfLines={2}>{selectedLocation.address}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedLocation(undefined)}>
                      <Ionicons name="refresh-circle" size={24} color="#059669" />
                    </TouchableOpacity>
                  </View>

                  <Input label="Detailed Address" value={detailedAddress} onChange={setDetailedAddress} placeholder="Shop No, Building Name, Landmark..." />
                </View>
              )}

              <Input label="Business Bio" value={bio} onChange={setBio} multiline placeholder="Tell your neighborhood what you offer..." />
            </View>
          ) : (
            <View>
              <Text className="text-2xl font-bold mb-2">Category & Service</Text>
              <Text className="text-gray-500 mb-6">What does your business specialize in?</Text>

              <View className="flex-row flex-wrap gap-2 mb-6">
                {categories?.map((c) => (
                  <Tag key={c._id} label={c.name} selected={selectedCategoryId === c._id} onPress={() => { setSelectedCategoryId(c._id); setSelectedTypeId(null); }} />
                ))}
              </View>

              {selectedCategoryId && (
                <View className="mb-10">
                  <Text className="font-semibold mb-3 text-gray-700">Select Service Type</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {subTypes?.map((t) => (
                      <Tag key={t._id} label={t.name} selected={selectedTypeId === t._id} onPress={() => setSelectedTypeId(t._id)} />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Internal UI Helpers ---
function Tag({ label, selected, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-xl border ${selected ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}
    >
      <Text className={selected ? "text-emerald-700 font-bold" : "text-gray-600"}>{label}</Text>
    </TouchableOpacity>
  );
}

function Input({ label, value, onChange, placeholder, multiline = false }: any) {
  return (
    <View className="mb-6">
      <Text className="font-semibold mb-2 text-gray-700">{label}</Text>
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-800"
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={multiline ? { height: 80 } : {}}
      />
    </View>
  );
}