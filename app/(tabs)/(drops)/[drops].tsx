import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Drop {
  id: string;
  name: string;
  creator: string;
  date: string;
  views: number;
  image: string;
  status: "recent" | "upcoming";
}

const mockDrops: Drop[] = [
  // Recent Drops
  {
    id: "1",
    name: "Summer Collection 2024",
    creator: "@stolen_arts",
    date: "Friday, Dec 15 6:00 PM PST",
    views: 1247,
    image: "https://via.placeholder.com/80/FF6B6B/FFFFFF?text=Drop",
    status: "recent",
  },
  {
    id: "2",
    name: "Urban Streetwear",
    creator: "@fashion_house",
    date: "Thursday, Dec 12 3:00 PM PST",
    views: 892,
    image: "https://via.placeholder.com/80/4ECDC4/FFFFFF?text=Drop",
    status: "recent",
  },
  {
    id: "3",
    name: "Minimalist Essentials",
    creator: "@design_studio",
    date: "Tuesday, Dec 10 7:00 PM PST",
    views: 1563,
    image: "https://via.placeholder.com/80/45B7D1/FFFFFF?text=Drop",
    status: "recent",
  },
  {
    id: "4",
    name: "Luxury Streetwear",
    creator: "@luxury_brand",
    date: "Monday, Dec 8 5:00 PM PST",
    views: 2103,
    image: "https://via.placeholder.com/80/96CEB4/FFFFFF?text=Drop",
    status: "recent",
  },
  {
    id: "5",
    name: "Athletic Performance",
    creator: "@sport_brand",
    date: "Saturday, Dec 6 2:00 PM PST",
    views: 1876,
    image: "https://via.placeholder.com/80/FFEAA7/FFFFFF?text=Drop",
    status: "recent",
  },
  {
    id: "6",
    name: "Evening Collection",
    creator: "@luxury_fashion",
    date: "Thursday, Dec 4 9:00 PM PST",
    views: 3124,
    image: "https://via.placeholder.com/80/DDA0DD/FFFFFF?text=Drop",
    status: "recent",
  },
  // Upcoming Drops
  {
    id: "7",
    name: "Winter Luxury Line",
    creator: "@stolen_arts",
    date: "Friday, Dec 20 8:00 PM PST",
    views: 2341,
    image: "https://via.placeholder.com/80/FF6B6B/FFFFFF?text=Drop",
    status: "upcoming",
  },
  {
    id: "8",
    name: "Street Style Essentials",
    creator: "@urban_collective",
    date: "Sunday, Dec 22 2:00 PM PST",
    views: 1876,
    image: "https://via.placeholder.com/80/4ECDC4/FFFFFF?text=Drop",
    status: "upcoming",
  },
  {
    id: "9",
    name: "Minimalist Studio Launch",
    creator: "@minimalist_studio",
    date: "Wednesday, Dec 25 9:00 PM PST",
    views: 3124,
    image: "https://via.placeholder.com/80/45B7D1/FFFFFF?text=Drop",
    status: "upcoming",
  },
  {
    id: "10",
    name: "Luxury Lane Collection",
    creator: "@luxury_lane",
    date: "Friday, Dec 27 7:00 PM PST",
    views: 1892,
    image: "https://via.placeholder.com/80/96CEB4/FFFFFF?text=Drop",
    status: "upcoming",
  },
  {
    id: "11",
    name: "Street Style Co. Drop",
    creator: "@street_style_co",
    date: "Sunday, Dec 29 4:00 PM PST",
    views: 1456,
    image: "https://via.placeholder.com/80/FFEAA7/FFFFFF?text=Drop",
    status: "upcoming",
  },
  {
    id: "12",
    name: "Design District Launch",
    creator: "@design_district",
    date: "Tuesday, Dec 31 6:00 PM PST",
    views: 2789,
    image: "https://via.placeholder.com/80/DDA0DD/FFFFFF?text=Drop",
    status: "upcoming",
  },
];

const DropItem = ({ drop }: { drop: Drop }) => (
  <TouchableOpacity
    className="flex-row items-center mb-6"
    onPress={() => {
      // Handle drop selection - can be expanded later
      console.log("Selected drop:", drop.name);
    }}
  >
    <View className="w-40 h-24 rounded-xl bg-gray-300 mr-4"></View>
    <View className="flex-1">
      <Text className="text-sm text-gray-500 mb-1">{drop.date}</Text>
      <Text className="text-base font-semibold mb-1">{drop.name}</Text>
      <Text className="text-sm text-gray-600 mb-1">by {drop.creator}</Text>
      <Text className="text-xs text-gray-400">
        {drop.views.toLocaleString()} views
      </Text>
    </View>
  </TouchableOpacity>
);

export default function DropsDetailScreen() {
  const { drops } = useLocalSearchParams<{ drops: string }>();
  const [allDrops] = useState<Drop[]>(mockDrops);

  useFocusEffect(
    React.useCallback(() => {
      console.log(`📍 Current path: /(tabs)/(drops)/[drops]`);
      console.log(`📍 Drops parameter: ${drops}`);
    }, [drops])
  );

  // Filter drops based on the parameter
  const filteredDrops = allDrops.filter((drop) => {
    if (drops === "recent") {
      return drop.status === "recent";
    } else if (drops === "upcoming") {
      return drop.status === "upcoming";
    }
    return true; // Show all if no specific filter
  });

  // Get the display text
  const displayText =
    drops === "recent"
      ? "RECENT"
      : drops === "upcoming"
        ? "UPCOMING"
        : drops?.toUpperCase();

  return (
    <ScrollView className="flex-1 bg-transparent">
      <View className="px-4">
        {/* Header Section */}
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity onPress={() => {}}>
            <Text className="text-sm font-bold">FILTER+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}}>
            <Text className="text-sm font-bold">SORT BY+</Text>
          </TouchableOpacity>
        </View>

        {/* Drops List */}
        <View className="space-y-2">
          {filteredDrops.map((drop) => (
            <DropItem key={drop.id} drop={drop} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
