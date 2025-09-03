import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

const BUCKET_URL =
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/brand-content";

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

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function CollectionDetailScreen() {
  const { collection } = useLocalSearchParams<{ collection: string }>();
  const router = useRouter();
  const [pieces, setPieces] = useState<CollectionPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [selectedPieces, setSelectedPieces] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [productTypeSubDropdownOpen, setProductTypeSubDropdownOpen] =
    useState(false);
  const [priceRangeSubDropdownOpen, setPriceRangeSubDropdownOpen] =
    useState(false);
  const [productThumbs, setProductThumbs] = useState<Record<number, string>>(
    {}
  );

  const fetchCollectionPieces = async () => {
    if (!collection) {
      setLoading(false);
      return;
    }

    // Handle "all-liked" collection
    if (collection === "all-liked") {
      try {
        setLoading(true);
        setError(null);

        // Get the current user session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Fetch liked products
        const { data: likedProductsData, error: likedProductsError } =
          await supabase
            .from("liked_products")
            .select(
              `
            id,
            created_at,
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
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });

        if (likedProductsError) {
          console.error("Error fetching liked products:", likedProductsError);
          setError("Failed to load liked products");
          setLoading(false);
          return;
        }

        // Transform the data to match our interface
        const transformedPieces: CollectionPiece[] =
          likedProductsData?.map((item: any) => ({
            id: item.product.id,
            product_name: item.product.product_name || "",
            product_desc: item.product.product_desc || "",
            media_filepath: item.product.media_filepath || "",
            price: item.product.price || 0,
            type: item.product.type || "",
            color: item.product.color || "",
            brand_name: item.product.brand?.brand_name || "",
            brand_tagline: item.product.brand?.brand_tagline || "",
          })) || [];

        setPieces(transformedPieces);
        setLoading(false);
        return;
      } catch (err) {
        console.error("Error in fetchLikedProducts:", err);
        setError("An unexpected error occurred");
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Get the collection data including the pieces array
      const { data: collectionData, error: collectionError } = await supabase
        .from("collections")
        .select("id, pieces")
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

      // If no pieces in the collection, return empty array
      if (!collectionData.pieces || collectionData.pieces.length === 0) {
        setPieces([]);
        setLoading(false);
        return;
      }

      // Fetch products using the pieces array
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
        .in("id", collectionData.pieces);

      if (productsError) {
        console.error("Error fetching products:", productsError);
        setError("Failed to load collection pieces");
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

  // Fetch product thumbnails when pieces change
  useEffect(() => {
    if (pieces.length === 0) return;

    const fetchThumbnails = async () => {
      try {
        const entries = await Promise.all(
          pieces.map(async (p) => {
            const url =
              p.media_filepath && p.media_filepath !== "placeholder"
                ? await getProductThumbnailUrl(p.media_filepath)
                : null;
            return [p.id, url] as const;
          })
        );
        setProductThumbs(
          Object.fromEntries(entries.filter(([, url]) => url)) as Record<
            number,
            string
          >
        );
      } catch (_e) {
        // ignore errors
      }
    };

    fetchThumbnails();
  }, [pieces]);

  useFocusEffect(
    React.useCallback(() => {
      console.log(`📍 Current path: /(tabs)/(collections)/[collection]`);
      console.log(`📍 Collection parameter: ${collection}`);
    }, [collection])
  );

  // Function to get product thumbnail URL
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
      const imageFile = files.find((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
      return imageFile ? `${BUCKET_URL}/${mediaPath}/${imageFile}` : null;
    } catch {
      return null;
    }
  }

  const handleDeleteCollection = async () => {
    if (!collection || collection === "all-liked") return;

    Alert.alert(
      "Delete Collection",
      `Are you sure you want to delete "${collection}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              // Get the current user session
              const {
                data: { session },
              } = await supabase.auth.getSession();
              if (!session) {
                Alert.alert(
                  "Error",
                  "You must be logged in to delete collections."
                );
                return;
              }

              // Get the collection data
              const { data: collectionData, error: collectionError } =
                await supabase
                  .from("collections")
                  .select("id, collection_image")
                  .eq("collection_name", collection)
                  .eq("user_id", session.user.id)
                  .single();

              if (collectionError || !collectionData) {
                Alert.alert(
                  "Error",
                  "Collection not found or you don't have permission to delete it."
                );
                return;
              }

              // Delete the collection (pieces array will be deleted automatically)
              const { error: deleteError } = await supabase
                .from("collections")
                .delete()
                .eq("id", collectionData.id)
                .eq("user_id", session.user.id);

              if (deleteError) {
                Alert.alert(
                  "Error",
                  "Failed to delete collection. Please try again."
                );
                return;
              }

              // Delete the collection image from storage if it exists
              if (collectionData.collection_image) {
                try {
                  const imagePath = collectionData.collection_image
                    .split("/")
                    .pop();
                  if (imagePath) {
                    await supabase.storage
                      .from("collection-images")
                      .remove([imagePath]);
                  }
                } catch (storageError) {
                  console.error(
                    "Error deleting image from storage:",
                    storageError
                  );
                  // Don't fail the whole operation if image deletion fails
                }
              }

              Alert.alert("Success", "Collection deleted successfully.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error("Error deleting collection:", error);
              Alert.alert(
                "Error",
                "An unexpected error occurred. Please try again."
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveCollection = async () => {
    if (!collection || collection === "all-liked") return;

    if (!isSelectionMode) {
      // Enter selection mode
      setIsSelectionMode(true);
      setSelectedPieces(new Set());
    } else {
      // Confirm removal
      if (selectedPieces.size === 0) {
        Alert.alert(
          "No Selection",
          "Please select at least one item to remove."
        );
        return;
      }

      setRemoving(true);
      try {
        // Get the current user session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          Alert.alert("Error", "You must be logged in to modify collections.");
          return;
        }

        // Get the current collection data
        const { data: collectionData, error: collectionError } = await supabase
          .from("collections")
          .select("id, pieces")
          .eq("collection_name", collection)
          .eq("user_id", session.user.id)
          .single();

        if (collectionError || !collectionData) {
          Alert.alert(
            "Error",
            "Collection not found or you don't have permission to modify it."
          );
          return;
        }

        // Remove selected product IDs from the pieces array
        const updatedPieces = collectionData.pieces.filter(
          (productId: number) => !selectedPieces.has(productId)
        );

        // Update the collection with the new pieces array
        const { error: updateError } = await supabase
          .from("collections")
          .update({
            pieces: updatedPieces,
          })
          .eq("id", collectionData.id)
          .eq("user_id", session.user.id);

        if (updateError) {
          Alert.alert(
            "Error",
            "Failed to remove items from collection. Please try again."
          );
          return;
        }

        // Refresh the pieces list
        await fetchCollectionPieces();

        // Exit selection mode
        setIsSelectionMode(false);
        setSelectedPieces(new Set());
      } catch (error) {
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      } finally {
        setRemoving(false);
      }
    }
  };

  const handlePieceSelection = (pieceId: number) => {
    if (!isSelectionMode) {
      // Normal mode - navigate to product page
      router.push({
        pathname: "/(tabs)/product/[id]",
        params: { id: pieceId.toString() },
      });
      return;
    }

    // Selection mode - toggle selection
    setSelectedPieces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pieceId)) {
        newSet.delete(pieceId);
      } else {
        newSet.add(pieceId);
      }
      return newSet;
    });
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedPieces(new Set());
  };

  const renderGridItem = ({ item }: { item: CollectionPiece }) => {
    const isSelected = selectedPieces.has(item.id);

    return (
      <TouchableOpacity
        className="items-center"
        style={{ width: gridItemWidth }}
        onPress={() => handlePieceSelection(item.id)}
      >
        <View
          className={`rounded-xl justify-center items-center mb-2 overflow-hidden ${
            isSelected ? "bg-blue-100 border-2 border-blue-400" : "bg-gray-200"
          }`}
          style={{ width: gridItemWidth, height: gridItemWidth }}
        >
          {productThumbs[item.id] ? (
            <Image
              source={{ uri: productThumbs[item.id] }}
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
    );
  };

  const productTypeOptions = [
    {
      label: "SHOES",
      onPress: () => {
        console.log("Filter: Shoes");
        setProductTypeSubDropdownOpen(false);
      },
    },
    {
      label: "CLOTHING",
      onPress: () => {
        console.log("Filter: Clothing");
        setProductTypeSubDropdownOpen(false);
      },
    },
    {
      label: "ACCESSORIES",
      onPress: () => {
        console.log("Filter: Accessories");
        setProductTypeSubDropdownOpen(false);
      },
    },
    {
      label: "BAGS",
      onPress: () => {
        console.log("Filter: Bags");
        setProductTypeSubDropdownOpen(false);
      },
    },
  ];

  const priceRangeOptions = [
    {
      label: "UNDER $50",
      onPress: async () => {
        await fetchCollectionPieces();
        setPieces((prev) => prev.filter((piece) => piece.price < 50));
        setPriceRangeSubDropdownOpen(false);
      },
    },
    {
      label: "UNDER $100",
      onPress: async () => {
        await fetchCollectionPieces();
        setPieces((prev) => prev.filter((piece) => piece.price < 100));
        setPriceRangeSubDropdownOpen(false);
      },
    },
    {
      label: "UNDER $200",
      onPress: async () => {
        await fetchCollectionPieces();
        setPieces((prev) => prev.filter((piece) => piece.price < 200));
        setPriceRangeSubDropdownOpen(false);
      },
    },
    {
      label: "UNDER $500",
      onPress: async () => {
        await fetchCollectionPieces();
        setPieces((prev) => prev.filter((piece) => piece.price < 500));
        setPriceRangeSubDropdownOpen(false);
      },
    },
  ];

  const filterOptions = [
    {
      label: "ALL ITEMS",
      onPress: async () => {
        // Refetch original collection pieces to reset filters
        await fetchCollectionPieces();
        setFilterDropdownOpen(false);
      },
    },
    {
      label: "PRODUCT TYPE",
      onPress: () => {
        setProductTypeSubDropdownOpen(!productTypeSubDropdownOpen);
      },
    },
    {
      label: "PRICE RANGE",
      onPress: () => {
        setPriceRangeSubDropdownOpen(!priceRangeSubDropdownOpen);
      },
    },
  ];

  const sortOptions = [
    {
      label: "NAME",
      onPress: () => {
        setPieces((prev) =>
          [...prev].sort((a, b) => a.product_name.localeCompare(b.product_name))
        );
        setSortDropdownOpen(false);
      },
    },
    {
      label: "PRICE LOW-HIGH",
      onPress: () => {
        setPieces((prev) => [...prev].sort((a, b) => a.price - b.price));
        setSortDropdownOpen(false);
      },
    },
    {
      label: "PRICE HIGH-LOW",
      onPress: () => {
        setPieces((prev) => [...prev].sort((a, b) => b.price - a.price));
        setSortDropdownOpen(false);
      },
    },
  ];

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

  return (
    <ScrollView className="flex-1 px-4">
      {/* Header Section */}
      <View
        className={`flex-row items-center justify-between ${filterDropdownOpen || sortDropdownOpen ? "mb-2" : "mb-4"}`}
      >
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => setFilterDropdownOpen(!filterDropdownOpen)}
          >
            <Text className="text-sm font-bold">FILTER+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortDropdownOpen(!sortDropdownOpen)}
          >
            <Text className="text-sm font-bold">SORT BY+</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center gap-4">
          {isSelectionMode && collection !== "all-liked" && (
            <TouchableOpacity onPress={handleCancelSelection}>
              <Text className="text-sm font-bold text-gray-500">CANCEL</Text>
            </TouchableOpacity>
          )}
          {collection !== "all-liked" && (
            <TouchableOpacity
              onPress={handleDeleteCollection}
              disabled={deleting}
            >
              <Text
                className={`text-sm font-bold ${deleting ? "text-gray-400" : "text-red-500"}`}
              >
                {deleting ? "DELETING..." : "DELETE"}
              </Text>
            </TouchableOpacity>
          )}
          {collection !== "all-liked" && (
            <TouchableOpacity
              onPress={handleRemoveCollection}
              disabled={removing}
            >
              <Text
                className={`text-sm font-bold ${removing ? "text-gray-400" : "text-black"}`}
              >
                {isSelectionMode ? "CONFIRM" : "REMOVE"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Dropdown */}
      {filterDropdownOpen && (
        <View className="mb-4">
          {filterOptions.map((option, index) => (
            <View key={index}>
              <TouchableOpacity
                onPress={option.onPress}
                className="py-2 flex-row items-center justify-between"
              >
                <Text className="text-sm font-bold">{option.label}</Text>
                {(option.label === "PRODUCT TYPE" ||
                  option.label === "PRICE RANGE") && (
                  <Text className="text-sm font-bold">
                    {option.label === "PRODUCT TYPE" &&
                    productTypeSubDropdownOpen
                      ? "▲"
                      : option.label === "PRICE RANGE" &&
                          priceRangeSubDropdownOpen
                        ? "▲"
                        : "▼"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Product Type Sub-dropdown */}
              {option.label === "PRODUCT TYPE" &&
                productTypeSubDropdownOpen && (
                  <View className="ml-4">
                    {productTypeOptions.map((subOption, subIndex) => (
                      <TouchableOpacity
                        key={subIndex}
                        onPress={subOption.onPress}
                        className="py-2"
                      >
                        <Text className="text-sm font-bold">
                          {subOption.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

              {/* Price Range Sub-dropdown */}
              {option.label === "PRICE RANGE" && priceRangeSubDropdownOpen && (
                <View className="ml-4">
                  {priceRangeOptions.map((subOption, subIndex) => (
                    <TouchableOpacity
                      key={subIndex}
                      onPress={subOption.onPress}
                      className="py-2"
                    >
                      <Text className="text-sm font-bold">
                        {subOption.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Sort Dropdown */}
      {sortDropdownOpen && (
        <View className="mb-4">
          {sortOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={option.onPress}
              className="py-2"
            >
              <Text className="text-sm font-bold">{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Pieces Grid Section */}
      <View className="flex-1">
        {pieces.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-gray-600 text-center">
              {collection === "all-liked"
                ? "No liked products yet. Like some products to see them here!"
                : "No pieces found in this collection"}
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
