import { usePathname, useSegments } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";

export function NavBar() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  // console.log("pathname", pathname);
  const segments = useSegments();
  // console.log("segments", segments);
  // const isHomePage = pathname === "/";

  // Function to get page display name based on pathname
  const getPageDisplayName = (path: string, segments: string[]): string => {
    if (path === "/") {
      if (segments && segments.includes("(collections)")) return "COLLECTIONS";
      if (segments && segments.includes("(drops)")) return "DROP TRACKER";
      return "fashion:week";
    }
    if (path.includes("/collection")) return "COLLECTIONS";
    if (path.includes("/drops")) return "DROP TRACKER";
    if (path.includes("/user")) return "ACCOUNT";
    if (path.includes("/archive")) return "ARCHIVE";
    if (path.includes("/style-quiz")) return "STYLE QUIZ";
    console.log("path", path);

    // Default fallback
    return path.split("/").slice(-1)[0].toUpperCase();
  };

  const pageDisplayName = getPageDisplayName(pathname, segments);

  // Set icon color based on current page
  const iconColor = pageDisplayName === "fashion:week" ? "#FFFFFF" : "#000000"; // White on homepage, black elsewhere
  // console.log("isHomePage", isHomePage);

  const [searchActive, setSearchActive] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleMenuPress = () => {
    // TODO: Implement menu functionality
    console.log("Menu pressed");
  };

  const handleSearchPress = () => {
    setSearchActive(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100); // Ensure focus after render
  };

  const handleCancelSearch = () => {
    setSearchActive(false);
    setSearchText("");
    Keyboard.dismiss();
  };

  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 pt-16 ${pageDisplayName === "fashion:week" ? "absolute top-0 left-0 right-0 z-50 bg-transparent" : "bg-transparent"}`}
    >
      {searchActive ? (
        <View className="flex-1 flex-row items-center gap-2 h-11">
          <TextInput
            ref={inputRef}
            className="flex-1 h-9 rounded-lg px-3 text-base text-gray-900 bg-gray-100"
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search..."
            placeholderTextColor={colorScheme === "light" ? "#999" : "#aaa"}
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={() => {
              // TODO: Implement search submit
              console.log("Search for:", searchText);
            }}
          />
          <TouchableOpacity
            className="ml-2 px-2 py-1"
            onPress={handleCancelSearch}
          >
            <IconSymbol name="chevron.left" size={20} color={iconColor} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity
            className="w-11 h-11 justify-center items-center"
            onPress={handleMenuPress}
          >
            <View className="w-4 h-3 justify-between">
              <View
                className="h-0.5 w-full rounded-sm"
                style={{ backgroundColor: iconColor }}
              />
              <View
                className="h-0.5 w-full rounded-sm"
                style={{ backgroundColor: iconColor }}
              />
              <View
                className="h-0.5 w-full rounded-sm"
                style={{ backgroundColor: iconColor }}
              />
            </View>
          </TouchableOpacity>

          <Text
            className={`text-lg font-semibold tracking-wider ${pageDisplayName === "fashion:week" ? "text-white" : "text-black"}`}
          >
            {pageDisplayName}
          </Text>

          <TouchableOpacity
            className="w-11 h-11 justify-center items-center"
            onPress={handleSearchPress}
          >
            <IconSymbol name="magnifyingglass" size={20} color={iconColor} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
