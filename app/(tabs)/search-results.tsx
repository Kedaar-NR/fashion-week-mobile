import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function SearchResultsScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const scrollViewRef = React.useRef<ScrollView>(null);

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/search-results");
      console.log("📍 Search query:", query);

      // Scroll to top when screen is focused
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, [query])
  );

  const RANDOM_NUMBER = 327;

  // Mock data for search results
  const searchResults = [
    {
      id: 1,
      brand: "Nike",
      piece: "Air Max 270",
      price: "$150",
      image: "https://via.placeholder.com/200x250",
    },
    {
      id: 2,
      brand: "Adidas",
      piece: "Ultraboost 22",
      price: "$180",
      image: "https://via.placeholder.com/200x250",
    },
    {
      id: 3,
      brand: "Puma",
      piece: "RS-X 3D",
      price: "$110",
      image: "https://via.placeholder.com/200x250",
    },
    {
      id: 4,
      brand: "New Balance",
      piece: "574 Classic",
      price: "$85",
      image: "https://via.placeholder.com/200x250",
    },
    {
      id: 5,
      brand: "Converse",
      piece: "Chuck Taylor",
      price: "$65",
      image: "https://via.placeholder.com/200x250",
    },
    {
      id: 6,
      brand: "Vans",
      piece: "Old Skool",
      price: "$60",
      image: "https://via.placeholder.com/200x250",
    },
  ];

  return (
    <ScrollView ref={scrollViewRef} className="flex-1 bg-transparent">
      <View className="px-4 py-0">
        {/* Search Results Header */}
        <View className="mb-2">
          <Text className="text-gray-600">
            {query
              ? `${RANDOM_NUMBER} Results for "${query}"`
              : "No search query"}
          </Text>
        </View>

        {/* Filter and Sort Buttons */}
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity onPress={() => {}}>
            <Text className="text-sm font-bold">FILTER+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}}>
            <Text className="text-sm font-bold">SORT BY+</Text>
          </TouchableOpacity>
        </View>

        {/* Search Results Grid */}
        {query ? (
          <View className="flex-row flex-wrap justify-between">
            {searchResults.map((item) => (
              <View key={item.id} className="w-[48%] mb-4">
                {/* Rounded Rectangle (Product Image Placeholder) */}
                <View className="w-full h-64 bg-gray-200 rounded-2xl mb-3 overflow-hidden">
                  <View className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl" />
                </View>

                {/* Product Info */}
                <View className="px-1 flex-row justify-between items-start">
                  {/* Brand and Piece in VStack */}
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-800 mb-1">
                      {item.piece}
                    </Text>
                    <Text className="text-xs text-gray-600">{item.brand}</Text>
                  </View>

                  {/* Price on the right */}
                  <Text className="text-sm font-bold text-black">
                    {item.price}
                  </Text>
                </View>
              </View>
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
