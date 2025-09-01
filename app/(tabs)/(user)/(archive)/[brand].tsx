import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
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

interface CollectionPiece {
  id: number;
  product_name: string;
  product_desc: string;
  media_filepath: string;
  price: number;
  type: string;
  color: string;
  brand_name: string;
  brand_tagline: string;
}

const BUCKET_URL =
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/brand-content";
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const { width } = Dimensions.get("window");
// Calculate width for 2 columns with proper spacing
// Total gap between items: 1 gap * 16px = 16px
// Total horizontal padding: 32px (16px on each side)
// Available width for items: width - 16 - 32 = width - 48
const gridItemWidth = (width - 48) / 2;

function getMediaType(filename: string): "video" | "image" | null {
  if (VIDEO_EXTENSIONS.some((ext) => filename.endsWith(ext))) return "video";
  if (IMAGE_EXTENSIONS.some((ext) => filename.endsWith(ext))) return "image";
  return null;
}

export default function BrandDetailScreen() {
  const { brand } = useLocalSearchParams<{ brand: string }>();
  const router = useRouter();
  const safeBrand = brand?.replace(/^\/+|\/+$/g, "").replace(/\.[^/.]+$/, "");
  const [pieces, setPieces] = useState<CollectionPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstMedia, setFirstMedia] = useState<{
    type: "video" | "image";
    url: string;
  } | null>(null);
  const [brandContentMedia, setBrandContentMedia] = useState<
    Array<{
      type: "video" | "image";
      url: string;
    }>
  >([]);
  const [contentActive, setContentActive] = useState(true);
  const [catalogActive, setCatalogActive] = useState(true);
  const [isArchived, setIsArchived] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // --- Authentication Setup ---
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

  // Function to get brand ID from brand name
  async function getBrandId(brandName: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from("brand")
        .select("id")
        .eq("brand_name", brandName)
        .single();

      if (error || !data) {
        console.log(`Brand not found: ${brandName}`);
        return null;
      }

      return data.id;
    } catch (error) {
      console.log(`Error getting brand ID for ${brandName}:`, error);
      return null;
    }
  }

  // Function to check if a brand is saved by the current user
  async function isBrandSaved(
    brandId: number,
    userId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("saved_brands")
        .select("id")
        .eq("brand_id", brandId)
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" error
        console.log("Error checking if brand is saved:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.log("Error checking if brand is saved:", error);
      return false;
    }
  }

  // Function to save a brand
  async function saveBrand(brandId: number, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("saved_brands").insert({
        brand_id: brandId,
        user_id: userId,
      });

      if (error) {
        console.log("Error saving brand:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.log("Error saving brand:", error);
      return false;
    }
  }

  // Function to unsave a brand
  async function unsaveBrand(
    brandId: number,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("saved_brands")
        .delete()
        .eq("brand_id", brandId)
        .eq("user_id", userId);

      if (error) {
        console.log("Error unsaving brand:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.log("Error unsaving brand:", error);
      return false;
    }
  }

  // Function to handle archive toggle
  const handleArchiveToggle = async () => {
    if (!session?.user) {
      console.log("User not authenticated");
      return;
    }

    try {
      const brandId = await getBrandId(safeBrand);
      if (!brandId) {
        console.log(`Could not find brand ID for: ${safeBrand}`);
        return;
      }

      if (isArchived) {
        // Unarchive the brand
        const success = await unsaveBrand(brandId, session.user.id);
        if (success) {
          setIsArchived(false);
          console.log(`Unarchived brand: ${safeBrand}`);
        }
      } else {
        // Archive the brand
        const success = await saveBrand(brandId, session.user.id);
        if (success) {
          setIsArchived(true);
          console.log(`Archived brand: ${safeBrand}`);
        }
      }
    } catch (error) {
      console.log("Error handling archive toggle:", error);
    }
  };

  // Function to check initial archive status
  const checkArchiveStatus = async () => {
    if (!session?.user || !safeBrand) return;

    try {
      const brandId = await getBrandId(safeBrand);
      if (!brandId) return;

      const isSaved = await isBrandSaved(brandId, session.user.id);
      setIsArchived(isSaved);
    } catch (error) {
      console.log("Error checking archive status:", error);
    }
  };

  // Check archive status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (session?.user && safeBrand) {
        checkArchiveStatus();
      }
    }, [session, safeBrand])
  );

  const fetchBrandPieces = async () => {
    if (!safeBrand) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, get the brand data to get the brand ID
      const { data: brandData, error: brandError } = await supabase
        .from("brand")
        .select("id, brand_name, brand_tagline, brand_page_content_path")
        .eq("brand_name", safeBrand)
        .single();

      if (brandError) {
        console.error("Error fetching brand:", brandError);
        setError("Brand not found");
        setLoading(false);
        return;
      }

      if (!brandData) {
        setError("Brand not found");
        setLoading(false);
        return;
      }

      // Fetch all products for this brand using the brand ID
      const { data: productsData, error: productsError } = await supabase
        .from("product")
        .select(
          `
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
        `
        )
        .eq("brand_id", brandData.id);

      if (productsError) {
        console.error("Error fetching products:", productsError);
        setError("Failed to load brand products");
        setLoading(false);
        return;
      }

      // Transform the data to match our interface
      const transformedPieces: CollectionPiece[] =
        productsData?.map((product: any) => ({
          id: product.id,
          product_name: product.product_name || "",
          product_desc: product.product_desc || "",
          media_filepath: product.media_filepath || "",
          price: product.price || 0,
          type: product.type || "",
          color: product.color || "",
          brand_name: product.brand?.brand_name || "",
          brand_tagline: product.brand?.brand_tagline || "",
        })) || [];

      setPieces(transformedPieces);

      // Get the first media item for the brand
      await fetchFirstMedia(safeBrand);

      // For testing: create placeholder brand content media
      // TODO: Replace with actual fetchBrandContentMedia when paths are available
      const placeholderMedia = [
        { type: "image" as const, url: "" },
        { type: "image" as const, url: "" },
        { type: "image" as const, url: "" },
      ];
      setBrandContentMedia(placeholderMedia);
    } catch (err) {
      console.error("Error in fetchBrandPieces:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  async function fetchFirstMedia(brandName: string) {
    try {
      // Updated to use scrolling_brand_media folder structure
      const indexUrl = `${BUCKET_URL}/${brandName}/scrolling_brand_media/index.json`;
      const res = await fetch(indexUrl);
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data.files)) return;

      const files = data.files
        .map((f: any) => (typeof f === "string" ? f : f?.name))
        .filter(Boolean)
        .map((name: string) => {
          const type = getMediaType(name);
          return type
            ? {
                type,
                url: `${BUCKET_URL}/${brandName}/scrolling_brand_media/${name}`,
              }
            : null;
        })
        .filter(Boolean) as { type: "video" | "image"; url: string }[];

      if (files.length > 0) {
        // Prefer video over image for the first media
        const videoFile = files.find((f) => f.type === "video");
        const imageFile = files.find((f) => f.type === "image");
        setFirstMedia(videoFile || imageFile || null);
      }
    } catch (error) {
      console.error("Error fetching first media:", error);
    }
  }

  useEffect(() => {
    fetchBrandPieces();
  }, [safeBrand]);

  useFocusEffect(
    React.useCallback(() => {
      console.log(`📍 Current path: /(tabs)/[brand]`);
      console.log(`📍 Brand parameter: ${safeBrand}`);
    }, [safeBrand])
  );

  const renderGridItem = ({ item }: { item: CollectionPiece }) => {
    return (
      <TouchableOpacity
        className="items-center"
        style={{ width: gridItemWidth }}
        onPress={() => {
          router.push({
            pathname: "/(tabs)/product/[id]",
            params: { id: item.id.toString() },
          });
        }}
        activeOpacity={0.7}
      >
        <View
          className="rounded-xl justify-center items-center mb-2 overflow-hidden bg-gray-200"
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
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-600">Loading brand products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 px-4 py-2 rounded-lg"
          onPress={fetchBrandPieces}
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingTop: 0, paddingBottom: 60 }}
    >
      {/* Brand Media Section - Takes up top quarter of screen */}
      <View className="mb-2 pt-0 pb-2">
        <View className="justify-center items-center px-0">
          {firstMedia ? (
            <View className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden">
              {firstMedia.type === "image" ? (
                <Image
                  source={{ uri: firstMedia.url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Video
                  source={{ uri: firstMedia.url }}
                  className="w-full h-full"
                  resizeMode={"cover" as any}
                  shouldPlay={true}
                  isLooping={true}
                  isMuted={true}
                  useNativeControls={false}
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </View>
          ) : (
            <View className="w-full max-w-md aspect-video rounded-2xl bg-gray-200 justify-center items-center">
              <Text className="text-gray-400 text-sm">No Media</Text>
            </View>
          )}
        </View>

        {/* Brand Info and Follow Button */}
        <View className="mt-4">
          {/* Brand Name and Follow Button HStack */}
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold uppercase flex-1">
              {safeBrand}
            </Text>
            <TouchableOpacity
              className={`px-3 py-1.5 rounded-full border ${
                isArchived
                  ? "bg-white border-gray-400"
                  : "bg-gray-400 border-gray-400"
              }`}
              onPress={handleArchiveToggle}
            >
              <Text
                className={`font-bold text-xs ${
                  isArchived ? "text-gray-400" : "text-white"
                }`}
              >
                {isArchived ? "ARCHIVED" : "ARCHIVE +"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tagline below */}
          <Text className="text-sm text-gray-600">
            {pieces[0]?.brand_tagline || "No tagline available"}
          </Text>
        </View>
      </View>

      {/* Content and Catalog Buttons */}
      <View className="flex-row justify-center gap-6 mb-6">
        <TouchableOpacity
          className={`px-3 py-1.5 rounded-full border ${
            contentActive
              ? "bg-white border-gray-400"
              : "bg-gray-400 border-gray-400"
          }`}
          onPress={() => {
            if (!contentActive || catalogActive) {
              setContentActive(!contentActive);
            }
          }}
        >
          <Text
            className={`font-bold text-xs ${
              contentActive ? "text-gray-400" : "text-white"
            }`}
          >
            CONTENT +
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-3 py-1.5 rounded-full border ${
            catalogActive
              ? "bg-white border-gray-400"
              : "bg-gray-400 border-gray-400"
          }`}
          onPress={() => {
            if (!catalogActive || contentActive) {
              setCatalogActive(!catalogActive);
            }
          }}
        >
          <Text
            className={`font-bold text-xs ${
              catalogActive ? "text-gray-400" : "text-white"
            }`}
          >
            CATALOG +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pieces Grid Section */}
      <View className="flex-1">
        {pieces.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-gray-600 text-center">
              No products found for this brand
            </Text>
          </View>
        ) : (
          <View>
            {(() => {
              // If neither button is active, show nothing
              if (!contentActive && !catalogActive) {
                return (
                  <View className="flex-1 justify-center items-center py-8">
                    <Text className="text-gray-600 text-center">
                      Please select Content or Catalog to view items
                    </Text>
                  </View>
                );
              }

              // If only content is active, show only brand media
              if (contentActive && !catalogActive) {
                return brandContentMedia.map((media, index) => (
                  <View key={`media-only-${index}`} className="mb-6">
                    <View className="w-full h-48 bg-gray-200 rounded-2xl justify-center items-center">
                      <Text className="text-gray-400 text-sm">No Image</Text>
                    </View>
                  </View>
                ));
              }

              // If only catalog is active, show only products
              if (!contentActive && catalogActive) {
                const rows = [];
                for (let i = 0; i < pieces.length; i += 2) {
                  const rowPieces = pieces.slice(i, i + 2);
                  rows.push(
                    <View
                      key={`catalog-only-${i}`}
                      className="flex-row gap-4 mb-4"
                    >
                      {rowPieces.map((item, index) => (
                        <View key={i + index} style={{ width: gridItemWidth }}>
                          {renderGridItem({ item })}
                        </View>
                      ))}
                    </View>
                  );
                }
                return rows;
              }

              // If both are active, show interspersed layout (current logic)
              const items: Array<{
                type: "product" | "media";
                data: any;
                index: number;
              }> = [];
              let productIndex = 0;
              let mediaIndex = 0;

              // Add first 4 products (2 rows of 2 products)
              for (let i = 0; i < 4 && productIndex < pieces.length; i++) {
                items.push({
                  type: "product",
                  data: pieces[productIndex],
                  index: productIndex,
                });
                productIndex++;
              }

              // Then intersperse brand content media every 4 products
              while (
                productIndex < pieces.length &&
                mediaIndex < brandContentMedia.length
              ) {
                // Add brand content media
                items.push({
                  type: "media",
                  data: brandContentMedia[mediaIndex],
                  index: mediaIndex,
                });
                mediaIndex++;

                // Add next 4 products
                for (let i = 0; i < 4 && productIndex < pieces.length; i++) {
                  items.push({
                    type: "product",
                    data: pieces[productIndex],
                    index: productIndex,
                  });
                  productIndex++;
                }
              }

              // Add remaining products
              while (productIndex < pieces.length) {
                items.push({
                  type: "product",
                  data: pieces[productIndex],
                  index: productIndex,
                });
                productIndex++;
              }

              // Render items in sequence
              let currentRow: any[] = [];
              const rows: any[] = [];

              items.forEach((item) => {
                if (item.type === "media") {
                  // If we have products in current row, add the row first
                  if (currentRow.length > 0) {
                    rows.push(
                      <View
                        key={`row-${rows.length}`}
                        className="flex-row gap-4 mb-4"
                      >
                        {currentRow.map((product, colIndex) => (
                          <View key={colIndex} style={{ width: gridItemWidth }}>
                            {renderGridItem({ item: product })}
                          </View>
                        ))}
                      </View>
                    );
                    currentRow = [];
                  }

                  // Add media item
                  rows.push(
                    <View key={`media-${item.index}`} className="mb-6">
                      <View className="w-full h-48 bg-gray-200 rounded-2xl justify-center items-center">
                        <Text className="text-gray-400 text-sm">No Image</Text>
                      </View>
                    </View>
                  );
                } else {
                  // Add product to current row
                  currentRow.push(item.data);

                  // If we have 2 products, create a row
                  if (currentRow.length === 2) {
                    rows.push(
                      <View
                        key={`row-${rows.length}`}
                        className="flex-row gap-4 mb-4"
                      >
                        {currentRow.map((product, colIndex) => (
                          <View key={colIndex} style={{ width: gridItemWidth }}>
                            {renderGridItem({ item: product })}
                          </View>
                        ))}
                      </View>
                    );
                    currentRow = [];
                  }
                }
              });

              // Add any remaining products in the last row
              if (currentRow.length > 0) {
                rows.push(
                  <View
                    key={`row-${rows.length}`}
                    className="flex-row gap-4 mb-4"
                  >
                    {currentRow.map((product, colIndex) => (
                      <View key={colIndex} style={{ width: gridItemWidth }}>
                        {renderGridItem({ item: product })}
                      </View>
                    ))}
                  </View>
                );
              }

              return rows;
            })()}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
