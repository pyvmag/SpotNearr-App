import React from "react";
import { View, Text, SafeAreaView } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import SocialSignIn from "@/components/auth/social-sign-in";

export default function AuthIndex() {
  const { isConnected } = useNetInfo();
  const isOffline = isConnected === false;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-between py-12">
        {/* Branding */}
        <View className="items-center mt-10">
          <View className="w-20 h-20 bg-black rounded-2xl items-center justify-center mb-6">
            <Text className="text-white text-3xl font-bold">S</Text>
          </View>

          <Text className="text-4xl font-black text-black">
            Spotnearr
          </Text>

          <Text className="text-gray-500 text-center mt-3 text-lg px-4">
            Your neighborhood social utility. Find local deals,
            services, and community updates.
          </Text>
        </View>

        {/* Actions */}
        <View className="w-full space-y-4">
          {isOffline ? (
            <Text className="text-center text-gray-500 text-sm px-6">
              You’re offline. Connect to the internet to log in.
            </Text>
          ) : (
            <View className="bg-gray-100 rounded-2xl overflow-hidden">
              <SocialSignIn />
            </View>
          )}

          <Text className="text-center text-gray-400 text-xs mt-6 px-8">
            By continuing, you agree to Spotnearr's Terms of Service
            and Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
