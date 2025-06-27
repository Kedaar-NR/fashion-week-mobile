import React from "react";
import { router } from "expo-router";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";

interface ArchiveItem {
  id: string;
  brandName: string;
  tagline: string;
  profileImage: string;
}

const savedBrands: ArchiveItem[] = [
  {
    id: "1",
    brandName: "Stolen Arts",
    tagline: "Streetwear that speaks to the soul",
    profileImage: "https://via.placeholder.com/60/FF6B6B/FFFFFF?text=SA",
  },
  {
    id: "2",
    brandName: "Urban Collective",
    tagline: "Where style meets substance",
    profileImage: "https://via.placeholder.com/60/4ECDC4/FFFFFF?text=UC",
  },
  {
    id: "3",
    brandName: "Minimalist Studio",
    tagline: "Less is more, more is everything",
    profileImage: "https://via.placeholder.com/60/45B7D1/FFFFFF?text=MS",
  },
  {
    id: "4",
    brandName: "Luxury Lane",
    tagline: "Elevating everyday elegance",
    profileImage: "https://via.placeholder.com/60/96CEB4/FFFFFF?text=LL",
  },
  {
    id: "5",
    brandName: "Street Style Co.",
    tagline: "Fashion for the fearless",
    profileImage: "https://via.placeholder.com/60/FFEAA7/FFFFFF?text=SS",
  },
  {
    id: "6",
    brandName: "Design District",
    tagline: "Crafting contemporary classics",
    profileImage: "https://via.placeholder.com/60/DDA0DD/FFFFFF?text=DD",
  },
  {
    id: "7",
    brandName: "Fashion Forward",
    tagline: "Tomorrow's trends today",
    profileImage: "https://via.placeholder.com/60/FFB6C1/FFFFFF?text=FF",
  },
  {
    id: "8",
    brandName: "Urban Essentials",
    tagline: "Your daily style companion",
    profileImage: "https://via.placeholder.com/60/98FB98/FFFFFF?text=UE",
  },
];

const ArchiveItem = ({ item }: { item: ArchiveItem }) => (
  <View className="flex-row items-center mb-3 ml-4">
    <View className="w-16 h-16 rounded-xl bg-gray-300 mr-4"></View>
    <View className="flex-1">
      <Text className="text-lg font-semibold mb-1">{item.brandName.toUpperCase()}</Text>
      <Text className="text-sm text-gray-600">{item.tagline}</Text>
    </View>
  </View>
);

export default function ArchiveScreen() {
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
      <View className="space-y-2">
        {savedBrands.map((brand) => (
          <ArchiveItem key={brand.id} item={brand} />
        ))}
      </View>
    </ScrollView>
  );
}
