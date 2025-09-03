import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const BUCKET_URL =
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/brand-content";

interface SearchResult {
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

export default function SearchResultsScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const router = useRouter();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [originalResults, setOriginalResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [productTypeSubDropdownOpen, setProductTypeSubDropdownOpen] =
    useState(false);
  const [priceRangeSubDropdownOpen, setPriceRangeSubDropdownOpen] =
    useState(false);
  const [productThumbs, setProductThumbs] = useState<Record<number, string>>(
    {}
  );

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/search-results");
      console.log("📍 Search query:", query);

      // Scroll to top when screen is focused
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });

      // Perform search when query changes
      if (query) {
        performSearch(query);
      }
    }, [query])
  );

  // Fetch product thumbnails when search results change
  React.useEffect(() => {
    if (searchResults.length === 0) return;

    const fetchThumbnails = async () => {
      try {
        const entries = await Promise.all(
          searchResults.map(async (p) => {
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
  }, [searchResults]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setOriginalResults([]);
      setResultCount(0);
      return;
    }

    setLoading(true);
    try {
      // Search through products table for matching product names
      const { data, error } = await supabase
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
        .ilike("product_name", `%${searchQuery}%`)
        .order("product_name", { ascending: true });

      if (error) {
        console.error("Error searching products:", error);
        setSearchResults([]);
        setOriginalResults([]);
        setResultCount(0);
        return;
      }

      // Transform the data to match our interface
      const transformedResults: SearchResult[] = (data || []).map(
        (product: any) => ({
          id: product.id,
          product_name: product.product_name || "",
          product_desc: product.product_desc || "",
          media_filepath: product.media_filepath || "",
          price: product.price || 0,
          type: product.type || "",
          color: product.color || "",
          brand_name: product.brand?.brand_name || "",
          brand_tagline: product.brand?.brand_tagline || "",
        })
      );

      setSearchResults(transformedResults);
      setOriginalResults(transformedResults);
      setResultCount(transformedResults.length);
    } catch (error) {
      console.error("Error in search:", error);
      setSearchResults([]);
      setOriginalResults([]);
      setResultCount(0);
    } finally {
      setLoading(false);
    }
  };

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

  const productTypeOptions = [
    {
      label: "SHIRT",
      onPress: () => {
        setSearchResults(
          originalResults.filter((piece) => piece.type === "Shirt")
        );
        setProductTypeSubDropdownOpen(false);
      },
    },
    {
      label: "PANTS",
      onPress: () => {
        setSearchResults(
          originalResults.filter((piece) => piece.type === "Pants")
        );
        setProductTypeSubDropdownOpen(false);
      },
    },
    {
      label: "OUTERWEAR",
      onPress: () => {
        setSearchResults(
          originalResults.filter((piece) => piece.type === "Outerwear")
        );
        setProductTypeSubDropdownOpen(false);
      },
    },
    {
      label: "ACCESSORIES",
      onPress: () => {
        setSearchResults(
          originalResults.filter((piece) => piece.type === "Accessory")
        );
        setProductTypeSubDropdownOpen(false);
      },
    },
    {
      label: "SHOES",
      onPress: () => {
        setSearchResults(
          originalResults.filter((piece) => piece.type === "Shoes")
        );
        setProductTypeSubDropdownOpen(false);
      },
    },
  ];

  const priceRangeOptions = [
    {
      label: "UNDER $50",
      onPress: () => {
        setSearchResults(originalResults.filter((piece) => piece.price < 50));
        setPriceRangeSubDropdownOpen(false);
      },
    },
    {
      label: "UNDER $100",
      onPress: () => {
        setSearchResults(originalResults.filter((piece) => piece.price < 100));
        setPriceRangeSubDropdownOpen(false);
      },
    },
    {
      label: "UNDER $200",
      onPress: () => {
        setSearchResults(originalResults.filter((piece) => piece.price < 200));
        setPriceRangeSubDropdownOpen(false);
      },
    },
    {
      label: "UNDER $500",
      onPress: () => {
        setSearchResults(originalResults.filter((piece) => piece.price < 500));
        setPriceRangeSubDropdownOpen(false);
      },
    },
  ];

  const filterOptions = [
    {
      label: "ALL ITEMS",
      onPress: () => {
        // Reset to original search results
        setSearchResults(originalResults);
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
        setSearchResults((prev) =>
          [...prev].sort((a, b) => a.product_name.localeCompare(b.product_name))
        );
        setSortDropdownOpen(false);
      },
    },
    {
      label: "PRICE LOW-HIGH",
      onPress: () => {
        setSearchResults((prev) => [...prev].sort((a, b) => a.price - b.price));
        setSortDropdownOpen(false);
      },
    },
    {
      label: "PRICE HIGH-LOW",
      onPress: () => {
        setSearchResults((prev) => [...prev].sort((a, b) => b.price - a.price));
        setSortDropdownOpen(false);
      },
    },
  ];

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <View className="w-[48%] mb-4">
      {/* Product Image */}
      <View className="w-full h-64 bg-gray-200 rounded-2xl mb-3 overflow-hidden">
        {productThumbs[item.id] ? (
          <Image
            source={{ uri: productThumbs[item.id] }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl justify-center items-center">
            <Text className="text-gray-500 text-xs text-center px-2">
              No Image
            </Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View className="px-1 flex-row justify-between items-start">
        {/* Product Name and Brand in VStack */}
        <View className="flex-1">
          <Text
            className="text-sm font-semibold text-gray-800 mb-1"
            numberOfLines={2}
          >
            {item.product_name}
          </Text>
          <Text className="text-xs text-gray-600">{item.brand_name}</Text>
        </View>

        {/* Price on the right */}
        <Text className="text-sm font-bold text-black">${item.price}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView ref={scrollViewRef} className="flex-1 bg-transparent">
      <View className="px-4 py-0 mb-16">
        {/* Search Results Header */}
        <View className="mb-2">
          <Text className="text-gray-600">
            {query && !loading
              ? `${resultCount} Results for "${query}"`
              : query && loading
                ? "Searching..."
                : "No search query"}
          </Text>
        </View>

        {/* Filter and Sort Buttons */}
        <View
          className={`flex-row items-center gap-4 mb-4 ${
            filterDropdownOpen || sortDropdownOpen ? "mb-2" : "mb-4"
          }`}
        >
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
                {option.label === "PRICE RANGE" &&
                  priceRangeSubDropdownOpen && (
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

        {/* Search Results */}
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" />
            <Text className="mt-2 text-gray-600">Searching products...</Text>
          </View>
        ) : query && searchResults.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              No Products Found
            </Text>
            <Text className="text-gray-600 text-center px-8">
              Try adjusting your search terms or browse our catalog
            </Text>
          </View>
        ) : query && searchResults.length > 0 ? (
          <View className="flex-row flex-wrap justify-between">
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="w-[48%] mb-4"
                onPress={() => {
                  router.push({
                    pathname: "/(tabs)/product/[id]",
                    params: { id: item.id.toString() },
                  });
                }}
                activeOpacity={0.7}
              >
                {/* Product Image */}
                <View className="w-full h-64 bg-gray-200 rounded-2xl mb-3 overflow-hidden">
                  {productThumbs[item.id] ? (
                    <Image
                      source={{ uri: productThumbs[item.id] }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl justify-center items-center">
                      <Text className="text-gray-500 text-xs text-center px-2">
                        No Image
                      </Text>
                    </View>
                  )}
                </View>

                {/* Product Info */}
                <View className="px-1 flex-row justify-between items-start">
                  {/* Product Name and Brand in VStack */}
                  <View className="flex-1">
                    <Text
                      className="text-sm font-semibold text-gray-800 mb-1"
                      numberOfLines={2}
                    >
                      {item.product_name}
                    </Text>
                    <Text className="text-xs text-gray-600">
                      {item.brand_name}
                    </Text>
                    {item.type && (
                      <Text className="text-xs text-gray-500 mt-1">
                        {item.type}
                      </Text>
                    )}
                  </View>

                  {/* Price on the right */}
                  <Text className="text-sm font-bold text-black">
                    ${item.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Content for when there's no search query
          <View className="bg-gray-100 rounded-lg p-8 items-center">
            <Text className="text-lg font-semibold mb-2 text-center">
              No Search Query
            </Text>
            <Text className="text-gray-600 text-center">
              Use the search bar in the navigation to find what you're looking
              for.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
