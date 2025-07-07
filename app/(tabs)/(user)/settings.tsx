import { IconSymbol } from "@/components/ui/IconSymbol";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/(user)/settings");
    }, [])
  );

  const handleBackPress = () => {
    router.back();
  };

  return (
    <View className="flex-1">
      {/* Back Button */}
      <TouchableOpacity
        className="w-11 h-11 justify-center items-center ml-4"
        onPress={handleBackPress}
      >
        <Text className="text-sm font-bold">BACK</Text>
      </TouchableOpacity>

      {/* Settings Content */}
      <View className="px-4 justify-center items-center">
        <Text className="text-2xl font-bold">SETTINGS</Text>
      </View>
    </View>
  );
}
