import { ModeContext } from "@/src/context/ModeContext";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function SwitchProfileModal({
  visible,
  onClose,
  onLogout,
  userId,
}: any) {
  const { setMode, setActiveBusinessId, mode, activeBusinessId } =
    useContext(ModeContext);
  const router = useRouter();

  const businesses = useQuery(
    api.business.getBusinessesByOwner,
    userId ? { ownerId: userId } : "skip"
  );

  const selectUser = () => {
    setActiveBusinessId(null);
    setMode("user");
    onClose();
  };

  const selectBusiness = (businessId: string) => {
    setActiveBusinessId(businessId);
    setMode("business");
    onClose();
  };
  const handleLogout = () => {
    // ✅ reset app state
    setActiveBusinessId(null);
    setMode("user");

    // close modal first (optional but clean UX)
    onClose();

    // actual logout (auth)
    onLogout();
  };
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-[32px] p-6 pb-10">
          <Text className="text-xl font-bold mb-6">Switch Account</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              onPress={selectUser}
              className={`flex-row items-center p-4 rounded-2xl mb-3 ${mode === "user" ? "bg-blue-50 border border-blue-100" : "bg-gray-50"
                }`}
            >
              <Ionicons name="person" size={20} color="#3b82f6" />
              <Text className="ml-4 font-bold flex-1">Personal Profile</Text>
              {mode === "user" && (
                <Ionicons name="checkmark-circle" size={22} color="#3b82f6" />
              )}
            </TouchableOpacity>

            <Text className="text-[10px] font-bold text-gray-400 uppercase mt-4 mb-2">
              My Businesses
            </Text>

            {businesses?.map((b) => (
              <TouchableOpacity
                key={b._id}
                onPress={() => selectBusiness(b._id)}
                className={`flex-row items-center p-4 rounded-2xl mb-3 ${mode === "business" && activeBusinessId === b._id
                  ? "bg-emerald-50 border border-emerald-100"
                  : "bg-gray-50"
                  }`}
              >
                <Ionicons name="briefcase" size={20} color="#10b981" />
                <Text className="ml-4 font-bold flex-1">{b.name}</Text>
                {mode === "business" && activeBusinessId === b._id && (
                  <Ionicons name="checkmark-circle" size={22} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push("/(main)/(modals)/AddBusiness/create-business");
              }}
              className="flex-row items-center p-4 mt-2"
            >
              <Ionicons name="add-circle-outline" size={22} color="#64748b" />
              <Text className="ml-4 font-semibold text-slate-600">
                Add New Business
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center p-4"
            >
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
              <Text className="ml-4 font-semibold text-red-500">Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
