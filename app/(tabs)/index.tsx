import { Image } from "expo-image";
import React from "react";
import { Dimensions, FlatList } from "react-native";

const { height: screenHeight } = Dimensions.get("window");

const mediaItems = [
  { id: "3", source: require("@/assets/media/watch.jpg") },
  { id: "1", source: require("@/assets/media/C74p7_SSAqK_1.jpg") },
  { id: "2", source: require("@/assets/media/DCHxFYqo_xv.jpg") },
  
];

const renderMediaItem = ({ item }: { item: (typeof mediaItems)[0] }) => (
  <Image
    source={item.source}
    className="w-full h-full"
    style={{ height: screenHeight }}
    contentFit="cover"
  />
);

export default function HomeScreen() {
  return (
    <FlatList
      data={mediaItems}
      renderItem={renderMediaItem}
      keyExtractor={(item) => item.id}
      pagingEnabled={true}
      showsVerticalScrollIndicator={false}
      snapToInterval={screenHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      className="flex-1"
    />
  );
}
