import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Updated for deprecation
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'expo-router';

export default function NeighborhoodFeed() {
  const user = useQuery(api.users.getMe);
  const router = useRouter();

const handleLogout = async () => {
  Alert.alert(
    "Logout",
    "Are you sure you want to log out of Spotnearr?",
    [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive",
        onPress: async () => {
          try {
            await authClient.signOut();
          } catch (error) {
            console.error("Logout failed:", error);
            Alert.alert("Error", "Could not log out. Please try again.");
          }
        } 
      }
    ]
  );
};

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header Area */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} className="w-full h-full" />
            ) : (
              <View className="items-center justify-center flex-1">
                <Ionicons name="person" size={20} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
          <View className="ml-3">
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              Welcome back
            </Text>
            <Text className="text-lg font-bold text-black">
              {user?.name?.split(' ')[0] || 'Neighbor'}
            </Text>
          </View>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="p-2 bg-gray-100 rounded-full"
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Quick Stats / Info Card */}
        <View className="bg-black rounded-3xl p-6 mt-6 shadow-xl">
          <View className="flex-row items-center mb-4">
            <View className="bg-green-500 w-2 h-2 rounded-full mr-2" />
            <Text className="text-green-500 font-bold text-[10px] uppercase">Hyperlocal: Active</Text>
          </View>
          <Text className="text-white text-2xl font-bold mb-1">
            @{user?.username || 'user'}
          </Text>
          <Text className="text-gray-400 text-sm leading-5">
            {user?.bio || "You haven't added a bio yet. Tell your neighbors what you're looking for!"}
          </Text>
          
          <View className="flex-row mt-6">
             <View>
                <Text className="text-white font-bold text-lg">{user?.friendsCount || 0}</Text>
                <Text className="text-gray-500 text-[10px] uppercase font-bold">Neighbors</Text>
             </View>
             <View className="ml-8">
                <Text className="text-white font-bold text-lg">{user?.favoritesCount || 0}</Text>
                <Text className="text-gray-500 text-[10px] uppercase font-bold">Saved Spots</Text>
             </View>
          </View>
        </View>

        {/* Placeholder for the Feed */}
        <View className="mt-8 mb-10">
          <Text className="text-lg font-bold text-black mb-4">Recent in your area</Text>
          <View className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 items-center">
            <View className="bg-gray-50 p-4 rounded-full mb-3">
                <Ionicons name="map-outline" size={32} color="#D1D5DB" />
            </View>
            <Text className="text-gray-500 font-medium">No local updates yet.</Text>
            <Text className="text-gray-400 text-xs text-center mt-1">
              Be the first to post something in your neighborhood!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}