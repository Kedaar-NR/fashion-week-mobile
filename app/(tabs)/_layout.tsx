import { IconSymbol } from "@/components/ui/IconSymbol";
import { NavBar } from "@/components/ui/NavBar";
import TabBar from "@/components/ui/TabBar";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <NavBar />
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}

        // screenOptions={{
        //   tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        //   headerShown: false,
        //   tabBarButton: HapticTab,
        //   tabBarBackground: TabBarBackground,
        //   tabBarStyle: Platform.select({
        //     ios: {
        //       // Use a transparent background on iOS to show the blur effect
        //       position: "absolute",
        //     },
        //     default: {},
        //   }),
        // }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={20} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(collections)"
          options={{
            title: "Collection",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={20} name="heart.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(drops)"
          options={{
            title: "Drops",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={20} name="bell.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="user"
          options={{
            title: "Account",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={20} name="person.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search-results"
          options={{
            title: "Search Results",
            headerShown: false,
            href: null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={20} name="magnifyingglass" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="archive"
          options={{
            title: "Archive",
            headerShown: false,
            href: null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={20} name="person.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="style-quiz"
          options={{
            title: "Style Quiz",
            headerShown: false,
            href: null,
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
