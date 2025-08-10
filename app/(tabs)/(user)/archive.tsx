import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

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

  // Use ref to track unfilled bookmarks for cleanup
  const unfilledBookmarksRef = useRef<Set<string>>(new Set());
  // Use ref to store session for cleanup operations
  const sessionRef = useRef<Session | null>(null);

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
        // Retoggle - remove from unarchive array
        newSet.delete(itemId);
        unfilledBookmarksRef.current.delete(itemId);
        console.log("✅ Bookmark filled - will keep archived");
      } else {
        // Untoggle - add to unarchive array
        newSet.add(itemId);
        unfilledBookmarksRef.current.add(itemId);
        console.log("❌ Bookmark unfilled - will unarchive when leaving page");
      }

      // Log the current brands in the unarchive array after every toggle
      const currentUnfilledArray = Array.from(unfilledBookmarksRef.current);
      if (currentUnfilledArray.length === 0) {
        console.log(
          "📝 Unarchive array is now empty - no brands will be unarchived"
        );
      } else {
        console.log(
          "📝 Current brands in unarchive array:",
          currentUnfilledArray
        );
        // Also log the brand names for better readability
        const brandNames = currentUnfilledArray.map((id) => {
          const brand = savedBrands.find((b) => b.id === id);
          return brand ? brand.brandName : `Unknown (${id})`;
        });
        console.log("🏷️ Brand names in unarchive array:", brandNames);
      }

      return newSet;
    });
  };

  const handleUnarchive = (itemId: string) => {
    if (!sessionRef.current?.user) {
      console.log("❌ No session found, cannot unarchive");
      return;
    }

    console.log("🔄 Unarchiving brand:", itemId);

    // Remove from saved_brands table synchronously
    supabase
      .from("saved_brands")
      .delete()
      .eq("id", itemId)
      .eq("user_id", sessionRef.current.user.id)
      .then(({ error }) => {
        if (error) {
          console.log("❌ Error unarchiving brand:", itemId, error);
        } else {
          console.log("✅ Unarchived successfully:", itemId);
        }
      });
  };

  // Batch unarchive all unfilled bookmarks
  const batchUnarchive = () => {
    const currentUnfilled = Array.from(unfilledBookmarksRef.current);
    if (currentUnfilled.length === 0) {
      console.log("📝 No brands to unarchive");
      return;
    }

    console.log("🚪 Starting to unarchive items:", currentUnfilled);

    // Process all unarchive operations
    currentUnfilled.forEach((itemId) => {
      console.log("UNARCHIVING ITEM", itemId);
      handleUnarchive(itemId);
    });

    console.log("🚀 All unarchive operations initiated");

    // Clear the ref and state immediately
    unfilledBookmarksRef.current.clear();
    setUnfilledBookmarks(new Set());

    // Force a refresh of the saved brands count by triggering a navigation event
    // This will cause the user.tsx page to refresh when you return to it
    console.log("🔄 Triggering count refresh for user.tsx page");
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
        // Reset unfilled bookmarks when entering the page
        setUnfilledBookmarks(new Set());
        unfilledBookmarksRef.current.clear();
      }
    }, [session])
  );

  // Handle page exit - unarchive all unfilled bookmarks
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // This runs when the user navigates away from the page
        batchUnarchive();

        // Force a refresh of the parent page (user.tsx) by triggering a navigation event
        // This ensures the archived count is updated when returning to user.tsx
        console.log(
          "🔄 Archive page cleanup complete - user.tsx will refresh count"
        );
      };
    }, [])
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      sessionRef.current = session;
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        sessionRef.current = session;
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
