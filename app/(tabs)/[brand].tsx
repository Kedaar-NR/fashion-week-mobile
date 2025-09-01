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
import { IconSymbol } from "../../components/ui/IconSymbol";
import { supabase } from "../../lib/supabase";

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
  const [productThumbs, setProductThumbs] = useState<{
    [id: number]: string | null;
  }>({});
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set());

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
        .eq("media_filepath", brandName)
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

  // Function to check if a product is liked by the current user
  async function isProductLiked(
    productId: number,
    userId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("liked_products")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" error
        console.log("Error checking if product is liked:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.log("Error checking if product is liked:", error);
      return false;
    }
  }

  // Function to like a product
  async function likeProduct(
    productId: number,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("liked_products").insert({
        product_id: productId,
        user_id: userId,
      });

      if (error) {
        console.log("Error liking product:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.log("Error liking product:", error);
      return false;
    }
  }

  // Function to unlike a product
  async function unlikeProduct(
    productId: number,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("liked_products")
        .delete()
        .eq("product_id", productId)
        .eq("user_id", userId);

      if (error) {
        console.log("Error unliking product:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.log("Error unliking product:", error);
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

  // Function to handle product like toggle
  const handleProductLikeToggle = async (productId: number) => {
    if (!session?.user) {
      console.log("User not authenticated");
      return;
    }

    try {
      const isCurrentlyLiked = likedProducts.has(productId);

      if (isCurrentlyLiked) {
        // Unlike the product
        const success = await unlikeProduct(productId, session.user.id);
        if (success) {
          setLikedProducts((prev) => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
          console.log(`Unliked product: ${productId}`);
        }
      } else {
        // Like the product
        const success = await likeProduct(productId, session.user.id);
        if (success) {
          setLikedProducts((prev) => new Set([...prev, productId]));
          console.log(`Liked product: ${productId}`);
        }
      }
    } catch (error) {
      console.log("Error handling product like toggle:", error);
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

  // Function to check initial liked products status
  const checkLikedProductsStatus = async () => {
    if (!session?.user || !pieces || pieces.length === 0) return;

    try {
      const likedStatuses = await Promise.all(
        pieces.map(async (piece) => {
          const isLiked = await isProductLiked(piece.id, session.user.id);
          return { productId: piece.id, isLiked };
        })
      );

      const likedProductIds = likedStatuses
        .filter((status) => status.isLiked)
        .map((status) => status.productId);

      setLikedProducts(new Set(likedProductIds));
    } catch (error) {
      console.log("Error checking liked products status:", error);
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

  // Check liked products status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (session?.user && pieces && pieces.length > 0) {
        checkLikedProductsStatus();
      }
    }, [session, pieces])
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
        .eq("media_filepath", safeBrand)
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
          brand_name: product.brand?.brand_name || brandData.brand_name || "",
          brand_tagline:
            product.brand?.brand_tagline || brandData.brand_tagline || "",
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

      // Set display name and tagline fallback when available
      // We do not maintain a separate state; use brandData directly in render via pieces fallback
    } catch (err) {
      console.error("Error in fetchBrandPieces:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pieces && pieces.length > 0) {
      loadProductThumbs(pieces);
    } else {
      setProductThumbs({});
    }
  }, [pieces]);

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

  async function getProductThumbnailUrl(
    mediaPath: string
  ): Promise<string | null> {
    try {
      const indexUrl = `${BUCKET_URL}/${mediaPath}/index.json`;
      const res = await fetch(indexUrl);
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data?.files)) return null;
      const files: string[] = data.files
        .map((f: any) => (typeof f === "string" ? f : f?.name))
        .filter(Boolean);
      if (!files.length) return null;
      const lowerSet = new Set(files.map((f) => String(f).toLowerCase()));
      let chosen: string | undefined = undefined;
      if (lowerSet.has("listing_image.jpg")) {
        chosen = files.find(
          (f) => String(f).toLowerCase() === "listing_image.jpg"
        );
      }
      if (!chosen) {
        chosen = files.find((name) =>
          IMAGE_EXTENSIONS.some((ext) =>
            String(name).toLowerCase().endsWith(ext)
          )
        );
      }
      return chosen ? `${BUCKET_URL}/${mediaPath}/${chosen}` : null;
    } catch (_e) {
      return null;
    }
  }

  async function loadProductThumbs(forPieces: CollectionPiece[]) {
    try {
      const entries = await Promise.all(
        forPieces.map(async (p) => {
          const url = p.media_filepath
            ? await getProductThumbnailUrl(p.media_filepath)
            : null;
          return [p.id, url] as const;
        })
      );
      setProductThumbs(Object.fromEntries(entries));
    } catch (_e) {
      // ignore errors
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
    const isLiked = likedProducts.has(item.id);

    return (
      <View className="items-center" style={{ width: gridItemWidth }}>
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
            {productThumbs[item.id] ? (
              <Image
                source={{ uri: productThumbs[item.id] as string }}
                className="w-full h-full"
                resizeMode="cover"
              />
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

        {/* Like Button */}
        <TouchableOpacity
          className="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full justify-center items-center"
          onPress={() => handleProductLikeToggle(item.id)}
        >
          <IconSymbol
            name={isLiked ? "heart.fill" : "heart"}
            size={16}
            color={isLiked ? "#ef4444" : "#6b7280"}
          />
        </TouchableOpacity>
      </View>
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
              {pieces[0]?.brand_name || safeBrand}
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

          {/* Tagline below - only show if available */}
          {pieces[0]?.brand_tagline && (
            <Text className="text-sm text-gray-600">
              {pieces[0].brand_tagline}
            </Text>
          )}
        </View>
      </View>

      {/* Content and Catalog Buttons */}
      <View className="flex-row justify-center gap-6 mb-6">
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
                // TODO: Implement brand content when available
                // return brandContentMedia.map((media, index) => (
                //   <View key={`media-only-${index}`} className="mb-6">
                //     <View className="w-full h-48 bg-gray-200 rounded-2xl justify-center items-center">
                //       <Text className="text-gray-400 text-sm">No Image</Text>
                //     </View>
                //   </View>
                // ));
                return (
                  <View className="flex-1 justify-center items-center py-8">
                    <Text className="text-gray-600 text-center">
                      Brand content coming soon
                    </Text>
                  </View>
                );
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
              // TODO: Implement brand content when available
              // while (
              //   productIndex < pieces.length &&
              //   mediaIndex < brandContentMedia.length
              // ) {
              //   // Add brand content media
              //   items.push({
              //     type: "media",
              //     data: brandContentMedia[mediaIndex],
              //     index: mediaIndex,
              //   });
              //   mediaIndex++;

              //   // Add next 4 products
              //   for (let i = 0; i < 4 && productIndex < pieces.length; i++) {
              //     items.push({
              //       type: "product",
              //       data: pieces[productIndex],
              //       index: productIndex,
              //     });
              //     productIndex++;
              //   }
              // }

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
                // TODO: Implement brand content when available
                // Since we're not adding media items, all items are products
                // if (item.type === "media") {
                //   // If we have products in current row, add the row first
                //   if (currentRow.length > 0) {
                //     rows.push(
                //       <View
                //         key={`row-${rows.length}`}
                //         className="flex-row gap-4 mb-4"
                //       >
                //         {currentRow.map((product, colIndex) => (
                //           <View key={colIndex} style={{ width: gridItemWidth }}>
                //             {renderGridItem({ item: product })}
                //           </View>
                //         ))}
                //       </View>
                //     );
                //     currentRow = [];
                //   }

                //   // Add media item
                //   rows.push(
                //     <View key={`media-${item.index}`} className="mb-6">
                //       <View className="w-full h-48 bg-gray-200 rounded-2xl justify-center items-center">
                //         <Text className="text-gray-400 text-sm">No Image</Text>
                //       </View>
                //     </View>
                //   );
                // } else {

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
                // }
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
