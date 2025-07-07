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

interface RecentlyPurchasedItem {
  id: string;
  name: string;
  type: string;
  designer: string;
  image: string;
  price: string;
  color: string;
  is_showing: boolean;
}

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function RecentlyPurchasedScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [recentlyPurchasedItems, setRecentlyPurchasedItems] = useState<
    RecentlyPurchasedItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [localShowingState, setLocalShowingState] = useState<
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
      .from("recently_purchased")
      .select("*")
      .eq("user_id", session.user.id)
      .then(({ data, error }) => {
        if (error) {
          console.log("Error fetching recently purchased items:", error);
          setRecentlyPurchasedItems([]);
        } else {
          setRecentlyPurchasedItems(data || []);
          const initialShowingState: Record<string, boolean> = {};
          (data || []).forEach((item) => {
            initialShowingState[item.id] = item.is_showing;
          });
          setLocalShowingState(initialShowingState);
        }
        setLoading(false);
      });
  }, [session]);

  const toggleShowing = (itemId: string) => {
    setLocalShowingState((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
    setHasChanges(true);
  };

  const hideAll = () => {
    const newShowingState: Record<string, boolean> = {};
    recentlyPurchasedItems.forEach((item) => {
      newShowingState[item.id] = false;
    });
    setLocalShowingState(newShowingState);
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!session || !hasChanges) return;

    setLoading(true);
    try {
      // Update all recently purchased items with their new showing status
      const updatePromises = recentlyPurchasedItems.map((item) =>
        supabase
          .from("recently_purchased")
          .update({ is_showing: localShowingState[item.id] })
          .eq("id", item.id)
          .eq("user_id", session.user.id)
      );

      await Promise.all(updatePromises);

      // Update local recently purchased items data
      setRecentlyPurchasedItems((prev) =>
        prev.map((item) => ({
          ...item,
          is_showing: localShowingState[item.id],
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
      console.log("📍 Current path: /(tabs)/(user)/recently-purchased");
    }, [])
  );

  const renderGridItem = ({ item }: { item: RecentlyPurchasedItem }) => (
    <TouchableOpacity
      className="items-center"
      style={{ width: gridItemWidth }}
      onPress={() => toggleShowing(item.id)}
    >
      <View
        className={`rounded-xl justify-center items-center mb-2 ${
          localShowingState[item.id]
            ? "bg-blue-100 border-2 border-blue-400"
            : "bg-gray-200"
        }`}
        style={{ width: gridItemWidth, height: gridItemWidth }}
      >
        <Text className="text-xs opacity-50">Image</Text>
      </View>
      <Text className="text-xs font-medium text-left" numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 px-4">
      {/* Recently Purchased Items Grid Section */}
      <View className="flex-1">
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity onPress={hideAll}>
            <Text className="text-sm font-bold">HIDE ALL</Text>
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
          <Text className="text-center py-8">
            Loading recently purchased items...
          </Text>
        ) : recentlyPurchasedItems.length === 0 ? (
          <Text className="text-center py-8">
            No recently purchased items found
          </Text>
        ) : (
          <FlatList
            data={recentlyPurchasedItems}
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
