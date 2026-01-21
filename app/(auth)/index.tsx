import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import SocialSignIn from '@/components/auth/social-sign-in'; // Adjust path if needed

export default function AuthIndex() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-between py-12">
        {/* Top Section: Branding */}
        <View className="items-center mt-10">
          <View className="w-20 h-20 bg-black rounded-2xl items-center justify-center mb-6">
             {/* Logo will go here */}
             <Text className="text-white text-3xl font-bold">S</Text>
          </View>
          <Text className="text-4xl font-black text-black tracking-tight">
            Spotnearr
          </Text>
          <Text className="text-gray-500 text-center mt-3 text-lg px-4">
            Your neighborhood social utility. Find local deals, services, and community updates.
          </Text>
        </View>

        {/* Bottom Section: Action */}
        <View className="w-full space-y-4">
          <Text className="text-center text-gray-400 text-sm mb-4">
            Connect with your community to get started
          </Text>
          
          {/* Customizing your SocialSignIn trigger area */}
          <View className="bg-gray-100 rounded-2xl overflow-hidden">
             <SocialSignIn />
          </View>
          
          <Text className="text-center text-gray-400 text-xs mt-6 px-8">
            By continuing, you agree to Spotnearr's Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}