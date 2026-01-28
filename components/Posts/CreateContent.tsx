import { api } from "@/convex/_generated/api";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  businessId: any;
  type?: "post" | "offer";
  initialData?: any;
  onClose?: () => void;
}

export default function CreateContent({
  businessId,
  type = "post",
  initialData,
  onClose,
}: Props) {
  const router = useRouter();

  // -------------------- STATE --------------------
  const [image, setImage] = useState<string | null>(
    initialData?.imageUrl || null
  );
  const [caption, setCaption] = useState(initialData?.caption || "");
  const [offerTitle, setOfferTitle] = useState(
    initialData?.offerTitle || ""
  );

  // Store expiry as Date object
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    initialData?.expiryDate
      ? new Date(initialData.expiryDate)
      : undefined
  );

  const [isUploading, setIsUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // -------------------- CONVEX --------------------
  const createContent = useMutation(api.content.createContent);
  const updateContent = useMutation(api.content.updateContent);

  // -------------------- IMAGE PICKER --------------------
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // -------------------- PUBLISH --------------------
  const handlePublish = async () => {
    if (!image || !caption.trim()) {
      return Alert.alert(
        "Missing Info",
        "Please add a photo and a description."
      );
    }

    if (type === "offer" && (!offerTitle.trim() || !expiryDate)) {
      return Alert.alert(
        "Missing Info",
        "Please add an Offer Title and Expiry Date."
      );
    }

    setIsUploading(true);

    try {
      if (initialData) {
        // -------- UPDATE --------
        await updateContent({
          contentId: initialData._id,
          caption: caption.trim(),
          offerTitle:
            type === "offer" ? offerTitle.trim() : undefined,
          expiryDate:
            type === "offer" && expiryDate
              ? expiryDate.getTime()
              : undefined,
        });

        Alert.alert("Success", "Updated successfully!");
      } else {
        // -------- CREATE --------
        const uploaded = await uploadImageToCloudinary(image);

        await createContent({
          businessId,
          type,
          imageUrl: uploaded.url,
          imageUrlPublic: uploaded.publicId,
          caption: caption.trim(),
          ...(type === "offer" && expiryDate && {
            offerTitle: offerTitle.trim(),
            expiryDate: expiryDate.getTime(),
          }),
        });

        Alert.alert("Success", "Published successfully!");
      }

      onClose ? onClose() : router.back();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Something went wrong"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // -------------------- DATE LOGIC --------------------
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDateChange = (
    event: any,
    selectedDate?: Date
  ) => {
    // Android fires twice → dismiss + set
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    // ✅ ONLY accept confirmed selection
    if (event.type === "set" && selectedDate) {
      const normalizedDate = new Date(selectedDate);
      normalizedDate.setHours(0, 0, 0, 0);
      setExpiryDate(normalizedDate);
    }
  };

  // -------------------- UI --------------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 60,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-black text-slate-900 mb-2">
          {initialData ? `Edit ${type}` : `New ${type}`}
        </Text>

        <Text className="text-gray-400 mb-8">
          {type === "offer"
            ? "Create a deal for your locals."
            : "Share an update with the area."}
        </Text>

        {!initialData && (
          <TouchableOpacity
            onPress={pickImage}
            className="w-full aspect-square bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 justify-center items-center overflow-hidden mb-8"
          >
            {image ? (
              <Image
                source={{ uri: image }}
                className="w-full h-full"
              />
            ) : (
              <View className="items-center">
                <Ionicons
                  name="image"
                  size={32}
                  color="#10B981"
                />
                <Text className="text-gray-400 font-bold mt-2">
                  Tap to upload photo
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {type === "offer" && (
          <View className="mb-6">
            <Text className="text-slate-900 font-bold mb-2 ml-1">
              Offer Title
            </Text>

            <TextInput
              placeholder="e.g. Buy 1 Get 1 Free"
              value={offerTitle}
              onChangeText={setOfferTitle}
              className="bg-gray-50 p-4 rounded-2xl text-slate-900 border border-gray-100 mb-4"
            />

            <Text className="text-slate-900 font-bold mb-2 ml-1">
              Expiry Date
            </Text>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-row justify-between items-center"
            >
              <Text
                className={
                  expiryDate
                    ? "text-slate-900"
                    : "text-gray-400"
                }
              >
                {expiryDate
                  ? expiryDate.toLocaleDateString()
                  : "When does this end?"}
              </Text>

              <Ionicons
                name="calendar"
                size={20}
                color="#10B981"
              />
            </TouchableOpacity>
          </View>
        )}

        <View className="mb-10">
          <Text className="text-slate-900 font-bold mb-2 ml-1">
            {type === "post" ? "Caption" : "Offer Details"}
          </Text>

          <TextInput
            multiline
            placeholder="Write something..."
            value={caption}
            onChangeText={setCaption}
            className="bg-gray-50 p-4 rounded-2xl text-slate-900 h-32 border border-gray-100"
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          onPress={handlePublish}
          disabled={isUploading}
          className={`w-full py-5 rounded-2xl items-center shadow-lg ${
            isUploading ? "bg-gray-300" : "bg-emerald-500"
          }`}
        >
          {isUploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-black text-lg uppercase tracking-widest">
              {initialData ? "Update" : "Publish"} {type}
            </Text>
          )}
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={expiryDate || today}
            mode="date"
            minimumDate={today}
            display={
              Platform.OS === "ios" ? "inline" : "default"
            }
            onChange={handleDateChange}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
