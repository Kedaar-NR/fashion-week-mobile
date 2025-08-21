import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
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

interface FriendProfile {
  id: string;
  display_name: string;
  created_at: string;
}

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function FriendProfileScreen() {
  const { friend } = useLocalSearchParams<{ friend: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [friendProfile, setFriendProfile] = useState<FriendProfile | null>(
    null
  );
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

  const fetchFriendProfile = async () => {
    if (!friend) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, created_at")
        .eq("user_id", friend)
        .single();

      if (error) {
        console.log("Error fetching friend profile:", error);
        return;
      }

      setFriendProfile({
        id: data.user_id,
        display_name: data.display_name,
        created_at: data.created_at,
      });
    } catch (error) {
      console.log("Error fetching friend profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPinnedCollections = async () => {
    if (!friend) return;

    setLoadingCollections(true);
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", friend)
        .eq("is_pinned", true);

      if (error) {
        console.log("Error fetching collections:", error);
        setStyleCollections([]);
      } else {
        setStyleCollections(data || []);
      }
    } catch (error) {
      console.log("Error fetching collections:", error);
      setStyleCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchSavedBrandsCount = async () => {
    if (!friend) return;

    setLoadingSavedBrands(true);
    try {
      const { count, error } = await supabase
        .from("saved_brands")
        .select("*", { count: "exact", head: true })
        .eq("user_id", friend);

      if (error) {
        console.log("Error fetching saved brands count:", error);
        setSavedBrandsCount(0);
      } else {
        setSavedBrandsCount(count || 0);
      }
    } catch (error) {
      console.log("Error fetching saved brands count:", error);
      setSavedBrandsCount(0);
    } finally {
      setLoadingSavedBrands(false);
    }
  };

  const fetchFriendsCount = async () => {
    if (!friend) return;

    setLoadingFriendsCount(true);
    try {
      const { count, error } = await supabase
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`requester_id.eq.${friend},addressee_id.eq.${friend}`);

      if (error) {
        console.log("Error fetching friends count:", error);
        setFriendsCount(0);
      } else {
        setFriendsCount(count || 0);
      }
    } catch (error) {
      console.log("Error fetching friends count:", error);
      setFriendsCount(0);
    } finally {
      setLoadingFriendsCount(false);
    }
  };

  const fetchRecentlyPurchased = async () => {
    if (!friend) return;

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
        .eq("user_id", friend)
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
      console.log("Error fetching purchased items:", error);
      setRecentlyPurchased([]);
    } finally {
      setLoadingPurchased(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (friend) {
        fetchFriendProfile();
        fetchPinnedCollections();
        fetchRecentlyPurchased();
        fetchSavedBrandsCount();
        fetchFriendsCount();
      }
    }, [friend])
  );

  const renderStyleItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      className="items-center"
      style={{ width: gridItemWidth }}
      onPress={() => {
        // Handle collection selection - could navigate to collection view
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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  if (!friendProfile) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-600">Friend not found</Text>
        <TouchableOpacity
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
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
            {friendProfile.display_name}
          </Text>

          {/* Follower Counts */}
          <View className="flex-row mb-6">
            {/* Brands Archived */}
            <View className="items-center mr-10">
              <Text className="text-lg font-bold text-gray-800">
                {loadingSavedBrands ? "..." : savedBrandsCount}
              </Text>
              <Text className="text-sm text-gray-600">Archived</Text>
            </View>

            {/* Friends */}
            <View className="items-center">
              <Text className="text-lg font-bold text-gray-800">
                {loadingFriendsCount ? "..." : friendsCount}
              </Text>
              <Text className="text-sm text-gray-600">Friends</Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View className="pb-8 px-4 w-full">
          {/* Style Section */}
          <View className="mb-0">
            <View className="flex-row items-center gap-4 mb-4 w-full">
              <Text className="text-xl font-bold">STYLE</Text>
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
            <View className="flex-row items-center gap-4 mb-4 w-full">
              <Text className="text-xl font-bold">RECENTLY PURCHASED</Text>
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
    </View>
  );
}
