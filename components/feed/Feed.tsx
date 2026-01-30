import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  Text,
  RefreshControl,
  AppState,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import FeedCard from "@/components/feed/FeedCard";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserLocation } from "@/src/context/LocationContext";

// Simple geohash implementation (same as convex/geohash.ts)
const B32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function encodeGeohash(lat: number, lng: number, precision: number): string {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = "";
  let bit = 0, ch = 0, even = true;

  while (hash.length < precision) {
    if (even) {
      let mid = (minLng + maxLng) / 2;
      if (lng > mid) { ch |= 1 << (4 - bit); minLng = mid; }
      else maxLng = mid;
    } else {
      let mid = (minLat + maxLat) / 2;
      if (lat > mid) { ch |= 1 << (4 - bit); minLat = mid; }
      else maxLat = mid;
    }
    even = !even;
    if (bit < 4) bit++;
    else {
      hash += B32[ch];
      bit = 0; ch = 0;
    }
  }
  return hash;
}

const PAGE_SIZE = 20;

export default function FeedScreen() {
  const user = useUserProfile();
  const userId = user?._id;
  const insets = useSafeAreaInsets();
  const { location } = useUserLocation();

  const [items, setItems] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Generate geohash from location coordinates
  const geohash = location ? encodeGeohash(location.lat, location.lng, 6) : null;

  // Use the new getFeed API with geohash from location and pagination
  const feedData = useQuery(
    api.feed.getFeed,
    geohash && !refreshing && (loadingMore || nextCursor === null) ? { geohash, limit: PAGE_SIZE, cursor: nextCursor || undefined } : "skip"
  );

  const markAsSeen = useMutation(api.interactions.markAsSeen);
  const seenRef = useRef<Set<string>>(new Set());
  const appState = useRef(AppState.currentState);

  // 🔹 Update items when feed data changes
  useEffect(() => {
    if (!feedData) return;

    if (nextCursor === null || refreshing) {
      // Initial load or refresh - replace all items
      setItems(feedData.items || []);
    } else {
      // Load more - append new items
      setItems(prev => {
        const existingIds = new Set(prev.map(p => p._id));
        const newItems = (feedData.items || []).filter((item: any) => !existingIds.has(item._id));
        return [...prev, ...newItems];
      });
    }

    setHasMore(feedData.hasMore || false);
    setNextCursor(feedData.nextCursor);
    setLoadingMore(false);
    setInitialLoading(false);
  }, [feedData, nextCursor, refreshing]);

  // 👀 Track viewed items
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      viewableItems.forEach((v: any) => {
        if (v.isViewable) {
          seenRef.current.add(v.item._id);
        }
      });
    },
    []
  );

  // 💾 Flush seen items
  const flushSeen = async () => {
    if (!userId || seenRef.current.size === 0) return;

    const ids = Array.from(seenRef.current);
    seenRef.current.clear();

    await markAsSeen({ contentIds: ids as Id<"content">[] });
  };


  // 🔁 Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await flushSeen();
    setNextCursor(null); // Reset cursor for fresh load
    setItems([]);
    setHasMore(true);
    setInitialLoading(true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || items.length === 0) return;
    
    setLoadingMore(true);
  };

  // 🛑 App background handling
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next) => {
      if (
        appState.current === "active" &&
        (next === "background" || next === "inactive")
      ) {
        await flushSeen();
      }
      appState.current = next;
    });

    return () => sub.remove();
  }, [userId]);

  if (!user || (feedData === undefined && nextCursor === null && initialLoading)) {
    return (
      <View 
        className="flex-1 items-center justify-center bg-gray-50"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-4 text-slate-500 font-medium">Loading feed...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View 
        className="flex-1 items-center justify-center bg-gray-50"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-lg font-bold text-slate-700">
          Location Required
        </Text>
        <Text className="text-slate-500 mt-2 text-center px-6">
          Please enable location to see posts and offers from nearby businesses.
        </Text>
      </View>
    );
  }

  if (items.length === 0 && !loadingMore && !initialLoading) {
    return (
      <View 
        className="flex-1 items-center justify-center px-6 bg-gray-50"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-lg font-bold text-slate-700">
          No posts yet
        </Text>
        <Text className="text-slate-500 mt-2 text-center">
          Follow businesses to see posts and offers in your area.
        </Text>
      </View>
    );
  }

  return (
    <View 
      className="flex-1 bg-gray-50"
      style={{ paddingTop: insets.top }}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <FeedCard 
            content={item} 
            business={{
              name: item.businessName,
              logoUrl: item.businessIcon,
              isCelebrity: item.isCelebrity,
            }}
          />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListHeaderComponent={() => (
          <View className="px-4 py-3 bg-white border-b border-gray-100">
            <Text className="text-lg font-bold text-slate-900">Your Feed</Text>
            <Text className="text-sm text-slate-500">
              Posts from your favorite businesses and nearby spots
            </Text>
          </View>
        )}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#059669" />
              <Text className="text-slate-500 text-sm mt-2">Loading more...</Text>
            </View>
          ) : hasMore === false && items.length > 0 ? (
            <View className="py-8 items-center">
              <Text className="text-slate-400 text-sm">You've seen it all!</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
