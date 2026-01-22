import CreateContent from "@/components/Posts/CreateContent";
import { ModeContext } from "@/src/context/ModeContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
export default function CreateScreen() {
  const userProfile = useUserProfile();
  const { mode, activeBusinessId } = useContext(ModeContext) as any;
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'post' | 'offer' }>();

  if (!userProfile) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  const canCreate = mode === "business" && activeBusinessId;

  if (!canCreate) {
    return (
      <View className="flex-1 justify-center items-center px-10 bg-white">
        <Text className="text-2xl mb-2">🏪</Text>
        <Text className="text-xl font-bold text-center mb-2">
          Business Mode Required
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          Switch to a business profile to create posts or offers.
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/profile")}
          className="bg-emerald-500 px-8 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold">Go to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <CreateContent businessId={activeBusinessId} type={type || 'post'}/>;
}
