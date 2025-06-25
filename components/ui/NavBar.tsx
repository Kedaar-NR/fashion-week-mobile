import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export function NavBar() {
  const colorScheme = useColorScheme();
  const iconColor =
    colorScheme === "light" ? Colors.light.icon : Colors.dark.icon;

  const handleMenuPress = () => {
    // TODO: Implement menu functionality
    console.log("Menu pressed");
  };

  const handleSearchPress = () => {
    // TODO: Implement search functionality
    console.log("Search pressed");
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleMenuPress}>
        <View style={styles.hamburgerContainer}>
          <View
            style={[styles.hamburgerLine, { backgroundColor: iconColor }]}
          />
          <View
            style={[styles.hamburgerLine, { backgroundColor: iconColor }]}
          />
          <View
            style={[styles.hamburgerLine, { backgroundColor: iconColor }]}
          />
        </View>
      </TouchableOpacity>
      <ThemedText style={[styles.title, { fontFamily: 'Kanit-Bold' }]}>fashion:week</ThemedText>
    
      <TouchableOpacity style={styles.button} onPress={handleSearchPress}>
        <IconSymbol name="magnifyingglass" size={20} color={iconColor} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  button: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  hamburgerContainer: {
    width: 16,
    height: 12,
    justifyContent: "space-between",
  },
  hamburgerLine: {
    height: 2,
    width: "100%",
    borderRadius: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
