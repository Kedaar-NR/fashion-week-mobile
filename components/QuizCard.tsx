import React from "react";
import { Animated, Image, Text, View } from "react-native";

interface QuizCardProps {
  imageUrl: string;
  panHandlers: any;
  pan: Animated.ValueXY;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  imageError: boolean;
  onImageError: () => void;
  cardKey: string;
  appearAnim: Animated.Value;
  appearScale: Animated.Value;
}

export default function QuizCard({
  imageUrl,
  panHandlers,
  pan,
  fadeAnim,
  scaleAnim,
  imageError,
  onImageError,
  appearAnim,
  appearScale,
}: QuizCardProps) {
  return (
    <Animated.View
      {...panHandlers}
      className="w-full h-full rounded-2xl overflow-hidden items-center justify-center"
      style={[
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            {
              rotate: pan.x.interpolate({
                inputRange: [-200, 0, 200],
                outputRange: ["-15deg", "0deg", "15deg"],
              }),
            },
            { scale: Animated.multiply(scaleAnim, appearScale) },
          ],
          opacity: Animated.multiply(fadeAnim, appearAnim),
        },
      ]}
    >
      {imageError ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Image not found</Text>
        </View>
      ) : (
        <>
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full rounded-2xl"
            style={{ resizeMode: "contain" }}
            onError={onImageError}
          />
        </>
      )}
    </Animated.View>
  );
}
