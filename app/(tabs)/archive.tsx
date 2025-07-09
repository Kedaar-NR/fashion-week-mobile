import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

interface ArchiveItem {
  id: string;
  brandName: string;
  tagline: string;
  profileImage: string;
}

const ArchiveItem = ({ item }: { item: ArchiveItem }) => (
  <TouchableOpacity
    className="flex-row items-center mb-3 ml-4"
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
  </TouchableOpacity>
);

export default function ArchiveScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [savedBrands, setSavedBrands] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);

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
            brandName: item.brand?.brand_name || "Unknown Brand",
            tagline: item.brand?.brand_tagline || "No tagline available",
            profileImage: `https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/profile-pics/${item.brand?.brand_name}.jpg`,
          })
        );
        setSavedBrands(transformedData);
      }
    } catch (error) {
      console.log("Unexpected error fetching saved brands:", error);
      setSavedBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/archive");
      if (session) {
        fetchSavedBrands();
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

  return (
    <ScrollView className="flex-1 bg-transparent">
      <View className="flex-row items-center gap-4 ml-4 mb-4">
        <TouchableOpacity onPress={() => {}}>
          <Text className="text-sm font-bold">FILTER+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}}>
          <Text className="text-sm font-bold">SORT BY+</Text>
        </TouchableOpacity>
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
          {savedBrands.map((brand) => (
            <ArchiveItem key={brand.id} item={brand} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
