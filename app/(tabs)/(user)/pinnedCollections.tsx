import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Collection {
    id: string;
    name: string;
    description: string;
    itemCount: number;
    image: string;
  }

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function CollectionDetailScreen() {
  const [collections] = useState<Collection[]>(mockCollections);


  useFocusEffect(
    React.useCallback(() => {
      console.log(`📍 Current path: /(tabs)/(user)/pinnedCollections`);
      console.log(`📍 Collection parameter: ${collection}`);
    }, [collection])
  );

  // If the collection parameter is "all-liked", show "ALL LIKED", otherwise show the collection name
  const displayText =
    collection === "all-liked" ? "ALL LIKED" : collection?.toUpperCase();

    const renderGridItem = ({ item }: { item: Collection }) => (
        <TouchableOpacity
          className="items-center"
          style={{ width: gridItemWidth }}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/(collections)/[collection]",
              params: { collection: item.name },
            })
          }
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

  return (
    <ScrollView className="flex-1 px-4">
      {/* Header Section */}
      <View className="flex-1">
        <View className="flex-row items-center gap-4 mb-4">
          <Text className="text-xl font-bold">COLLECTIONS</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text className="text-sm font-bold">FILTER+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}}>
            <Text className="text-sm font-bold">SORT BY+</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={collections}
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
