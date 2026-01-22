import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import PostViewModal from "@/components/profile/Business/PostViewModal";
import { ModeContext } from "@/src/context/ModeContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserProfile } from "@/hooks/useUserProfile";

// Sub-components
import CreateContent from "@/components/Posts/CreateContent";
import BusinessPostGridItem from "@/components/profile/Business/BusinessPostGridItem";
import BusinessProfileHeader from "@/components/profile/Business/BusinessProfileHeader";
import OfferCard from "@/components/profile/Business/OfferCard";

export default function BusinessProfileScreen({ businessId }: { businessId: Id<"businesses"> }) {
  const userProfile = useUserProfile();
  const { activeBusinessId, mode } = useContext(ModeContext) as any;
  const router = useRouter();

  // Logic for Ownership
  const isOwner = mode === "business" && activeBusinessId === businessId;

  // --- UI STATE ---
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"Posts" | "Services" | "Reviews">("Posts");
  
  // NEW: State for editing an offer
  const [editingOffer, setEditingOffer] = useState<any | null>(null);

  // --- DATA FETCHING ---
  const business = useQuery(api.business.getBusinessById, {
    businessId,
    userId: userProfile?._id
  });

  const content = useQuery(api.content.getContentByBusiness, { businessId });

  const isFavorited = business?.isFavorited ?? false;
  const toggleFavoriteMutation = useMutation(api.favourites.toggleFavorite);

  // Data filtering
  const offers = content?.filter(c => c.type === "offer") || [];
  const posts = content?.filter(c => c.type === "post") || [];

  // --- HANDLERS ---
  const handlePostPress = (post: any) => {
    setSelectedPost(post);
    setIsPostModalVisible(true);
  };

  const handleToggleFavorite = async () => {
    if (!userProfile?._id) return;
    try {
      await toggleFavoriteMutation({
        userId: userProfile._id,
        businessId: businessId,
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  if (!business) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="small" color="#10B981" />
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="bg-white flex-1" showsVerticalScrollIndicator={false}>

        {/* 1. Header Section */}
        <BusinessProfileHeader
          business={business}
          isOwner={isOwner}
          isFavorited={isFavorited}
          onEditProfile={() => router.push({
            pathname: "/(main)/(modals)/profile/edit-business",
            params: { businessId: business._id }
          })}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* 2. Special Offers Section - REFACTORED */}
        <View className="mt-8 bg-emerald-50/30 py-6">
          <View className="flex-row justify-between items-center px-6 mb-4">
            <View>
              <Text className="text-xl font-bold text-slate-800">Special Offers</Text>
              <Text className="text-xs text-emerald-600 font-medium">Neighborhood Deals</Text>
            </View>
            
            {isOwner && (
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: "/(main)/(modals)/CreatePosts",
                  params: { type: 'offer' }
                })}
                className="bg-emerald-500 px-4 py-2 rounded-full flex-row items-center shadow-sm"
              >
                <Ionicons name="add" size={18} color="white" />
                <Text className="text-white font-bold ml-1 text-xs">Add Offer</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6">
            {offers.length > 0 ? (
              offers.map((offer) => (
                <OfferCard 
                  key={offer._id} 
                  offer={offer} 
                  isOwner={isOwner} 
                  onEdit={(o: any) => setEditingOffer(o)}
                />
              ))
            ) : (
              <View className="pr-6 py-4">
                <Text className="text-gray-400 italic">No active offers at the moment.</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* 3. Tab Navigation */}
        <View className="flex-row border-b border-gray-100 mt-4">
          {(["Posts", "Services", "Reviews"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 items-center py-4 ${activeTab === tab ? 'border-b-2 border-emerald-500' : ''}`}
            >
              <Text className={`font-bold ${activeTab === tab ? 'text-emerald-500' : 'text-gray-400'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. Tab Content */}
        <View className="min-h-[400px]">
          {activeTab === "Posts" && (
            <View>
              <View className="flex-row flex-wrap mt-4">
                {posts.map((post) => (
                  <BusinessPostGridItem
                    key={post._id}
                    post={post}
                    isOwner={isOwner}
                    onPress={() => handlePostPress(post)}
                  />
                ))}
                {posts.length === 0 && (
                  <View className="w-full py-20 items-center">
                    <Ionicons name="images-outline" size={48} color="#e2e8f0" />
                    <Text className="text-gray-400 mt-2 font-medium">No posts yet</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === "Services" && (
            <View className="p-6">
              <View className="items-center py-10">
                <Ionicons name="construct-outline" size={48} color="#e2e8f0" />
                <Text className="text-gray-400 mt-2 font-medium text-center px-10">
                  {isOwner 
                    ? "List the specific services or products you provide to the community." 
                    : "This business hasn't listed specific services yet."}
                </Text>
                {isOwner && (
                  <TouchableOpacity className="mt-6 bg-emerald-500 px-8 py-3 rounded-full">
                    <Text className="text-white font-bold">Add Service</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {activeTab === "Reviews" && (
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-6">
                <View>
                  <Text className="text-3xl font-bold text-slate-900">4.8</Text>
                  <View className="flex-row mt-1">
                    {[1, 2, 3, 4, 5].map(s => <Ionicons key={s} name="star" size={12} color="#fbbf24" />)}
                  </View>
                </View>
                {!isOwner && (
                  <TouchableOpacity className="bg-slate-900 px-6 py-2 rounded-xl">
                    <Text className="text-white font-bold text-xs">Write Review</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="py-10 items-center border-t border-gray-50">
                <Text className="text-gray-300 italic">No community reviews yet.</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* --- MODALS --- */}

      {/* Post View Modal */}
      <PostViewModal
        isVisible={isPostModalVisible}
        onClose={() => setIsPostModalVisible(false)}
        post={selectedPost}
        business={business}
        isOwner={isOwner}
      />

      {/* Edit Offer Modal - Full Screen Overlay */}
      {editingOffer && (
        <Modal 
          animationType="slide" 
          transparent={false} 
          visible={!!editingOffer}
        >
          <View className="flex-1 bg-white">
            <View className="pt-14 px-6 pb-2 flex-row justify-between items-center bg-white">
              <TouchableOpacity 
                onPress={() => setEditingOffer(null)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
              <Text className="font-bold text-lg text-slate-900">Edit Offer</Text>
              <View className="w-10" /> 
            </View>
            
            <CreateContent 
              businessId={businessId}
              type="offer"
              initialData={editingOffer}
              onClose={() => setEditingOffer(null)}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}