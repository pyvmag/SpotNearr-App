import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function ReviewScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const router = useRouter();
  
  // State for Input
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 1. UPDATED: Using usePaginatedQuery to match the backend validator
  const { results, status, loadMore } = usePaginatedQuery(
    api.review.getReviews,
    { businessId: businessId as Id<"businesses"> },
    { initialNumItems: 10 }
  );

  const submitReview = useMutation(api.review.submitReview);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await submitReview({
        businessId: businessId as Id<"businesses">,
        rating,
        content: reviewText
      });
      setReviewText("");
      setRating(0);
    } catch (e) {
      alert("Failed to post review");
    } finally {
      setSubmitting(false);
    }
  };

  // Render Header & Input as a ListHeaderComponent so it scrolls with the reviews
  const HeaderComponent = () => (
    <View>
      <View className="p-6 bg-slate-50 border-b border-gray-100">
        <Text className="text-gray-500 font-medium mb-3">How was your experience?</Text>
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

        <TextInput
          placeholder="Write a review..."
          multiline
          value={reviewText}
          onChangeText={setReviewText}
          className="bg-white p-4 rounded-xl border border-gray-200 min-h-[100px] text-base"
          textAlignVertical="top"
        />

        {rating > 0 && (
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-emerald-500 mt-4 py-3 rounded-xl items-center"
          >
            {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Post Review</Text>}
          </TouchableOpacity>
        )}
      </View>
      <View className="px-6 pt-6">
        <Text className="font-bold text-lg mb-4 text-slate-800">Community Reviews</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Fixed Header */}
      <View className="px-6 pt-14 pb-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold">Reviews</Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={HeaderComponent}
        onEndReached={() => status === "CanLoadMore" && loadMore(10)}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <View className="px-6 mb-6 border-b border-gray-100 pb-6">
            <View className="flex-row items-center mb-2">
              <Image 
                source={{ uri: item.author?.imageUrl || "https://via.placeholder.com/50" }} 
                className="w-8 h-8 rounded-full mr-3"
              />
              <View>
                <Text className="font-bold text-slate-900">{item.author?.name || "User"}</Text>
                <View className="flex-row">
                  {[...Array(5)].map((_, i) => (
                    <Ionicons key={i} name="star" size={12} color={i < item.rating ? "#FBBF24" : "#E2E8F0"} />
                  ))}
                </View>
              </View>
              <Text className="ml-auto text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text className="text-slate-600 leading-5 mt-1">{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="px-6 py-10 items-center">
            {status === "LoadingFirstPage" ? (
              <ActivityIndicator color="#10B981" />
            ) : (
              <Text className="text-gray-400 italic">Be the first to review!</Text>
            )}
          </View>
        )}
        ListFooterComponent={() => (
          status === "LoadingMore" ? <ActivityIndicator className="py-4" color="#10B981" /> : <View className="h-10" />
        )}
      />
    </View>
  );
}