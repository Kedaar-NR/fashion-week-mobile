import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

interface Collection {
  id: string;
  collection_name: string;
  description: string;
  itemCount: number;
  is_pinned: boolean;
  image: string;
}

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function PinnedCollectionsScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [localPinnedState, setLocalPinnedState] = useState<
    Record<string, boolean>
  >({});
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    setLoading(true);
    supabase
      .from("collections")
      .select("*")
      .eq("user_id", session.user.id)
      .then(({ data, error }) => {
        if (error) {
          console.log("Error fetching collections:", error);
          setCollections([]);
        } else {
          setCollections(data || []);
          const initialPinnedState: Record<string, boolean> = {};
          (data || []).forEach((collection) => {
            initialPinnedState[collection.id] = collection.is_pinned;
          });
          setLocalPinnedState(initialPinnedState);
        }
        setLoading(false);
      });
  }, [session]);

  const togglePinned = (collectionId: string) => {
    setLocalPinnedState((prev) => ({
      ...prev,
      [collectionId]: !prev[collectionId],
    }));
    setHasChanges(true);
  };

  const unpinAll = () => {
    const newPinnedState: Record<string, boolean> = {};
    collections.forEach((collection) => {
      newPinnedState[collection.id] = false;
    });
    setLocalPinnedState(newPinnedState);
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!session || !hasChanges) return;

    setLoading(true);
    try {
      // Update all collections with their new pinned status
      const updatePromises = collections.map((collection) =>
        supabase
          .from("collections")
          .update({ is_pinned: localPinnedState[collection.id] })
          .eq("id", collection.id)
          .eq("user_id", session.user.id)
      );

      await Promise.all(updatePromises);

      // Update local collections data
      setCollections((prev) =>
        prev.map((collection) => ({
          ...collection,
          is_pinned: localPinnedState[collection.id],
        }))
      );

      setHasChanges(false);
      console.log("Changes saved successfully");
      // Navigate back to user.tsx after successful save
      router.back();
    } catch (error) {
      console.log("Error saving changes:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/(user)/pinnedCollections");
    }, [])
  );

  const renderGridItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      className="items-center"
      style={{ width: gridItemWidth }}
      onPress={() => togglePinned(item.id)}
    >
      <View
        className={`rounded-xl justify-center items-center mb-2 ${
          localPinnedState[item.id]
            ? "bg-blue-100 border-2 border-blue-400"
            : "bg-gray-200"
        }`}
        style={{ width: gridItemWidth, height: gridItemWidth }}
      >
        <Text className="text-xs opacity-50">Image</Text>
      </View>
      <Text className="text-xs font-medium text-left" numberOfLines={1}>
        {item.collection_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 px-4">
      {/* Collections Grid Section */}
      <View className="flex-1">
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity onPress={unpinAll}>
            <Text className="text-sm font-bold">UNPIN ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={saveChanges}
            disabled={!hasChanges || loading}
          >
            <Text
              className={`text-sm font-bold ${!hasChanges || loading ? "opacity-50" : ""}`}
            >
              SAVE CHANGES
            </Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <Text className="text-center py-8">Loading collections...</Text>
        ) : collections.length === 0 ? (
          <Text className="text-center py-8">No collections found</Text>
        ) : (
          <FlatList
            data={collections}
            keyExtractor={(item) => item.id}
            renderItem={renderGridItem}
            numColumns={3}
            columnWrapperStyle={{
              gap: 16,
              marginBottom: 16,
            }}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </ScrollView>
  );
}