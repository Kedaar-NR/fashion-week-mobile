import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
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
  likedAt: Date;
}

interface Collection {
  id: string;
  collection_name: string;
  description: string;
  itemCount: number;
  image: string;
}

const mockFashionPieces: FashionPiece[] = [
  {
    id: "1",
    name: "Aviator Sunglasses",
    type: "Accessories",
    designer: "Ray-Ban",
    image: "placeholder",
    likedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
  {
    id: "2",
    name: "Denim Jacket",
    type: "Outerwear",
    designer: "Levi's",
    image: "placeholder",
    likedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: "3",
    name: "White Sneakers",
    type: "Footwear",
    designer: "Nike",
    image: "placeholder",
    likedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
  },
  {
    id: "4",
    name: "Silk Scarf",
    type: "Accessories",
    designer: "Hermès",
    image: "placeholder",
    likedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: "5",
    name: "Leather Bag",
    type: "Accessories",
    designer: "Coach",
    image: "placeholder",
    likedAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
  },
];

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function CollectionScreen() {
  const [fashionPieces] = useState<FashionPiece[]>(mockFashionPieces);
  const [session, setSession] = useState<Session | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
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

  useFocusEffect(React.useCallback(() => {
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
        }
        setLoading(false);
      });
  }, [session]));

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/(collections)/collection");
    }, [])
  );

  // Get the 3 most recently liked pieces
  const recentlyLiked = fashionPieces
    .sort((a, b) => b.likedAt.getTime() - a.likedAt.getTime())
    .slice(0, 3);

  const renderRecentlyLikedItem = ({ item }: { item: FashionPiece }) => (
    <View className="items-center" style={{ width: gridItemWidth }}>
      <View
        className="bg-gray-200 rounded-xl justify-center items-center mb-2"
        style={{ width: gridItemWidth, height: gridItemWidth }}
      >
        <Text className="text-xs opacity-50">Image</Text>
      </View>
      <Text className="text-xs font-medium text-center" numberOfLines={1}>
        {item.name}
      </Text>
    </View>
  );

  const renderGridItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      className="items-center"
      style={{ width: gridItemWidth }}
      onPress={() =>
        router.push({
          pathname: "/(tabs)/(collections)/[collection]",
          params: { collection: item.collection_name },
        })
      }
    >
      <View
        className="bg-gray-200 rounded-xl justify-center items-center mb-2"
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
      {/* Recently Liked Section */}
      <View className="mb-8">
        <View className="flex-row items-center gap-4 mb-4">
          <Text className="text-xl font-bold">LIKED</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(collections)/[collection]",
                params: { collection: "all-liked" },
              })
            }
          >
            <Text className="text-sm font-bold">SEE MORE ›</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recentlyLiked}
          keyExtractor={(item) => item.id}
          renderItem={renderRecentlyLikedItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingRight: 16 }}
        />
      </View>

      {/* Collections Grid Section */}
      <View className="flex-1">
        <View className="flex-row items-center gap-4 mb-4">
          <Text className="text-xl font-bold">COLLECTIONS</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text className="text-sm font-bold">CREATE+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}}>
            <Text className="text-sm font-bold">SORT BY+</Text>
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
