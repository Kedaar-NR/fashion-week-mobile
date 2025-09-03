import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  usePathname,
  useSegments,
} from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from "@/lib/supabase";
import EventEmitter from "eventemitter3";
import { useColorScheme } from "../../hooks/useColorScheme";
import { IconSymbol } from "./IconSymbol";
// @ts-ignore
export const feedFilterEmitter = new EventEmitter();

const { width, height } = Dimensions.get("window");

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
  const { brand: brandParam } = useLocalSearchParams<{ brand?: string }>();
  const [brandTitle, setBrandTitle] = useState<string | null>(null);
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

  // Function to determine if current page should show back button
  const shouldShowBackButton = (path: string, segments: string[]): boolean => {
    // Pages that should show hamburger menu (all others show back button)
    const hamburgerPages = [
      "/",
      "/collection",
      "/style-quiz",
      "/drops",
      "/user",
    ];

    // Check if the path starts with any of the hamburger pages
    const shouldShowHamburger = hamburgerPages.some((page) => {
      if (page === "/") {
        return path === "/";
      }
      return path.startsWith(page);
    });

    // console.log("Should show hamburger:", shouldShowHamburger);
    return !shouldShowHamburger;
  };

  // Function to get page display name based on pathname
  const getPageDisplayName = (path: string, segments: string[]): string => {
    if (path === "/") {
      if (segments && segments.includes("(collections)")) return "LIBRARY";
      if (segments && segments.includes("(drops)")) return "DROP TRACKER";
      if (segments && segments.includes("(user)")) return "ACCOUNT";
      return "fashion:week";
    }
    // Brand detail page: show unsanitized brand name from DB when available
    if (brandParam) {
      if (brandTitle && brandTitle.trim().length > 0) return brandTitle;
      // Fallback to route param if DB value not yet loaded
      const rawParam = Array.isArray(brandParam)
        ? brandParam[0]
        : brandParam || "";
      // Display the raw param (unsanitized), but trim slashes and extension artifacts
      const safe = rawParam.replace(/^\/+|\/+$/g, "").replace(/\.[^/.]+$/, "");
      return safe || "BRAND";
    }
    if (path.includes("/collection")) return "LIBRARY";
    if (path.includes("/drops")) return "DROP TRACKER";
    if (path.includes("/user")) return "ACCOUNT";
    if (path.includes("/archive")) return "ARCHIVE";
    if (path.includes("/style-quiz")) return "STYLE QUIZ";
    if (path.includes("/search-results")) return "SEARCH RESULTS";
    if (segments && segments.includes("[friend]")) return "FRIENDS";
    console.log("segments", segments);
    console.log("path", path);

    // Default fallback
    return path.split("/").slice(-1)[0].toUpperCase();
  };

  const pageDisplayName = getPageDisplayName(pathname, segments);

  // Fetch original brand name for brand page
  useEffect(() => {
    const isBrandPage =
      !!brandParam || (pathname || "").includes("/(tabs)/[brand]");
    if (!isBrandPage) {
      if (brandTitle !== null) setBrandTitle(null);
      return;
    }

    const rawParam = Array.isArray(brandParam)
      ? brandParam[0]
      : brandParam || "";
    const mediaFilepath = rawParam
      .replace(/^\/+|\/+$/g, "")
      .replace(/\.[^/.]+$/, "");
    if (!mediaFilepath) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("brand")
          .select("brand_name")
          .eq("media_filepath", mediaFilepath)
          .single();
        if (!cancelled) {
          if (!error && data?.brand_name) {
            setBrandTitle(data.brand_name);
          } else {
            setBrandTitle(null);
          }
        }
      } catch (_e) {
        if (!cancelled) setBrandTitle(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [segments, brandParam]);

  // Determine if we should show back button based on current page
  const shouldShowBack =
    showBackButton || shouldShowBackButton(pathname, segments);

  // Set icon color based on current page
  const iconColor = pageDisplayName === "fashion:week" ? "#FFFFFF" : "#000000"; // White on homepage, black elsewhere

  const [searchActive, setSearchActive] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchMenuOpen, setSearchMenuOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Close dropdown when page changes
  useFocusEffect(
    React.useCallback(() => {
      if (menuOpen) {
        setMenuOpen(false);
      }
      if (searchMenuOpen) {
        setSearchMenuOpen(false);
      }
      if (searchActive) {
        setSearchActive(false);
      }
    }, [pathname])
  );

  const handleMenuPress = () => {
    setMenuOpen(!menuOpen);
  };

  // Dummy data for recent product pages
  const recentProductPages = [
    {
      id: 1,
      name: "Nike Air Max 270",
      brand: "Nike",
      price: "$150",
      image: "https://via.placeholder.com/80x80",
    },
    {
      id: 2,
      name: "Adidas Ultraboost 22",
      brand: "Adidas",
      price: "$180",
      image: "https://via.placeholder.com/80x80",
    },
    {
      id: 3,
      name: "Puma RS-X 3D",
      brand: "Puma",
      price: "$110",
      image: "https://via.placeholder.com/80x80",
    },
  ];

  // State for recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Fetch recent searches on component mount
  useEffect(() => {
    const fetchRecentSearches = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const { data, error } = await supabase
            .from("recent_search_queries")
            .select("search_query")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (error) {
            console.error("Error fetching recent searches:", error.message);
          } else if (data && data.length > 0) {
            setRecentSearches(data.map((item: any) => item.search_query));
          }
        }
      } catch (error) {
        console.error("Error fetching recent searches:", error);
      }
    };
    fetchRecentSearches();
    console.log("recentSearches", recentSearches);
  }, []);

  // Dummy data for recent brands
  const recentBrands = [
    {
      id: 1,
      name: "Nike",
      tagline: "Just Do It",
    },
    {
      id: 2,
      name: "Adidas",
      tagline: "Impossible Is Nothing",
    },
  ];

  const getMenuOptions = (pageName: string) => {
    switch (pageName) {
      case "fashion:week":
        return [
          {
            label: "BRANDS",
            onPress: () => {
              // Switch home feed to Brands mode
              feedFilterEmitter.emit("mode", "brands");
              feedFilterEmitter.emit("filter", "all");
              setMenuOpen(false);
            },
          },
          {
            label: "PRODUCTS",
            onPress: () => {
              // Switch home feed to Products mode
              feedFilterEmitter.emit("mode", "products");
              setMenuOpen(false);
            },
          },
          {
            label: "FOLLOWING",
            onPress: () => {
              // Show only followed brands content on home feed
              feedFilterEmitter.emit("mode", "brands");
              feedFilterEmitter.emit("filter", "liked");
              setMenuOpen(false);
            },
          },
          {
            label: "FEATURED",
            onPress: () => {
              router.push("/(tabs)/style-quiz");
              setMenuOpen(false);
            },
          },
        ];
      case "LIBRARY":
        return [
          {
            label: "CREATE COLLECTION",
            onPress: () => {
              console.log("Create collection pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "IMPORT ITEMS",
            onPress: () => {
              console.log("Import items pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "EXPORT DATA",
            onPress: () => {
              console.log("Export data pressed");
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
            label: "SET REMINDERS",
            onPress: () => {
              console.log("Set reminders pressed");
              setMenuOpen(false);
            },
          },
          {
            label: "VIEW CALENDAR",
            onPress: () => {
              console.log("View calendar pressed");
              setMenuOpen(false);
            },
          },
        ];
      case "ACCOUNT":
        return [
          {
            label: "EDIT PROFILE",
            onPress: () => {
              router.push("/(tabs)/(user)/edit-profile");
              setMenuOpen(false);
            },
          },
          {
            label: "ADD FRIENDS",
            onPress: () => {
              router.push("/(tabs)/(user)/add-friends");
              setMenuOpen(false);
            },
          },
          {
            label: "LOG OUT",
            onPress: () => {
              supabase.auth.signOut();
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
    setSearchMenuOpen(true);
    setSearchActive(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSearchMenuClose = () => {
    setSearchMenuOpen(false);
    setSearchActive(false);
    setSearchText("");
    Keyboard.dismiss();
  };

  const handleCancelSearch = () => {
    setSearchMenuOpen(false);
    setSearchActive(false);
    setSearchText("");
    Keyboard.dismiss();
  };

  const saveRecentSearch = async (searchTerm: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase.from("recent_search_queries").insert({
          user_id: session.user.id,
          search_query: searchTerm,
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error("Error saving recent search:", error.message);
        } else {
          // Update local state to include the new search
          setRecentSearches((prev) =>
            [searchTerm, ...prev.filter((s) => s !== searchTerm)].slice(0, 5)
          );
        }
      }
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      router.push({
        pathname: "/(tabs)/search-results",
        params: { query: searchText.trim() },
      });
      setSearchMenuOpen(false);
      saveRecentSearch(searchText.trim());
      setSearchText("");
      Keyboard.dismiss();
    }
  };

  const handleRecentSearchPress = (searchTerm: string) => {
    router.push({
      pathname: "/(tabs)/search-results",
      params: { query: searchTerm },
    });
    setSearchMenuOpen(false);
  };

  const handleRecentProductPress = (product: any) => {
    // Navigate to product page (placeholder for now)
    console.log("Navigate to product:", product.name);
    setSearchMenuOpen(false);
  };

  const handleRecentBrandPress = (brand: any) => {
    // Navigate to brand page
    router.push({
      pathname: "/(tabs)/[brand]",
      params: { brand: brand.name.toLowerCase() },
    });
    setSearchMenuOpen(false);
  };

  return (
    <View>
      {/* Top Nav Bar */}

      {pageDisplayName === "fashion:week" ? (
          <View
            className={`flex-row items-center justify-between px-4 py-3 pt-16 ${
              pageDisplayName === "fashion:week"
                ? "absolute top-0 left-0 right-0 z-50 bg-transparent"
                : "bg-transparent"
            }`}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            /> 
            {shouldShowBack && (
              <TouchableOpacity
                className="w-11 h-11 justify-center items-center"
                onPress={onBack || (() => router.back())}
              >
                <IconSymbol name="chevron.left" size={20} color={iconColor} />
              </TouchableOpacity>
            )}
            {!shouldShowBack && (
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
            )}

            <Text
              className={`text-lg font-semibold tracking-wider ${
                pageDisplayName === "fashion:week" ? "text-white" : "text-black"
              }`}
            >
              {customTitle || pageDisplayName}
            </Text>

            <TouchableOpacity
              className="w-11 h-11 justify-center items-center"
              onPress={handleSearchPress}
            >
              <IconSymbol name="magnifyingglass" size={20} color={iconColor} />
            </TouchableOpacity>
          </View>
      ) : (
        <View
          className={`flex-row items-center justify-between px-4 py-3 pt-16 ${
            pageDisplayName === "fashion:week"
              ? "absolute top-0 left-0 right-0 z-50 bg-transparent"
              : "bg-transparent"
          }`}
        >
          {shouldShowBack && (
            <TouchableOpacity
              className="w-11 h-11 justify-center items-center"
              onPress={onBack || (() => router.back())}
            >
              <IconSymbol name="chevron.left" size={20} color={iconColor} />
            </TouchableOpacity>
          )}
          {!shouldShowBack && (
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
          )}

          <Text
            className={`text-lg font-semibold tracking-wider ${
              pageDisplayName === "fashion:week" ? "text-white" : "text-black"
            }`}
          >
            {customTitle || pageDisplayName}
          </Text>

          <TouchableOpacity
            className="w-11 h-11 justify-center items-center"
            onPress={handleSearchPress}
          >
            <IconSymbol name="magnifyingglass" size={20} color={iconColor} />
          </TouchableOpacity>
        </View>
      )}

      {/* <View
        className={`flex-row items-center justify-between px-4 py-3 pt-16 ${pageDisplayName === "fashion:week" ? "absolute top-0 left-0 right-0 z-50 bg-transparent" : "bg-transparent"}`}
      >
        {shouldShowBack && (
          <TouchableOpacity
            className="w-11 h-11 justify-center items-center"
            onPress={onBack || (() => router.back())}
          >
            <IconSymbol name="chevron.left" size={20} color={iconColor} />
          </TouchableOpacity>
        )}
        {!shouldShowBack && (
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
        )}

        <Text
          className={`text-lg font-semibold tracking-wider ${pageDisplayName === "fashion:week" ? "text-white" : "text-black"}`}
        >
          {customTitle || pageDisplayName}
        </Text>

        <TouchableOpacity
          className="w-11 h-11 justify-center items-center"
          onPress={handleSearchPress}
        >
          <IconSymbol name="magnifyingglass" size={20} color={iconColor} />
        </TouchableOpacity>
      </View> */}

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
              <Text
                className={`text-sm font-bold ${
                  pageDisplayName === "fashion:week"
                    ? "text-white"
                    : "text-black"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Full Screen Search Menu */}
      {searchMenuOpen && (
        <View
          className="absolute inset-0 bg-white z-50"
          style={{ width, height }}
        >
          {/* Header with Search Bar */}
          <View className="flex-row items-center justify-between px-4 py-3 pt-16">
            {searchActive ? (
              <View className="flex-1 flex-row items-center gap-2 h-11">
                <TextInput
                  ref={inputRef}
                  className="flex-1 h-9 rounded-lg px-3 text-base text-gray-900 bg-gray-100"
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search..."
                  placeholderTextColor="#999"
                  autoFocus={true}
                  returnKeyType="search"
                  onSubmitEditing={handleSearchSubmit}
                />
                <TouchableOpacity
                  className="ml-2 px-2 py-1"
                  onPress={handleCancelSearch}
                >
                  <IconSymbol name="chevron.left" size={20} color="#000000" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  className="w-11 h-11 justify-center items-center"
                  onPress={handleSearchMenuClose}
                >
                  <IconSymbol name="xmark" size={20} color="#000000" />
                </TouchableOpacity>
                <Text className="text-lg font-semibold tracking-wider text-black">
                  SEARCH
                </Text>
                <View className="w-11" />
              </>
            )}
          </View>

          {/* Continue Shopping Section */}
          <View className="px-4 mb-8">
            <Text className="text-lg font-bold text-black mb-4">
              Continue Shopping
            </Text>
            <View className="flex-row gap-4">
              {recentProductPages.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  className="flex-1"
                  onPress={() => handleRecentProductPress(product)}
                >
                  <View className="w-full h-32 bg-gray-200 rounded-lg mb-2 overflow-hidden">
                    <View className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg" />
                  </View>
                  <Text
                    className="text-sm font-semibold text-black mb-1"
                    numberOfLines={1}
                  >
                    {product.name}
                  </Text>
                  <Text className="text-xs text-gray-600 mb-1">
                    {product.brand}
                  </Text>
                  <Text className="text-sm font-bold text-black">
                    {product.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Searches Section */}
          <View className="px-4 mb-8">
            <Text className="text-lg font-bold text-black mb-4">
              Recently Searched
            </Text>
            <View className="space-y-3">
              {recentSearches.map((searchTerm, index) => (
                <TouchableOpacity
                  key={index}
                  className="py-3 border-b border-gray-200"
                  onPress={() => handleRecentSearchPress(searchTerm)}
                >
                  <Text className="text-base text-gray-800">{searchTerm}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Brands Section */}
          <View className="px-4">
            <Text className="text-lg font-bold text-black mb-4">
              Recent Brands
            </Text>
            <View className="space-y-3">
              {recentBrands.map((brand) => (
                <TouchableOpacity
                  key={brand.id}
                  className="py-3 border-b border-gray-200"
                  onPress={() => handleRecentBrandPress(brand)}
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-gray-200 rounded-full mr-4 overflow-hidden">
                      <View className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-full" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-800 mb-1">
                        {brand.name}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {brand.tagline}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
