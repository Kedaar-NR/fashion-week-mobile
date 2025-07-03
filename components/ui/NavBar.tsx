import { router, usePathname } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useColorScheme } from "../../hooks/useColorScheme";
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
  const isHome = pathname === "/";
  const iconColor = isHome ? (invertTitle ? "#222" : "#fff") : "#222";
  const titleColor = isHome ? (invertTitle ? "#222" : "#fff") : "#222";
  const appTitle = customTitle || "fashion:week";
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
    <View
      className="flex-row items-center justify-between px-4 py-3 pt-16"
      style={{
        backgroundColor: "transparent",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
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
          {showBackButton ? (
            <TouchableOpacity
              className="w-11 h-11 justify-center items-center"
              onPress={onBack}
              style={{ zIndex: 10 }}
              accessibilityLabel="Back"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol name="chevron.left" size={24} color={iconColor} />
            </TouchableOpacity>
          ) : (
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
          )}

          <Text
            className="text-lg font-semibold tracking-wider"
            style={{ color: titleColor }}
          >
            {appTitle}
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
