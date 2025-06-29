import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { NavBar } from "@/components/ui/NavBar";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <NavBar />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: "absolute",
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={20} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(collections)"
          options={{
            title: "Collection",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={20} name="heart.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="archive"
          options={{
            title: "Archive",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={20} name="archivebox.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="style-quiz"
          options={{
            title: "Style Quiz",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={20}
                name="questionmark.circle.fill"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="(drops)"
          options={{
            title: "Drops",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={20} name="bell.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="user"
          options={{
            title: "Account",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={20} name="person.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
