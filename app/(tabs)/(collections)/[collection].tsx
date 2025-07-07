import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

interface CollectionPiece {
  id: number;
  product_id: number;
  product_name: string;
  product_desc: string;
  media_filepath: string;
  price: number;
  type: string;
  color: string;
  brand_name: string;
  brand_tagline: string;
}

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function CollectionDetailScreen() {
  const { collection } = useLocalSearchParams<{ collection: string }>();
  const [pieces, setPieces] = useState<CollectionPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollectionPieces = async () => {
    if (!collection || collection === "all-liked") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, get the collection ID from the collection name
      const { data: collectionData, error: collectionError } = await supabase
        .from("collections")
        .select("id")
        .eq("collection_name", collection)
        .single();

      if (collectionError) {
        console.error("Error fetching collection:", collectionError);
        setError("Collection not found");
        setLoading(false);
        return;
      }

      if (!collectionData) {
        setError("Collection not found");
        setLoading(false);
        return;
      }

      // Fetch pieces for this collection by joining collection_pieces, product, and brand tables
      const { data: piecesData, error: piecesError } = await supabase
        .from("collection_pieces")
        .select(
          `
          id,
          product_id,
          product:product_id (
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
        .eq("collection_id", collectionData.id);

      if (piecesError) {
        console.error("Error fetching collection pieces:", piecesError);
        setError("Failed to load collection pieces");
        setLoading(false);
        return;
      }

      // Transform the data to match our interface
      const transformedPieces: CollectionPiece[] =
        piecesData?.map((piece: any) => ({
          id: piece.id,
          product_id: piece.product_id,
          product_name: piece.product?.product_name || "",
          product_desc: piece.product?.product_desc || "",
          media_filepath: piece.product?.media_filepath || "",
          price: piece.product?.price || 0,
          type: piece.product?.type || "",
          color: piece.product?.color || "",
          brand_name: piece.product?.brand?.brand_name || "",
          brand_tagline: piece.product?.brand?.brand_tagline || "",
        })) || [];

      setPieces(transformedPieces);
      console.log("Fetched pieces:", transformedPieces);
    } catch (err) {
      console.error("Error in fetchCollectionPieces:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionPieces();
  }, [collection]);

  useFocusEffect(
    React.useCallback(() => {
      console.log(`📍 Current path: /(tabs)/(collections)/[collection]`);
      console.log(`📍 Collection parameter: ${collection}`);
    }, [collection])
  );

  // If the collection parameter is "all-liked", show "ALL LIKED", otherwise show the collection name
  const displayText =
    collection === "all-liked" ? "ALL LIKED" : collection?.toUpperCase();

  const renderGridItem = ({ item }: { item: CollectionPiece }) => (
    <TouchableOpacity
      className="items-center"
      style={{ width: gridItemWidth }}
      onPress={() => {
        // Handle piece selection - can be expanded later
        console.log("Selected piece:", item.product_name);
      }}
    >
      <View
        className="bg-gray-200 rounded-xl justify-center items-center mb-2"
        style={{ width: gridItemWidth, height: gridItemWidth }}
      >
        {item.media_filepath ? (
          <Text className="text-xs opacity-50">Image</Text>
        ) : (
          <Text className="text-xs opacity-50">No Image</Text>
        )}
      </View>
      <View className="flex-row justify-between items-start w-full">
        <View className="flex-1 mr-2">
          <Text className="text-xs font-medium" numberOfLines={1}>
            {item.product_name}
          </Text>
          <Text className="text-xs text-gray-600" numberOfLines={1}>
            {item.brand_name}
          </Text>
        </View>
        <Text className="text-xs font-bold" numberOfLines={1}>
          ${item.price}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-600">Loading collection pieces...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 px-4 py-2 rounded-lg"
          onPress={fetchCollectionPieces}
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (collection === "all-liked") {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-gray-600 text-center">
          All Liked feature coming soon...
        </Text>
      </View>
    );
  }

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
        {pieces.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-gray-600 text-center">
              No pieces found in this collection
            </Text>
          </View>
        ) : (
          <FlatList
            data={pieces}
            keyExtractor={(item) => item.id.toString()}
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
