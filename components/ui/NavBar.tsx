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
import { supabase } from "@/lib/supabase";

// Define the structure for menu options
interface MenuOption {
  label: string;
  onPress: () => void;
}

// Default menu options for pages not explicitly configured
const defaultMenuOptions: MenuOption[] = [
  {
    label: "SETTINGS",
    onPress: () => {
      console.log("Default settings pressed");
      // Add your custom logic here
    },
  },
  {
    label: "HELP",
    onPress: () => {
      console.log("Default help pressed");
      // Add your custom logic here
    },
  },
];

export function NavBar() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const segments = useSegments();

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

  // Close menu when pathname changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleMenuPress = () => {
    setMenuOpen(!menuOpen);
  };

  const handleSearchPress = () => {
    setSearchActive(true);
    setMenuOpen(false);
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

  // Logout handler
  const handleLogout = async () => {
    console.log("Logout pressed");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
      } else {
        console.log("Successfully signed out");
      }
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  // Get menu options for current page with dynamic handlers
  const getCurrentMenuOptions = (): MenuOption[] => {
    const baseConfigs = {
      "fashion:week": [
        {
          label: "ADD FRIENDS",
          onPress: () => {
            console.log("Add friends pressed on homepage");
            // Add your custom logic here
          },
        },
        {
          label: "SETTINGS",
          onPress: () => {
            console.log("Settings pressed on homepage");
            // Add your custom logic here
          },
        },
        {
          label: "ABOUT",
          onPress: () => {
            console.log("About pressed on homepage");
            // Add your custom logic here
          },
        },
      ],
      COLLECTIONS: [
        {
          label: "CREATE COLLECTION",
          onPress: () => {
            console.log("Create collection pressed");
            // Add your custom logic here
          },
        },
        {
          label: "SHARE COLLECTION",
          onPress: () => {
            console.log("Share collection pressed");
            // Add your custom logic here
          },
        },
        {
          label: "SETTINGS",
          onPress: () => {
            console.log("Settings pressed on collections");
            // Add your custom logic here
          },
        },
      ],
      "DROP TRACKER": [
        {
          label: "ADD NEW DROP",
          onPress: () => {
            console.log("Add new drop pressed");
            // Add your custom logic here
          },
        },
        {
          label: "DROP HISTORY",
          onPress: () => {
            console.log("Drop history pressed");
            // Add your custom logic here
          },
        },
        {
          label: "NOTIFICATIONS",
          onPress: () => {
            console.log("Notifications pressed");
            // Add your custom logic here
          },
        },
      ],
      ACCOUNT: [
        {
          label: "EDIT PROFILE",
          onPress: () => {
            console.log("Edit profile pressed");
            router.push("/(tabs)/(user)/edit-profile");
            setMenuOpen(false);
          },
        },
        {
          label: "PRIVACY SETTINGS",
          onPress: () => {
            console.log("Privacy settings pressed");
            router.push("/(tabs)/(user)/settings");
            setMenuOpen(false);
          },
        },
        {
          label: "LOGOUT",
          onPress: handleLogout,
        },
      ],
      ARCHIVE: [
        {
          label: "CLEAR ARCHIVE",
          onPress: () => {
            console.log("Clear archive pressed");
            // Add your custom logic here
          },
        },
        {
          label: "EXPORT DATA",
          onPress: () => {
            console.log("Export data pressed");
            // Add your custom logic here
          },
        },
      ],
      "STYLE QUIZ": [
        {
          label: "RESTART QUIZ",
          onPress: () => {
            console.log("Restart quiz pressed");
            // Add your custom logic here
          },
        },
        {
          label: "VIEW RESULTS",
          onPress: () => {
            console.log("View results pressed");
            // Add your custom logic here
          },
        },
      ],
      "SEARCH RESULTS": [
        {
          label: "CLEAR SEARCH",
          onPress: () => {
            console.log("Clear search pressed");
            // Add your custom logic here
          },
        },
        {
          label: "SAVE SEARCH",
          onPress: () => {
            console.log("Save search pressed");
            // Add your custom logic here
          },
        },
      ],
    };

    return (
      baseConfigs[pageDisplayName as keyof typeof baseConfigs] ||
      defaultMenuOptions
    );
  };

  const currentMenuOptions = getCurrentMenuOptions();

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
          {currentMenuOptions.map((option, index) => (
            <TouchableOpacity key={index} onPress={option.onPress}>
              <Text className="px-4 py-1 text-sm font-bold">
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
