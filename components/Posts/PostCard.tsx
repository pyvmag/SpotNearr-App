import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import { shareContent } from "@/lib/shareUtils";

const { width } = Dimensions.get("window");

export default function PostCard({ post, business, isOwner, showHeader = true, onDeleteSuccess }: any) {
    const [isDeleting, setIsDeleting] = useState(false);
    const deletePostAction = useAction(api.actions.deletePostFull);

    const handleOptionsPress = () => {
        Alert.alert("Post Options", "Manage this neighborhood post", [
            { text: "Delete Post", style: "destructive", onPress: confirmDelete },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const confirmDelete = async () => {
        try {
            setIsDeleting(true);
            await deletePostAction({ contentId: post._id });
            if (onDeleteSuccess) {
                onDeleteSuccess();
            }
        } catch (error) {
            Alert.alert("Error", "Could not delete this post.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <View className="bg-white mb-4">
            {/* 1. Header: Business Identity (Optional for Profile, Vital for Feed) */}
            {showHeader && (
                <View className="flex-row items-center px-4 py-3">
                    <View className="p-[1px] border border-emerald-500 rounded-full">
                        <Image
                            source={{ uri: business?.logoUrl || "https://via.placeholder.com/150" }}
                            className="w-9 h-9 rounded-full bg-gray-100"
                        />
                    </View>
                    <View className="ml-3 flex-1">
                        <Text className="font-bold text-slate-900 text-sm">{business?.name}</Text>
                        <Text className="text-gray-500 text-[10px]">{business?.address || "Local"}</Text>
                    </View>
                </View>
            )}

            {/* 2. Main Visual */}
            <View className="px-4">
                <Image
                    source={{ uri: post.imageUrl }}
                    style={{ width: width - 32, height: width - 32 }}
                    className="bg-gray-50 rounded-[32px]"
                    resizeMode="cover"
                />
            </View>

            {/* 3. Action Bar */}
            <View className="flex-row items-center justify-between px-6 py-4">
                <View className="flex-row items-center space-x-6">
                    <TouchableOpacity className="flex-row items-center">
                        <Ionicons name="heart-outline" size={26} color="#1e293b" />
                        <Text className="ml-1 font-bold text-slate-700 text-sm">24</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center">
                        <Ionicons name="chatbubble-outline" size={24} color="#1e293b" />
                        <Text className="ml-1 font-bold text-slate-700 text-sm">3</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => shareContent(post, business)}>
                        <Ionicons name="paper-plane-outline" size={24} color="#1e293b" />
                    </TouchableOpacity>
                </View>

                {isOwner && (
                    <TouchableOpacity onPress={handleOptionsPress} disabled={isDeleting}>
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                        ) : (
                            <Ionicons name="trash-outline" size={24} color="#1e293b" />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* 4. Caption Area */}
            <View className="px-6 pb-4">
                <Text className="text-slate-800 text-sm leading-5">
                    <Text className="font-bold">{business?.name} </Text>
                    {post.caption}
                </Text>
                <Text className="text-gray-400 text-[10px] mt-2 font-medium uppercase tracking-tighter">
                    {new Date(post._creationTime).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })}
                </Text>
            </View>
        </View>
    );
}