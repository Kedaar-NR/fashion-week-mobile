import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { Text, View } from "react-native";

export default function EditProfileScreen() {
  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/(user)/edit-profile");
    }, [])
  );

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-lg font-semibold">edit-profile</Text>
    </View>
  );
}
