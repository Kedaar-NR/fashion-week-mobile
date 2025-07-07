import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { useLocalSearchParams } from "expo-router";
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

interface FashionPiece {
  id: string;
  name: string;
  type: string;
  designer: string;
  image: string;
  price: string;
  color: string;
}

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function CollectionDetailScreen() {
  const { collection } = useLocalSearchParams<{ collection: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [pieces, setPieces] = useState<FashionPiece[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchCollectionPieces = async () => {
    if (!session || !collection) return;

    setLoading(true);

    // First, get the collection ID from the collection name
    const { data: collectionData, error: collectionError } = await supabase
      .from("collections")
      .select("id")
      .eq("collection_name", collection)
      .eq("user_id", session.user.id)
      .single();

    if (collectionError || !collectionData) {
      console.log("Error fetching collection:", collectionError);
      setPieces([]);
      setLoading(false);
      return;
    }

    // Then fetch pieces in this collection
    const { data, error } = await supabase
      .from("collection_pieces")
      .select(
        `
        *,
        product!collection_pieces_product_id_fkey (
          *,
          brand:product-metadata_brand_id_fkey (
            id,
            brand_name
          )
        )
      `
      )
      .eq("collection_id", collectionData.id);

    if (error) {
      console.log("Error fetching collection pieces:", error);
      setPieces([]);
    } else {
      // Transform the data to match the FashionPiece interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        name: item.product?.product_name || "Unknown Product",
        type: item.product?.type || "Unknown Type",
        designer: item.product?.brand?.brand_name || "Unknown Brand",
        image: item.product?.media_filepath || "placeholder",
        price: `$${item.product?.price || 0}`,
        color: item.product?.color || "Unknown Color",
      }));
      setPieces(transformedData);
    }
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log(`📍 Current path: /(tabs)/(collections)/[collection]`);
      console.log(`📍 Collection parameter: ${collection}`);
      if (session) {
        fetchCollectionPieces();
      }
    }, [session, collection])
  );

  // If the collection parameter is "all-liked", show "ALL LIKED", otherwise show the collection name
  const displayText =
    collection === "all-liked" ? "ALL LIKED" : collection?.toUpperCase();

  const renderGridItem = ({ item }: { item: FashionPiece }) => (
    <TouchableOpacity
      className="items-center"
      style={{ width: gridItemWidth }}
      onPress={() => {
        // Handle piece selection - can be expanded later
        console.log("Selected piece:", item.name);
      }}
    >
      <View
        className="bg-gray-200 rounded-xl justify-center items-center mb-2"
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
      {/* Header Section */}
      <View className="flex-row items-center gap-4 mb-4">
        <TouchableOpacity onPress={() => {}}>
          <Text className="text-sm font-bold">FILTER+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}}>
          <Text className="text-sm font-bold">SORT BY+</Text>
        </TouchableOpacity>
      </View>

      {/* Pieces Grid Section */}
      <View className="flex-1">
        {loading ? (
          <Text className="text-center py-8">Loading collection pieces...</Text>
        ) : pieces.length === 0 ? (
          <Text className="text-center py-8">
            No pieces found in this collection
          </Text>
        ) : (
          <FlatList
            data={pieces}
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
