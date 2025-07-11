import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Auth from "../../../components/Auth";
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

interface Collection {
  id: string;
  collection_name: string;
  description: string;
  item_count: number;
  collection_image: string | null;
  is_pinned: boolean;
  user_id: string;
  created_at: string;
}

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function UserScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [styleCollections, setStyleCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [recentlyPurchased, setRecentlyPurchased] = useState<FashionPiece[]>(
    []
  );
  const [loadingPurchased, setLoadingPurchased] = useState(true);
  const [savedBrandsCount, setSavedBrandsCount] = useState(0);
  const [loadingSavedBrands, setLoadingSavedBrands] = useState(true);
  const [friendsCount, setFriendsCount] = useState(0);
  const [loadingFriendsCount, setLoadingFriendsCount] = useState(true);

  const fetchPinnedCollections = async () => {
    if (!session) return;

    setLoadingCollections(true);
    supabase
      .from("collections")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_pinned", true)
      .then(({ data, error }) => {
        if (error) {
          setStyleCollections([]);
        } else {
          setStyleCollections(data || []);
        }
        setLoadingCollections(false);
      });
  };

  const fetchSavedBrandsCount = async () => {
    if (!session) return;

    setLoadingSavedBrands(true);
    try {
      const { count, error } = await supabase
        .from("saved_brands")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if (error) {
        console.log("Error fetching saved brands count:", error);
        setSavedBrandsCount(0);
      } else {
        setSavedBrandsCount(count || 0);
      }
    } catch (error) {
      console.log("Unexpected error fetching saved brands count:", error);
      setSavedBrandsCount(0);
    } finally {
      setLoadingSavedBrands(false);
    }
  };

  const fetchFriendsCount = async () => {
    if (!session) return;

    setLoadingFriendsCount(true);
    try {
      const { count, error } = await supabase
        .from("user_friends")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if (error) {
        console.log("Error fetching friends count:", error);
        setFriendsCount(0);
      } else {
        setFriendsCount(count || 0);
      }
    } catch (error) {
      console.log("Unexpected error fetching friends count:", error);
      setFriendsCount(0);
    } finally {
      setLoadingFriendsCount(false);
    }
  };

  const fetchRecentlyPurchased = async () => {
    if (!session) return;

    setLoadingPurchased(true);
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
        .eq("is_showing", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Error fetching purchased items:", error);
        setRecentlyPurchased([]);
      } else {
        // Transform the data to match our interface
        const transformedData: FashionPiece[] = (data || []).map(
          (item: any) => ({
            id: item.id.toString(),
            name: item.product?.product_name || "Unknown Product",
            type: item.product?.type || "Unknown Type",
            designer: item.product?.brand?.brand_name || "Unknown Brand",
            image: item.product?.media_filepath || "placeholder",
            price: `$${item.product?.price || 0}`,
            color: item.product?.color || "Unknown Color",
          })
        );
        setRecentlyPurchased(transformedData);
      }
    } catch (error) {
      console.log("Unexpected error fetching purchased items:", error);
      setRecentlyPurchased([]);
    } finally {
      setLoadingPurchased(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/user");
      if (session) {
        fetchPinnedCollections();
        fetchRecentlyPurchased();
        fetchSavedBrandsCount();
        fetchFriendsCount();
      }
    }, [session])
  );

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

  if (!session) {
    return <Auth />;
  }

  const renderStyleItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      className="items-center"
      style={{ width: gridItemWidth }}
      onPress={() => {
        // Handle collection selection
        router.push({
          pathname: "/(tabs)/(collections)/[collection]",
          params: { collection: item.collection_name },
        });
        console.log("Select collection:", item.collection_name);
      }}
    >
      <View
        className="bg-gray-200 rounded-xl justify-center items-center mb-2 overflow-hidden"
        style={{ width: gridItemWidth, height: gridItemWidth }}
      >
        {item.collection_image ? (
          <Image
            source={{ uri: item.collection_image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-xs opacity-50">No Image</Text>
        )}
      </View>
      <Text className="text-xs font-medium text-left" numberOfLines={1}>
        {item.collection_name}
      </Text>
    </TouchableOpacity>
  );

  const renderRecentlyPurchasedItem = ({ item }: { item: FashionPiece }) => (
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

  // Function to handle pinning/unpinning collections
  const togglePinCollection = async (
    collectionId: string,
    isPinned: boolean
  ) => {
    if (!session) return;

    try {
      // Update in Supabase
      const { error } = await supabase
        .from("collections")
        .update({ is_pinned: !isPinned })
        .eq("id", collectionId)
        .eq("user_id", session.user.id);

      if (error) {
        console.log("Error updating pin status:", error);
        return;
      }

      // Update local state and cache
      if (isPinned) {
        // Remove from pinned collections
        const updatedCollections = styleCollections.filter(
          (c) => c.id !== collectionId
        );
        setStyleCollections(updatedCollections);
      } else {
        // Add to pinned collections (you might need to fetch the collection data first)
        fetchPinnedCollections(); // Refresh the list
      }
    } catch (error) {
      console.log("Error toggling pin:", error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center">
      <ScrollView className="flex-1 bg-transparent">
        {/* Profile Section */}
        <View className="items-center pt-6 pb-0">
          {/* Profile Picture */}
          <Image
            source={{
              uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZ7c0IdRTbJOYyf78cFdrPoUwF1CjQ8GIquQ&s",
            }}
            className="w-24 h-24 rounded-full mb-3"
            resizeMode="cover"
          />

          {/* Name */}
          <Text className="text-xl font-bold text-gray-800 mb-2">
            {session.user.user_metadata.display_name}
          </Text>

          {/* Follower Counts */}
          <View className="flex-row mb-6">
            {/* Brands Archived */}
            <TouchableOpacity
              className="items-center mr-10"
              onPress={() => router.push("/(tabs)/(user)/archive")}
            >
              <Text className="text-lg font-bold text-gray-800">
                {loadingSavedBrands ? "..." : savedBrandsCount}
              </Text>
              <Text className="text-sm text-gray-600">Archived</Text>
            </TouchableOpacity>

            {/* Friends */}
            <TouchableOpacity
              className="items-center"
              onPress={() => router.push("/(tabs)/(user)/friends")}
            >
              <Text className="text-lg font-bold text-gray-800">
                {loadingFriendsCount ? "..." : friendsCount}
              </Text>
              <Text className="text-sm text-gray-600">Friends</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        {/* <View className="pb-4 px-6">
          Style Quiz Button
          <TouchableOpacity
            className="bg-gray-800 px-6 py-3 rounded-lg w-full mb-4"
            onPress={() => router.push("/(tabs)/style-quiz")}
          >
            <Text className="text-white text-center font-semibold">
              Style Quiz
            </Text>
          </TouchableOpacity>
        </View> */}

        {/* Content Section */}
        <View className="pb-8 px-4">
          {/* My Style Section */}
          <View className="mb-0">
            <View className="flex-row items-center gap-4 mb-4">
              <Text className="text-xl font-bold">MY STYLE</Text>
              <TouchableOpacity
                onPress={() => {
                  router.push("/(tabs)/(user)/pinnedCollections");
                }}
              >
                <Text className="text-sm font-bold">PIN COLLECTION+</Text>
              </TouchableOpacity>
            </View>
            {loadingCollections ? (
              <Text>Loading collections...</Text>
            ) : (
              <View>
                {Array.from(
                  { length: Math.ceil(styleCollections.length / 3) },
                  (_, rowIndex) => (
                    <View
                      key={rowIndex}
                      style={{ flexDirection: "row", marginBottom: 16 }}
                    >
                      {[0, 1, 2].map((colIndex) => {
                        const itemIndex = rowIndex * 3 + colIndex;
                        const item = styleCollections[itemIndex];

                        return (
                          <View
                            key={colIndex}
                            style={{
                              width: gridItemWidth,
                              marginRight: colIndex < 2 ? 16 : 0,
                            }}
                          >
                            {item ? renderStyleItem({ item }) : null}
                          </View>
                        );
                      })}
                    </View>
                  )
                )}
              </View>
            )}
          </View>

          {/* Recently Purchased Section */}
          <View className="pb-16">
            <View className="flex-row items-center gap-4 mb-4">
              <Text className="text-xl font-bold">RECENTLY PURCHASED</Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/(user)/recently-purchased")}
              >
                <Text className="text-sm font-bold">(HIDE)</Text>
              </TouchableOpacity>
            </View>
            {loadingPurchased ? (
              <Text>Loading purchased items...</Text>
            ) : recentlyPurchased.length === 0 ? (
              <Text className="text-center py-8 text-gray-500">
                No purchased items to show
              </Text>
            ) : (
              <View>
                {Array.from(
                  { length: Math.ceil(recentlyPurchased.length / 3) },
                  (_, rowIndex) => (
                    <View
                      key={rowIndex}
                      style={{ flexDirection: "row", marginBottom: 16 }}
                    >
                      {[0, 1, 2].map((colIndex) => {
                        const itemIndex = rowIndex * 3 + colIndex;
                        const item = recentlyPurchased[itemIndex];

                        return (
                          <View
                            key={colIndex}
                            style={{
                              width: gridItemWidth,
                              marginRight: colIndex < 2 ? 16 : 0,
                            }}
                          >
                            {item
                              ? renderRecentlyPurchasedItem({ item })
                              : null}
                          </View>
                        );
                      })}
                    </View>
                  )
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      {/* <Button title="Sign Out" onPress={() => supabase.auth.signOut()} /> */}
    </View>
  );
}
