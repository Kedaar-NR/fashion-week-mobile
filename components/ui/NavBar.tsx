import { router, useFocusEffect, usePathname, useSegments } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useColorScheme } from "../../hooks/useColorScheme";
import { supabase } from "../../lib/supabase";
import { IconSymbol } from "./IconSymbol";

export function NavBar({
  customTitle,
  showBackButton,
  onBack,
  invertTitle,
}: {
  customTitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  invertTitle?: boolean;
} = {}) {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const segments = useSegments();
  // console.log("pathname", pathname);
  // console.log("segments", segments);

  useEffect(() => {
    console.log("🔍 NAVBAR MOUNT - pathname:", pathname, "segments:", segments);
  }, []);

  // useEffect(() => {
  //   console.log(
  //     "🔍 PATHNAME CHANGED - pathname:",
  //     pathname,
  //     "segments:",
  //     segments
  //   );
  // }, [pathname, segments]);

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

  const [searchActive, setSearchActive] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Close dropdown when page changes
  useFocusEffect(
    React.useCallback(() => {
      if (menuOpen) {
        setMenuOpen(false);
      }
    }, [pathname])
  );

  const handleMenuPress = () => {
    setMenuOpen(!menuOpen);
  };

  // Page-specific menu options
  const getMenuOptions = (pageName: string) => {
    switch (pageName) {
      case "fashion:week":
        return [
          {
            label: "BRANDS",
            onPress: () => {
              console.log("Add friends pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "PIECES",
            onPress: () => {
              console.log("Settings pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "FOLLOWING",
            onPress: () => {
              console.log("Share app pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "FEATURED",
            onPress: () => {
              console.log("Collections pressed");
              setMenuOpen(false);
            },
          },
        ];
      case "COLLECTIONS":
        return [
          {
            label: "CREATE COLLECTION",
            onPress: () => {
              console.log("Create collection pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "SORT BY",
            onPress: () => {
              console.log("Sort by pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "FILTER",
            onPress: () => {
              console.log("Filter pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "EXPORT",
            onPress: () => {
              console.log("Export pressed");
              setMenuOpen(false);
            },
          },
        ];
      case "DROP TRACKER":
        return [
          {
            label: "ADD DROP",
            onPress: () => {
              console.log("Add drop pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "SETTINGS",
            onPress: () => {
              console.log("Settings pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "NOTIFICATIONS",
            onPress: () => {
              console.log("Notifications pressed");
              setMenuOpen(false);
            },
          },
        ];
      case "ACCOUNT":
        return [
          {
            label: "EDIT PROFILE",
            onPress: () => {
              console.log("Edit profile pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "SETTINGS",
            onPress: () => {
              console.log("Settings pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "ADD FRIENDS",
            onPress: () => {
              router.push("/(tabs)/(user)/add-friends");
              console.log("Add friends pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "LOGOUT",
            onPress: async () => {
              console.log("Logout pressed");
              try {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  console.error("Error signing out:", error.message);
                } else {
                  console.log("Successfully signed out");
                  // Navigate to login or home page after logout
                  router.replace("/");
                }
              } catch (error) {
                console.error("Unexpected error during logout:", error);
              }
              setMenuOpen(false);
            },
          },
        ];
      case "ARCHIVE":
        return [
          {
            label: "RESTORE ITEMS",
            onPress: () => {
              console.log("Restore items pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "CLEAR ARCHIVE",
            onPress: () => {
              console.log("Clear archive pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "EXPORT",
            onPress: () => {
              console.log("Export pressed");
              setMenuOpen(false);
            },
          },
        ];
      case "STYLE QUIZ":
        return [
          {
            label: "RESTART QUIZ",
            onPress: () => {
              console.log("Restart quiz pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "VIEW RESULTS",
            onPress: () => {
              console.log("View results pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "SHARE RESULTS",
            onPress: () => {
              console.log("Share results pressed");
              setMenuOpen(false);
            },
          },
        ];
      case "SEARCH RESULTS":
        return [
          {
            label: "SAVE SEARCH",
            onPress: () => {
              console.log("Save search pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "FILTER RESULTS",
            onPress: () => {
              console.log("Filter results pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "SORT BY",
            onPress: () => {
              console.log("Sort by pressed");
              setMenuOpen(false);
            },
          },
        ];
      default:
        return [
          {
            label: "SETTINGS",
            onPress: () => {
              console.log("Settings pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "HELP",
            onPress: () => {
              console.log("Help pressed");
              setMenuOpen(false);
            },
          },
        ];
    }
  };

  const menuOptions = getMenuOptions(pageDisplayName);

  const handleSearchPress = () => {
    setSearchActive(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleCancelSearch = () => {
    setSearchActive(false);
    setSearchText("");
    Keyboard.dismiss();
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
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
          className={`mx-4 mb-4 bg-transparent ${
            pageDisplayName === "fashion:week"
              ? "absolute top-32 left-0 right-0 z-40"
              : ""
          }`}
        >
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={option.onPress}
              className="py-2"
            >
              <Text className="text-sm font-bold">{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
