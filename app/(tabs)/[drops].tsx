import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function DropsDetailScreen() {
  const { drops } = useLocalSearchParams<{ drops: string }>();

  // If the drops parameter is "recents", show "RECENTS", if "upcoming" show "UPCOMING"
  const displayText =
    drops === "recents"
      ? "RECENTS"
      : drops === "upcoming"
        ? "UPCOMING"
        : drops?.toUpperCase();

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
