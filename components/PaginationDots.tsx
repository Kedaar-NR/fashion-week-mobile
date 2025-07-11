import React from "react";
import { View } from "react-native";

interface PaginationDotsProps {
  totalItems: number;
  currentIndex: number;
  dotSize?: number;
  dotSpacing?: number;
  activeColor?: string;
  inactiveColor?: string;
}

export default function PaginationDots({
  totalItems,
  currentIndex,
  dotSize = 6,
  dotSpacing = 8,
  activeColor = "#FFFFFF",
  inactiveColor = "rgba(255, 255, 255, 0.4)",
}: PaginationDotsProps) {
  if (totalItems <= 1) return null;

  return (
    <View className="flex-row items-center justify-center">
      {Array.from({ length: totalItems }, (_, index) => (
        <View
          key={index}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor:
              index === currentIndex ? activeColor : inactiveColor,
            marginHorizontal: dotSpacing / 2,
          }}
        />
      ))}
    </View>
  );
}
