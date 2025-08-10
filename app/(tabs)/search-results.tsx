import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

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
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [originalResults, setOriginalResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [searchType, setSearchType] = useState<"products" | "brands">(
    "products"
  );

  // UI State - Instant changes
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [productTypeSubDropdownOpen, setProductTypeSubDropdownOpen] =
    useState(false);
  const [priceRangeSubDropdownOpen, setPriceRangeSubDropdownOpen] =
    useState(false);

  // Data State - For actual filtering/sorting
  const [activeFilters, setActiveFilters] = useState({
    productType: null as string | null,
    priceRange: null as string | null,
    sortBy: null as string | null,
  });

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
    }, [query, searchType])
  );

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setOriginalResults([]);
      setResultCount(0);
      return;
    }

    setLoading(true);
    try {
      if (searchType === "products") {
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
      } else {
        // Search through brands table for matching brand names
        const { data, error } = await supabase
          .from("brand")
          .select(
            `
            id,
            brand_name,
            brand_tagline,
            brand_logo
          `
          )
          .ilike("brand_name", `%${searchQuery}%`)
          .order("brand_name", { ascending: true });

        if (error) {
          console.error("Error searching brands:", error);
          setSearchResults([]);
          setOriginalResults([]);
          setResultCount(0);
          return;
        }

        // Transform brand data to match our interface
        const transformedResults: SearchResult[] = (data || []).map(
          (brand: any) => ({
            id: brand.id,
            product_name: brand.brand_name || "",
            product_desc: brand.brand_tagline || "",
            media_filepath: brand.brand_logo || "",
            price: 0, // Brands don't have prices
            type: "BRAND",
            color: "",
            brand_name: brand.brand_name || "",
            brand_tagline: brand.brand_tagline || "",
          })
        );

        setSearchResults(transformedResults);
        setOriginalResults(transformedResults);
        setResultCount(transformedResults.length);
      }

      // Reset filters when new search is performed
      setActiveFilters({
        productType: null,
        priceRange: null,
        sortBy: null,
      });
    } catch (error) {
      console.error("Error during search:", error);
      setSearchResults([]);
      setOriginalResults([]);
      setResultCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle search type toggle
  const handleSearchTypeToggle = () => {
    setSearchType((prev) => (prev === "products" ? "brands" : "products"));
    // Clear current results when switching types
    setSearchResults([]);
    setOriginalResults([]);
    setResultCount(0);
    // Re-perform search with new type if there's a query
    if (query) {
      performSearch(query);
    }
  };

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

  return (
    <ScrollView ref={scrollViewRef} className="flex-1 bg-transparent">
      <View className="px-4 py-0 mb-16">
        {/* Search Results Header */}
        <View className="mb-2">
          <Text className="text-gray-600">
            {query && !loading
              ? `${resultCount} ${searchType === "products" ? "Products" : "Brands"} for "${query}"`
              : query && loading
                ? `Searching ${searchType === "products" ? "products" : "brands"}...`
                : "No search query"}
          </Text>
        </View>

        {/* Search Type Toggle */}
        <View className="flex-row items-center justify-center mb-4">
          <View className="flex-row bg-gray-100 rounded-lg p-1">
            <TouchableOpacity
              className={`flex-1 py-2 px-4 rounded-md ${
                searchType === "products" ? "bg-white shadow-sm" : ""
              }`}
              onPress={() => {
                if (searchType !== "products") {
                  setSearchType("products");
                  setSearchResults([]);
                  setOriginalResults([]);
                  setResultCount(0);
                  if (query) {
                    performSearch(query);
                  }
                }
              }}
            >
              <Text
                className={`text-sm font-bold text-center ${
                  searchType === "products" ? "text-black" : "text-gray-500"
                }`}
              >
                PRODUCTS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 px-4 rounded-md ${
                searchType === "brands" ? "bg-white shadow-sm" : ""
              }`}
              onPress={() => {
                if (searchType !== "brands") {
                  setSearchType("brands");
                  setSearchResults([]);
                  setOriginalResults([]);
                  setResultCount(0);
                  if (query) {
                    performSearch(query);
                  }
                }
              }}
            >
              <Text
                className={`text-sm font-bold text-center ${
                  searchType === "brands" ? "text-black" : "text-gray-500"
                }`}
              >
                BRANDS
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter and Sort Buttons - Only show for products */}
        {searchType === "products" && (
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
        )}

        {/* Filter Dropdown - Only show for products */}
        {searchType === "products" && filterDropdownOpen && (
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

        {/* Sort Dropdown - Only show for products */}
        {searchType === "products" && sortDropdownOpen && (
          <View className="mb-4">
            {sortOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={option.onPress}
                className="py-2 border-b border-gray-200"
              >
                <Text className="text-sm">{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search Results */}
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" />
            <Text className="mt-2 text-gray-600">
              Searching {searchType === "products" ? "products" : "brands"}...
            </Text>
          </View>
        ) : (
          <>
            {/* No Results Message */}
            {!loading && searchResults.length === 0 && resultCount > 0 && (
              <View className="flex-1 justify-center items-center py-16">
                <Text className="text-lg font-semibold text-gray-600 mb-2">
                  No {searchType === "products" ? "products" : "brands"} found
                </Text>
                <Text className="text-sm text-gray-500 text-center">
                  Try adjusting your{" "}
                  {searchType === "products" ? "filters" : "search terms"} or
                  search terms
                </Text>
              </View>
            )}

            {/* No Search Query Message */}
            {!query && !loading && (
              <View className="flex-1 justify-center items-center py-16">
                <Text className="text-lg font-semibold text-gray-600 mb-2">
                  Start searching
                </Text>
                <Text className="text-sm text-gray-500 text-center">
                  Enter a search term to find{" "}
                  {searchType === "products" ? "products" : "brands"}
                </Text>
              </View>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View className="flex-row flex-wrap justify-between">
                {searchResults.map((item) => (
                  <View key={item.id} className="w-[48%] mb-4">
                    {/* Image Placeholder */}
                    <View className="w-full h-64 bg-gray-200 rounded-2xl mb-3 overflow-hidden">
                      <View className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl justify-center items-center">
                        <Text className="text-gray-500 text-xs text-center px-2">
                          {item.media_filepath ? "Image" : "No Image"}
                        </Text>
                      </View>
                    </View>

                    {/* Info */}
                    <View className="px-1 flex-row justify-between items-start">
                      {/* Name and Details in VStack */}
                      <View className="flex-1">
                        <Text
                          className="text-sm font-semibold text-gray-800 mb-1"
                          numberOfLines={2}
                        >
                          {searchType === "products"
                            ? item.product_name
                            : item.brand_name}
                        </Text>
                        <Text className="text-xs text-gray-600">
                          {searchType === "products"
                            ? item.brand_name
                            : item.brand_tagline}
                        </Text>
                      </View>

                      {/* Price on the right - Only show for products */}
                      {searchType === "products" && (
                        <Text className="text-sm font-bold text-black">
                          ${item.price}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
