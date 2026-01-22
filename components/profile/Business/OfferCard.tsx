import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";

export default function OfferCard({ offer, isOwner, onEdit }: any) {
  const deletePost = useAction(api.actions.deletePostFull);

  const getExpiryLabel = () => {
    if (!offer.expiryDate) return null;
    const diff = offer.expiryDate - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) return "Expired Today";
    if (days === 1) return "Expires Tomorrow";
    return `Expires in ${days} days`;
  };

  const handleMenu = () => {
    Alert.alert("Manage Offer", "Update your neighborhood deal", [
      { text: "Edit Details", onPress: () => onEdit(offer) },
      { 
        text: "Remove Offer", 
        style: "destructive", 
        onPress: () => {
          Alert.alert("Confirm", "Are you sure you want to delete this offer?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deletePost({ contentId: offer._id }) }
          ]);
        } 
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View className="bg-white rounded-3xl p-4 mr-4 shadow-sm border border-gray-100 w-64 relative">
      {isOwner && (
        <TouchableOpacity 
          className="absolute top-6 right-6 z-10 bg-white/90 p-2 rounded-full"
          onPress={handleMenu}
        >
          <Ionicons name="ellipsis-horizontal" size={16} color="#475569" />
        </TouchableOpacity>
      )}
      <Image source={{ uri: offer.imageUrl }} className="w-full h-32 rounded-2xl mb-3" />
      
      <View className="flex-row items-center mb-1">
        <View className="bg-emerald-100 px-2 py-0.5 rounded-md flex-row items-center">
          <Text className="text-emerald-700 text-[10px] font-bold uppercase">
            {getExpiryLabel()}
          </Text>
        </View>
      </View>

      <Text className="font-bold text-slate-900 text-lg" numberOfLines={1}>{offer.offerTitle}</Text>
      <Text className="text-gray-500 text-sm leading-4" numberOfLines={2}>{offer.caption}</Text>
    </View>
  );
}