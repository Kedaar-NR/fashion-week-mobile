import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Drop {
  id: string;
  name: string;
  creator: string;
  date: string;
  views: number;
  image: string;
}

const recentDrops: Drop[] = [
  {
    id: "1",
    name: "Summer Collection 2024",
    creator: "@stolen_arts",
    date: "Friday, Dec 15 6:00 PM PST",
    views: 1247,
    image: "https://via.placeholder.com/80/FF6B6B/FFFFFF?text=Drop",
  },
  {
    id: "2",
    name: "Urban Streetwear",
    creator: "@fashion_house",
    date: "Thursday, Dec 12 3:00 PM PST",
    views: 892,
    image: "https://via.placeholder.com/80/4ECDC4/FFFFFF?text=Drop",
  },
  {
    id: "3",
    name: "Minimalist Essentials",
    creator: "@design_studio",
    date: "Tuesday, Dec 10 7:00 PM PST",
    views: 1563,
    image: "https://via.placeholder.com/80/45B7D1/FFFFFF?text=Drop",
  },
];

const upcomingDrops: Drop[] = [
  {
    id: "4",
    name: "Winter Luxury Line",
    creator: "@stolen_arts",
    date: "Friday, Dec 20 8:00 PM PST",
    views: 2341,
    image: "https://via.placeholder.com/80/96CEB4/FFFFFF?text=Drop",
  },
  {
    id: "5",
    name: "Athletic Performance",
    creator: "@sport_brand",
    date: "Sunday, Dec 22 2:00 PM PST",
    views: 1876,
    image: "https://via.placeholder.com/80/FFEAA7/FFFFFF?text=Drop",
  },
  {
    id: "6",
    name: "Evening Collection",
    creator: "@luxury_fashion",
    date: "Wednesday, Dec 25 9:00 PM PST",
    views: 3124,
    image: "https://via.placeholder.com/80/DDA0DD/FFFFFF?text=Drop",
  },
];

const DropItem = ({ drop }: { drop: Drop }) => (
  <View className="flex-row items-center mb-2">
    <View className="w-40 h-24 rounded-xl bg-gray-300 mr-4"></View>
    <View className="flex-1">
      <Text className="text-sm text-gray-500 mb-1">{drop.date}</Text>
      <Text className="text-base font-semibold mb-1">{drop.name}</Text>
      <Text className="text-sm text-gray-600 mb-1">by {drop.creator}</Text>
      <Text className="text-xs text-gray-400">
        {drop.views.toLocaleString()} views
      </Text>
    </View>
  </View>
);

export default function DropTrackerScreen() {
  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/(drops)/drops");
    }, [])
  );

  return (
    <ScrollView className="flex-1 bg-transparent">
      <View className="px-4">
        {/* Recent Drops Section */}
        <View className="mb-4">
          <View className="flex-row items-center gap-4 mb-4">
            <Text className="text-xl font-bold">RECENT</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(drops)/[drops]",
                  params: { drops: "recent" },
                })
              }
            >
              <Text className="text-sm font-bold">SEE MORE ›</Text>
            </TouchableOpacity>
          </View>
          <View className="space-y-6">
            {recentDrops.map((drop) => (
              <DropItem key={drop.id} drop={drop} />
            ))}
          </View>
        </View>

        {/* Upcoming Drops Section */}
        <View>
          <View className="flex-row items-center gap-4 mb-4">
            <Text className="text-xl font-bold">UPCOMING</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(drops)/[drops]",
                  params: { drops: "upcoming" },
                })
              }
            >
              <Text className="text-sm font-bold">SEE MORE ›</Text>
            </TouchableOpacity>
          </View>
          <View className="space-y-6">
            {upcomingDrops.map((drop) => (
              <DropItem key={drop.id} drop={drop} />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
