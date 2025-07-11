import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";
``;
interface ArchiveItem {
  id: string;
  brandName: string;
  tagline: string;
  profileImage: string;
  brandId: string;
}

const ArchiveItem = ({
  item,
  onToggle,
  isUnfilled,
}: {
  item: ArchiveItem;
  onToggle: (itemId: string) => void;
  isUnfilled: boolean;
}) => (
  <TouchableOpacity
    className="flex-row items-center mb-3 ml-4 mr-4"
    onPress={() => {
      // Navigate to brand detail page
      router.push({
        pathname: "/(tabs)/[brand]",
        params: { brand: item.brandName },
      });
    }}
  >
    <View className="w-16 h-16 rounded-xl bg-gray-300 mr-4"></View>
    <View className="flex-1">
      <Text className="text-lg font-semibold mb-1">
        {item.brandName.toUpperCase()}
      </Text>
      <Text className="text-sm text-gray-600">{item.tagline}</Text>
    </View>

    {/* Bookmark icon - filled by default, can be toggled to unfilled */}
    <TouchableOpacity
      onPress={(e) => {
        e.stopPropagation();
        onToggle(item.id);
      }}
      className="ml-2 p-2"
    >
      <Ionicons
        name={isUnfilled ? "bookmark-outline" : "bookmark"}
        size={20}
        color="#000000"
      />
    </TouchableOpacity>
  </TouchableOpacity>
);

export default function ArchiveScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [savedBrands, setSavedBrands] = useState<ArchiveItem[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [unfilledBookmarks, setUnfilledBookmarks] = useState<Set<string>>(
    new Set()
  );

  const fetchSavedBrands = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_brands")
        .select(
          `
          id,
          created_at,
          brand_id,
          brand:brand_id (
            id,
            brand_name,
            brand_tagline
          )
        `
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Error fetching saved brands:", error);
        setSavedBrands([]);
      } else {
        // Transform the data to match our interface
        const transformedData: ArchiveItem[] = (data || []).map(
          (item: any) => ({
            id: item.id.toString(),
            brandId: item.brand_id,
            brandName: item.brand?.brand_name || "Unknown Brand",
            tagline: item.brand?.brand_tagline || "No tagline available",
            profileImage: `https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/profile-pics/${item.brand?.brand_name}.jpg`,
          })
        );
        setSavedBrands(transformedData);
        setFilteredBrands(transformedData);
      }
    } catch (error) {
      console.log("Unexpected error fetching saved brands:", error);
      setSavedBrands([]);
      setFilteredBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = (itemId: string) => {
    setUnfilledBookmarks((prev) => {
      const newSet = new Set(prev);
      const isCurrentlyUnfilled = newSet.has(itemId);

      if (isCurrentlyUnfilled) {
        newSet.delete(itemId);
        console.log("✅ Bookmark filled - will keep archived");
      } else {
        newSet.add(itemId);
        console.log("❌ Bookmark unfilled - will unarchive when leaving page");
      }

      return newSet;
    });
  };

  const handleUnarchive = async (itemId: string) => {
    if (!session?.user) return;

    try {
      // Remove from saved_brands table
      const { error } = await supabase
        .from("saved_brands")
        .delete()
        .eq("id", itemId)
        .eq("user_id", session.user.id);

      if (error) {
        console.log("❌ Error unarchiving brand:", error);
        return;
      }

      console.log("✅ Unarchived:", itemId);
    } catch (error) {
      console.log("❌ Unexpected error unarchiving brand:", error);
    }
  };

  // Filter brands based on search query
  const filterBrands = (query: string) => {
    if (!query.trim()) {
      setFilteredBrands(savedBrands);
      return;
    }

    const filtered = savedBrands.filter(
      (brand) =>
        brand.brandName.toLowerCase().includes(query.toLowerCase()) ||
        brand.tagline.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredBrands(filtered);
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/archive");
      if (session) {
        fetchSavedBrands();
        setUnfilledBookmarks(new Set());
      }
    }, [session])
  );

  // Handle page exit - unarchive all unfilled bookmarks
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        const currentUnfilledBookmarks = unfilledBookmarks;
        console.log(
          "🚪 Unarchiving items:",
          Array.from(currentUnfilledBookmarks)
        );

        currentUnfilledBookmarks.forEach((itemId) => {
          handleUnarchive(itemId);
        });
      };
    }, [])
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

  return (
    <ScrollView className="flex-1 bg-transparent">
      {/* Search Bar */}
      <View className="px-4 py-4">
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
          placeholder="Search archived brands..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            filterBrands(text);
          }}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center py-20">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-gray-600">Loading saved brands...</Text>
        </View>
      ) : savedBrands.length === 0 ? (
        <View className="flex-1 justify-center items-center py-20">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            No Saved Brands
          </Text>
          <Text className="text-gray-600 text-center px-8">
            Start saving brands from the main feed to see them here
          </Text>
        </View>
      ) : (
        <View className="space-y-2">
          {filteredBrands.map((brand) => (
            <ArchiveItem
              key={brand.id}
              item={brand}
              onToggle={handleBookmarkToggle}
              isUnfilled={unfilledBookmarks.has(brand.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
