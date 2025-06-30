import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
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

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

const styleCollections = [
  { id: "1", name: "Summer Vibes", itemCount: 12 },
  { id: "2", name: "Work Outfits", itemCount: 8 },
  { id: "3", name: "Weekend Casual", itemCount: 15 },
];

const recentlyPurchased: FashionPiece[] = [
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
];

export default function UserScreen() {
  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/user");
    }, [])
  );

  const renderStyleItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="items-center"
      style={{ width: gridItemWidth }}
      onPress={() => {
        // Handle collection selection
        console.log("Select collection:", item.name);
      }}
    >
      <View
        className="bg-gray-200 rounded-xl justify-center items-center mb-2"
        style={{ width: gridItemWidth, height: gridItemWidth }}
      >
        <Text className="text-xs opacity-50">Image</Text>
      </View>
      <Text className="text-xs font-medium text-left" numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderRecentlyPurchasedItem = ({ item }: { item: FashionPiece }) => (
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
    <ScrollView className="flex-1 bg-transparent">
      {/* Profile Section */}
      <View className="items-center pt-6 pb-2">
        {/* Profile Picture */}
        <Image
          source={{
            uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZ7c0IdRTbJOYyf78cFdrPoUwF1CjQ8GIquQ&s",
          }}
          className="w-24 h-24 rounded-full mb-3"
          resizeMode="cover"
        />

        {/* Name */}
        <Text className="text-xl font-bold text-gray-800 mb-2">
          trapbeforeyourap
        </Text>

        {/* Follower Counts */}
        <View className="flex-row mb-6">
          {/* Brands Archived */}
          <TouchableOpacity
            className="items-center mr-10"
            onPress={() => router.push("/(tabs)/archive")}
          >
            <Text className="text-lg font-bold text-gray-800">24</Text>
            <Text className="text-sm text-gray-600">Archived</Text>
          </TouchableOpacity>

          {/* Friends */}
          <TouchableOpacity className="items-center">
            <Text className="text-lg font-bold text-gray-800">156</Text>
            <Text className="text-sm text-gray-600">Friends</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="pb-4 px-6">
        {/* Style Quiz Button */}
        <TouchableOpacity
          className="bg-gray-800 px-6 py-3 rounded-lg w-full mb-4"
          onPress={() => router.push("/(tabs)/style-quiz")}
        >
          <Text className="text-white text-center font-semibold">
            Style Quiz
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View className="pb-8 px-4">
        {/* My Style Section */}
        <View className="mb-0">
          <View className="flex-row items-center gap-4 mb-4">
            <Text className="text-xl font-bold">MY STYLE</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text className="text-sm font-bold">PIN COLLECTION+</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={styleCollections}
            keyExtractor={(item) => item.id}
            renderItem={renderStyleItem}
            numColumns={3}
            columnWrapperStyle={{
              gap: 16,
              marginBottom: 16,
            }}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        </View>

        {/* Recently Purchased Section */}
        <View className="pb-16">
          <View className="flex-row items-center gap-4 mb-4">
            <Text className="text-xl font-bold">RECENTLY PURCHASED</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text className="text-sm font-bold">(HIDE)</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentlyPurchased}
            keyExtractor={(item) => item.id}
            renderItem={renderRecentlyPurchasedItem}
            numColumns={3}
            columnWrapperStyle={{
              gap: 16,
              marginBottom: 16,
            }}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
