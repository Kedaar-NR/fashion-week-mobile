import { Tabs, usePathname } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { IconSymbol } from "../../components/ui/IconSymbol";
import { NavBar } from "../../components/ui/NavBar";
import TabBar from "../../components/ui/TabBar";

export default function TabLayout() {
  const pathname = usePathname();

  // Add top padding for all non-home pages
  const isHome = pathname === "/";

  return (
    <View style={styles.container}>
      <NavBar
      // Always show default NavBar
      />
      <View style={{ flex: 1 }}>
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
            name="(index)"
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
            name="archive"
            options={{
              title: "Archive",
              headerShown: false,
              href: null,
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
              headerShown: false,
              tabBarIcon: ({ color }) => (
                <IconSymbol size={20} name="bell.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="(user)"
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
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
