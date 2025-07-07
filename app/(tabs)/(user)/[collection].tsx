import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FashionPiece {
  id: string;
  name: string;
  type: string;
  designer: string;
  image: string;
  price: string;
  color: string;
}

const mockPieces: FashionPiece[] = [
  {
    id: "1",
    name: "Classic White Tee",
    type: "Tops",
    designer: "Stolen Arts",
    image: "placeholder",
    price: "$45",
    color: "White",
  },
  {
    id: "2",
    name: "Distressed Denim Jacket",
    type: "Outerwear",
    designer: "Urban Collective",
    image: "placeholder",
    price: "$120",
    color: "Blue",
  },
  {
    id: "3",
    name: "Minimalist Sneakers",
    type: "Footwear",
    designer: "Minimalist Studio",
    image: "placeholder",
    price: "$85",
    color: "Gray",
  },
  {
    id: "4",
    name: "Silk Blouse",
    type: "Tops",
    designer: "Luxury Lane",
    image: "placeholder",
    price: "$95",
    color: "Cream",
  },
  {
    id: "5",
    name: "Cargo Pants",
    type: "Bottoms",
    designer: "Street Style Co.",
    image: "placeholder",
    price: "$75",
    color: "Olive",
  },
  {
    id: "6",
    name: "Leather Crossbody",
    type: "Accessories",
    designer: "Design District",
    image: "placeholder",
    price: "$150",
    color: "Black",
  },
  {
    id: "7",
    name: "Oversized Sweater",
    type: "Tops",
    designer: "Fashion Forward",
    image: "placeholder",
    price: "$65",
    color: "Beige",
  },
  {
    id: "8",
    name: "High-Waist Jeans",
    type: "Bottoms",
    designer: "Urban Essentials",
    image: "placeholder",
    price: "$90",
    color: "Indigo",
  },
  {
    id: "9",
    name: "Statement Earrings",
    type: "Accessories",
    designer: "Stolen Arts",
    image: "placeholder",
    price: "$35",
    color: "Gold",
  },
  {
    id: "10",
    name: "Puffer Vest",
    type: "Outerwear",
    designer: "Urban Collective",
    image: "placeholder",
    price: "$110",
    color: "Navy",
  },
  {
    id: "11",
    name: "Slip Dress",
    type: "Dresses",
    designer: "Luxury Lane",
    image: "placeholder",
    price: "$125",
    color: "Black",
  },
  {
    id: "12",
    name: "Canvas Tote",
    type: "Accessories",
    designer: "Minimalist Studio",
    image: "placeholder",
    price: "$55",
    color: "Natural",
  },
  {
    id: "13",
    name: "Crop Top",
    type: "Tops",
    designer: "Street Style Co.",
    image: "placeholder",
    price: "$40",
    color: "Pink",
  },
  {
    id: "14",
    name: "Wide-Leg Pants",
    type: "Bottoms",
    designer: "Design District",
    image: "placeholder",
    price: "$85",
    color: "Charcoal",
  },
  {
    id: "15",
    name: "Chunky Boots",
    type: "Footwear",
    designer: "Fashion Forward",
    image: "placeholder",
    price: "$180",
    color: "Brown",
  },
];

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function CollectionDetailScreen() {
  const { collection } = useLocalSearchParams<{ collection: string }>();
  const [pieces] = useState<FashionPiece[]>(mockPieces);

  useFocusEffect(
    React.useCallback(() => {
      console.log(`📍 Current path: /(tabs)/(user)/[collection]`);
      console.log(`📍 Collection parameter: ${collection}`);
    }, [collection])
  );

  // If the collection parameter is "all-liked", show "ALL LIKED", otherwise show the collection name
  const displayText =
    collection === "all-liked" ? "ALL LIKED" : collection?.toUpperCase();

  const renderGridItem = ({ item }: { item: FashionPiece }) => (
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

  return (
    <ScrollView className="flex-1 px-4">
      {/* Header Section */}
      <View className="flex-row items-center gap-4 mb-4">
        <TouchableOpacity onPress={() => {}}>
          <Text className="text-sm font-bold">FILTER+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}}>
          <Text className="text-sm font-bold">SORT BY+</Text>
        </TouchableOpacity>
      </View>

      {/* Pieces Grid Section */}
      <View className="flex-1">
        <FlatList
          data={pieces}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          numColumns={3}
          columnWrapperStyle={{
            gap: 16,
            marginBottom: 16,
          }}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </ScrollView>
  );
}
