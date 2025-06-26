import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function CollectionDetailScreen() {
  const { collection } = useLocalSearchParams<{ collection: string }>();

  // If the collection parameter is "all-liked", show "ALL LIKED", otherwise show the collection name
  const displayText =
    collection === "all-liked" ? "ALL LIKED" : collection?.toUpperCase();

  return (
    <View style={styles.container}>
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-bold">{displayText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
