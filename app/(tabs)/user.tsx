import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function UserScreen() {
  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/user");
    }, [])
  );

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-2xl font-bold mb-8">USER PROFILE</Text>

      {/* Archive Button */}
      <TouchableOpacity
        className="bg-gray-800 px-6 py-3 rounded-lg mb-4 w-48"
        onPress={() => router.push("/(tabs)/archive")}
      >
        <Text className="text-white text-center font-semibold">Archive</Text>
      </TouchableOpacity>

      {/* Style Quiz Button */}
      <TouchableOpacity
        className="bg-gray-800 px-6 py-3 rounded-lg w-48"
        onPress={() => router.push("/(tabs)/style-quiz")}
      >
        <Text className="text-white text-center font-semibold">Style Quiz</Text>
      </TouchableOpacity>
    </View>
  );
}
