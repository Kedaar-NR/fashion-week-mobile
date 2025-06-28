import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { Text, View } from "react-native";

export default function StyleQuizScreen() {
  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/style-quiz");
    }, [])
  );

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-2xl font-bold">Style Quiz</Text>
    </View>
  );
}
