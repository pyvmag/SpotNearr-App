// app/(main)/(tabs)/profile.tsx
import BusinessProfileScreen from "@/components/profile/BusinessProfileScreen";
import ProfileHeader from "@/components/profile/Header";
import UserProfileScreen from "@/components/profile/UserProfileScreen";
import { ModeContext } from "@/src/context/ModeContext";
import { Id } from "@/convex/_generated/dataModel";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useContext } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function Profile() {
  const userProfile = useUserProfile();
  const { mode, activeBusinessId } = useContext(ModeContext) as any;

  if (!userProfile) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator /></View>;
  }
  return (
    <View className="flex-1 bg-white">
      <ProfileHeader userProfile={userProfile} />
      {mode === "business" ? (
        activeBusinessId ? (
          <BusinessProfileScreen businessId={activeBusinessId as Id<"businesses">} />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500">No business selected</Text>
          </View>
        )
      ) : (
        <UserProfileScreen userId={userProfile._id} />
      )}
    </View>
  );
}