import PostCard from "@/components/Posts/PostCard";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const { width } = Dimensions.get("window");

interface PostViewModalProps {
  isVisible: boolean;
  onClose: () => void;
  post: any;
  business: any;
  isOwner: boolean;
  onDeleteSuccess?: () => void;
}

export default function PostViewModal({ isVisible, onClose, post, business, isOwner }: any) {
  if (!post) return null;

  return (
    <Modal animationType="slide" visible={isVisible} presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center px-5 py-4 border-b border-gray-50">
          <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
            <Ionicons name="chevron-down" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="ml-4 text-lg font-bold text-slate-900">Post</Text>
        </View>
        <ScrollView>
          <PostCard 
            post={post} 
            business={business} 
            isOwner={isOwner} 
            // ADD THIS LINE BELOW:
            onDeleteSuccess={onClose} 
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}