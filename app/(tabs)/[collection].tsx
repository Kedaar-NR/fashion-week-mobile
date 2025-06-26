import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function CollectionDetailScreen() {
  const { collection } = useLocalSearchParams<{ collection: string }>();

  return (
    <View style={styles.container}>
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-bold">{collection?.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
