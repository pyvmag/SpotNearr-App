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
import FeedCard from "@/components/feed/FeedCard";
import { useUserProfile } from "@/hooks/useUserProfile";

const PAGE_SIZE = 20;

export default function FeedScreen() {
  const user = useUserProfile();
  const userId = user?._id;

  const [items, setItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState<number>(Date.now());
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true); // is there more data to load?

  const feedPage = useQuery(
    api.content.getFeed.getFeed,
    userId ? { userId, limit: PAGE_SIZE, cursor } : "skip"
  );

  const markSeen = useMutation(api.content.helpers.markSeen);
  const seenRef = useRef<Set<string>>(new Set());
  const appState = useRef(AppState.currentState);

  // 🔹 Append new page & handle hasMore
  useEffect(() => {
    if (!feedPage) return;

    // merge new items
    setItems((prev) => {
      const existingIds = new Set(prev.map((p) => p._id));
      const merged = [...prev];

      for (const item of feedPage) {
        if (!existingIds.has(item._id)) {
          merged.push(item);
        }
      }

      return merged;
    });

    // stop bottom loader
    if (loadingMore) setLoadingMore(false);

    // if we received less than PAGE_SIZE → no more items
    if (feedPage.length < PAGE_SIZE) {
      setHasMore(false);
    }
  }, [feedPage]);

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

  // 💾 Flush seen
  const flushSeen = async () => {
    if (!userId || seenRef.current.size === 0) return;

    const ids = Array.from(seenRef.current);
    seenRef.current.clear();

    await markSeen({ userId, contentIds: ids });
  };

  // 🔁 Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await flushSeen();
    setItems([]);
    setCursor(Date.now());
    setHasMore(true);
    setRefreshing(false);
  };

  // 🔽 Load more (older posts)
  const loadMore = () => {
    if (!hasMore || loadingMore || items.length === 0) return;

    const last = items[items.length - 1];
    setLoadingMore(true); // show bottom loader
    setCursor(last.createdAt); // triggers next page fetch
  };

  // 🛑 App background
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

  if (!user || feedPage === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-gray-50">
        <Text className="text-lg font-bold text-slate-700">
          No posts yet
        </Text>
        <Text className="text-slate-500 mt-2 text-center">
          Follow businesses to see posts and offers.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <FeedCard content={item} business={item.business} />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5} // load slightly before last item
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
      />
    </View>
  );
}
