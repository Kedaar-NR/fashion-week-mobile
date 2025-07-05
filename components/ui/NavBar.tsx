import { router, usePathname, useSegments } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
      if (segments && segments.includes("(user)")) return "ACCOUNT";
      return "fashion:week";
    }
    if (path.includes("/collection")) return "COLLECTIONS";
    if (path.includes("/drops")) return "DROP TRACKER";
    if (path.includes("/user")) return "ACCOUNT";
    if (path.includes("/archive")) return "ARCHIVE";
    if (path.includes("/style-quiz")) return "STYLE QUIZ";
    if (path.includes("/search-results")) return "SEARCH RESULTS";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Close menu when pathname changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleMenuPress = () => {
    setMenuOpen(!menuOpen);
  };

  const handleOption1 = () => {
    console.log("Option 1 pressed");
    setMenuOpen(false);
  };

  const handleOption2 = () => {
    console.log("Option 2 pressed");
    setMenuOpen(false);
  };

  const handleOption3 = () => {
    console.log("Option 3 pressed");
    setMenuOpen(false);
  };

  const handleSearchPress = () => {
    setSearchActive(true);
    setMenuOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100); // Ensure focus after render
  };

  const handleCancelSearch = () => {
    setSearchActive(false);
    setSearchText("");
    Keyboard.dismiss();
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      // Navigate to search results page with the query
      router.push({
        pathname: "/(tabs)/search-results",
        params: { query: searchText.trim() },
      });
      setSearchActive(false);
      setSearchText("");
      Keyboard.dismiss();
    }
  };

  return (
    <View>
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
              onSubmitEditing={handleSearchSubmit}
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
              {!menuOpen ? (
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
              ) : (
                <IconSymbol name="xmark" size={16} color={iconColor} />
              )}
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

      {/* Dropdown Menu */}
      {menuOpen && (
        <View
          className={`mx-4 mb-4 bg-transparent flex-col justify-start ${
            pageDisplayName === "fashion:week"
              ? "absolute top-0 left-0 right-0 z-40 mt-32"
              : ""
          }`}
        >
          <TouchableOpacity onPress={handleOption1}>
            <Text className="px-4 py-1 text-sm font-bold">ADD FRIENDS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOption2}>
            <Text className="px-4 py-1 text-sm font-bold">SETTINGS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOption3}>
            <Text className="px-4 py-1 text-sm font-bold">BLAH BLAH BLAH</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
