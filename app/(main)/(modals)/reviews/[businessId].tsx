import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";

type EnrichedReview = Doc<"reviews"> & {
  author: Doc<"users"> | null;
};

export default function ReviewScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const router = useRouter();
  
  // State for Input
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Convex Hooks
  const reviews = useQuery(api.review.getReviews, { businessId: businessId as Id<"businesses"> });
  const submitReview = useMutation(api.review.submitReview);

  const handleSubmit = async () => {
    if (rating === 0) return; // Must select stars
    setSubmitting(true);
    try {
      await submitReview({
        businessId: businessId as Id<"businesses">,
        rating,
        content: reviewText
      });
      // Reset form after post
      setReviewText("");
      setRating(0);
    } catch (e) {
      alert("Failed to post review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold">Reviews</Text>
      </View>

      <ScrollView className="flex-1">
        
        {/* --- SECTION A: INPUT HERO --- */}
        <View className="p-6 bg-slate-50 border-b border-gray-100">
            <Text className="text-gray-500 font-medium mb-3">How was your experience?</Text>
            
            {/* Star Picker */}
            <View className="flex-row mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} className="mr-2">
                  <Ionicons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={32} 
                    color={star <= rating ? "#FBBF24" : "#CBD5E1"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Text Input */}
            <TextInput
              placeholder="Write a review..."
              multiline
              value={reviewText}
              onChangeText={setReviewText}
              className="bg-white p-4 rounded-xl border border-gray-200 min-h-[100px] text-base"
              textAlignVertical="top"
            />

            {/* Post Button (Only visible if rating selected) */}
            {rating > 0 && (
                <TouchableOpacity 
                    onPress={handleSubmit}
                    disabled={submitting}
                    className="bg-emerald-500 mt-4 py-3 rounded-xl items-center"
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-base">Post Review</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>

        {/* --- SECTION B: FELLOW REVIEWS --- */}
        <View className="p-6">
            <Text className="font-bold text-lg mb-4 text-slate-800">Community Reviews</Text>
            
            {!reviews ? (
                <ActivityIndicator color="#10B981" />
            ) : reviews.length === 0 ? (
                <Text className="text-gray-400 italic">Be the first to review!</Text>
            ) : (
                reviews.map((review: EnrichedReview) => (
                    <View key={review._id} className="mb-6 border-b border-gray-100 pb-6">
                        <View className="flex-row items-center mb-2">
                             {/* Avatar */}
                            <Image 
                                source={{ uri: review.author?.imageUrl || "https://via.placeholder.com/50" }} 
                                className="w-8 h-8 rounded-full mr-3"
                            />
                            <View>
                                <Text className="font-bold text-slate-900">{review.author?.name || "User"}</Text>
                                <View className="flex-row">
                                    {[...Array(5)].map((_, i) => (
                                        <Ionicons 
                                            key={i} 
                                            name="star" 
                                            size={12} 
                                            color={i < review.rating ? "#FBBF24" : "#E2E8F0"} 
                                        />
                                    ))}
                                </View>
                            </View>
                            <Text className="ml-auto text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                        <Text className="text-slate-600 leading-5 mt-1">{review.content}</Text>
                    </View>
                ))
            )}
        </View>

      </ScrollView>
    </View>
  );
}