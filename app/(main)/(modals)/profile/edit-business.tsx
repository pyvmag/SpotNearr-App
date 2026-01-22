import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { Ionicons } from "@expo/vector-icons";
import { useAction, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditBusinessScreen() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams<{
    businessId: Id<"businesses">;
  }>();

  // 1️⃣ Fetch business
  const business = useQuery(api.business.getBusinessById, { businessId });

  // 2️⃣ Node action (Cloudinary deletion + DB update)
  const updateBusiness = useAction(api.actions.updateBusinessFull);

  // 3️⃣ Local state
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    address: "",
    profileImage: "",
    coverImage: "",
  });

  // 4️⃣ Sync form once business loads
  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || "",
        bio: business.bio || "",
        address: business.address || "",
        profileImage: business.profileImage || "",
        coverImage: business.coverImage || "",
      });
    }
  }, [business]);

  // 5️⃣ Image picker
  const pickImage = async (type: "profileImage" | "coverImage") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "profileImage" ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setForm((prev) => ({
        ...prev,
        [type]: result.assets[0].uri,
      }));
    }
  };

  // 6️⃣ Save handler
  const handleSave = async () => {
    if (!form.name.trim()) {
      return Alert.alert("Required", "Business name is required");
    }

    setLoading(true);
    try {
  let profileImage = form.profileImage;
  let profileImagePublicId = null;

  let coverImage = form.coverImage;
  let coverImagePublicId = null;

      // Upload only if local image
  if (form.profileImage && !form.profileImage.startsWith("http")) {
    const uploaded = await uploadImageToCloudinary(form.profileImage);
    profileImage = uploaded.url;
    profileImagePublicId = uploaded.publicId;
  }

  if (form.coverImage && !form.coverImage.startsWith("http")) {
    const uploaded = await uploadImageToCloudinary(form.coverImage);
    coverImage = uploaded.url;
    coverImagePublicId = uploaded.publicId;
  }

      await updateBusiness({
        businessId,
        name: form.name,
        bio: form.bio,
        address: form.address,
        profileImage: profileImage,
        profileImagePublicId: profileImagePublicId || undefined,
        coverImage: coverImage,
        coverImagePublicId: coverImagePublicId || undefined,
      });

      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!business) {
    return <ActivityIndicator className="mt-20" color="#10B981" />;
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* ---------- COVER + PROFILE ---------- */}
      <View className="h-64 bg-gray-100">
        <Image
          source={{
            uri: form.coverImage || "https://via.placeholder.com/800x400",
          }}
          className="w-full h-full"
        />

        <TouchableOpacity
          onPress={() => pickImage("coverImage")}
          className="absolute inset-0 bg-black/20 justify-center items-center"
        >
          <View className="bg-white/20 p-3 rounded-full">
            <Ionicons name="camera" size={28} color="white" />
          </View>
          <Text className="text-white font-bold mt-2">
            Change Cover Photo
          </Text>
        </TouchableOpacity>

        <View className="absolute -bottom-12 left-6">
          <TouchableOpacity onPress={() => pickImage("profileImage")}>
            <Image
              source={{
                uri: form.profileImage || "https://via.placeholder.com/150",
              }}
              className="w-24 h-24 rounded-full border-4 border-white"
            />
            <View className="absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full border-2 border-white">
              <Ionicons name="pencil" size={14} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------- FORM ---------- */}
      <View className="px-6 mt-16 pb-10">
        <Text className="text-gray-400 font-bold mb-2">Business Name</Text>
        <TextInput
          value={form.name}
          onChangeText={(val) => setForm({ ...form, name: val })}
          className="bg-gray-50 p-4 rounded-2xl mb-6"
        />

        <Text className="text-gray-400 font-bold mb-2">Bio</Text>
        <TextInput
          value={form.bio}
          onChangeText={(val) => setForm({ ...form, bio: val })}
          multiline
          className="bg-gray-50 p-4 rounded-2xl mb-6 h-24"
        />

        <Text className="text-gray-400 font-bold mb-2">Address</Text>
        <TextInput
          value={form.address}
          onChangeText={(val) => setForm({ ...form, address: val })}
          className="bg-gray-50 p-4 rounded-2xl mb-10"
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className={`w-full py-4 rounded-2xl items-center ${
            loading ? "bg-gray-300" : "bg-emerald-500"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Save Profile
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
