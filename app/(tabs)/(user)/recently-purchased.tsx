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

interface PurchasedItem {
  id: string;
  name: string;
  type: string;
  designer: string;
  image: string;
  price: string;
  color: string;
  purchase_date: string;
  is_showing: boolean;
}

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function RecentlyPurchasedScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
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

    const fetchPurchasedItems = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("purchased_pieces")
          .select(
            `
            id,
            created_at,
            is_showing,
            product!purchased_pieces_product_id_fkey (
              id,
              product_name,
              product_desc,
              media_filepath,
              price,
              type,
              color,
              brand:brand_id (
                id,
                brand_name,
                brand_tagline
              )
            )
          `
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.log("Error fetching purchased items:", error);
          setPurchasedItems([]);
        } else {
          // Transform the data to match our interface
          const transformedData: PurchasedItem[] = (data || []).map(
            (item: any) => ({
              id: item.id.toString(),
              name: item.product?.product_name || "Unknown Product",
              type: item.product?.type || "Unknown Type",
              designer: item.product?.brand?.brand_name || "Unknown Brand",
              image: item.product?.media_filepath || "placeholder",
              price: `$${item.product?.price || 0}`,
              color: item.product?.color || "Unknown Color",
              purchase_date: new Date(item.created_at).toLocaleDateString(),
              is_showing: item.is_showing,
            })
          );
          setPurchasedItems(transformedData);

          // Initialize local showing state
          const initialShowingState: Record<string, boolean> = {};
          transformedData.forEach((item) => {
            initialShowingState[item.id] = item.is_showing;
          });
          setLocalShowingState(initialShowingState);
        }
      } catch (error) {
        console.log("Unexpected error fetching purchased items:", error);
        setPurchasedItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedItems();
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
    purchasedItems.forEach((item) => {
      newShowingState[item.id] = false;
    });
    setLocalShowingState(newShowingState);
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!session || !hasChanges) return;

    setLoading(true);
    try {
      // Update all purchased items with their new showing status
      const updatePromises = purchasedItems.map((item) =>
        supabase
          .from("purchased_pieces")
          .update({ is_showing: localShowingState[item.id] })
          .eq("id", item.id)
          .eq("user_id", session.user.id)
      );

      await Promise.all(updatePromises);

      // Update local purchased items data
      setPurchasedItems((prev) =>
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

  const renderGridItem = ({ item }: { item: PurchasedItem }) => (
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
      <View className="flex-row justify-between items-start w-full">
        <View className="flex-1 mr-2">
          <Text className="text-xs font-medium" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-xs text-gray-600" numberOfLines={1}>
            {item.designer}
          </Text>
        </View>
        <Text className="text-xs font-bold" numberOfLines={1}>
          {item.price}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 px-4">
      {/* Header */}
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

      {/* Purchased Items Grid Section */}
      <View className="flex-1">
        {loading ? (
          <Text className="text-center py-8">Loading purchased items...</Text>
        ) : purchasedItems.length === 0 ? (
          <Text className="text-center py-8">No purchased items found</Text>
        ) : (
          <FlatList
            data={purchasedItems}
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