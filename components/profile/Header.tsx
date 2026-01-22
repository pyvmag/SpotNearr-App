// components/profile/ProfileHeader.tsx
import { ModeContext } from "@/src/context/ModeContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useContext, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import SwitchProfileModal from "./SwitchProfileModal";

export default function ProfileHeader({ userProfile }: { userProfile: any }) {
  // 1. Pull activeBusinessId from context
  const { mode, activeBusinessId } = useContext(ModeContext) as any;
  const [menuOpen, setMenuOpen] = useState(false);

  // 2. Fetch the SPECIFIC business currently selected
  const business = useQuery(
    api.business.getBusinessById, 
    (mode === "business" && activeBusinessId) 
      ? { businessId: activeBusinessId as Id<"businesses"> } 
      : "skip"
  );

  // 3. Determine the name to display
  const displayName = mode === "business" 
    ? (business?.name || "Loading Business...") 
    : userProfile?.name;

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            console.log('Successfully signed out');
          },
          onError: (error) => {
            console.error("Sign out error:", error);
          }
        }
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <View className="px-6 pt-12 pb-4 flex-row justify-between items-center bg-white border-b border-gray-100 shadow-sm">
      <View className="flex-1">
        <Text className={`text-[10px] uppercase font-bold tracking-widest ${mode === 'business' ? 'text-emerald-500' : 'text-blue-500'}`}>
          {mode === "business" ? "Business Dashboard" : "Personal Profile"}
        </Text>
        <Text className="text-xl font-bold text-slate-900" numberOfLines={1}>
          {displayName}
        </Text>
      </View>

      <View className="flex-row items-center space-x-2">
        {/* Quick action for Business Mode (Optional: Create Post/Offer) */}
        {mode === "business" && (
           <TouchableOpacity className="p-2 bg-emerald-50 rounded-full mr-2">
             <Ionicons name="add" size={20} color="#10B981" />
           </TouchableOpacity>
        )}

        <TouchableOpacity 
          onPress={() => setMenuOpen(true)} 
          className="p-2 bg-gray-50 rounded-full border border-gray-100"
        >
          <Ionicons name="menu-outline" size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <SwitchProfileModal 
        visible={menuOpen} 
        onClose={() => setMenuOpen(false)}
        onLogout={handleSignOut}
        userId={userProfile._id}
      />
    </View>
  );
}