import React, { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { IconSymbol } from "./IconSymbol";

interface TabBarButtonProps {
  className?: string;
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  color: string;
  label: string;
}

// Icon mapping for each tab
const getIconName = (
  routeName: string
):
  | "house.fill"
  | "heart.fill"
  | "bell.fill"
  | "person.fill"
  | "questionmark.circle.fill" => {
  switch (routeName) {
    case "index":
      return "house.fill";
    case "(collections)":
      return "heart.fill";
    case "(drops)":
      return "bell.fill";
    case "(user)":
      return "person.fill";
    default:
      return "questionmark.circle.fill";
  }
};

const TabBarButton: React.FC<TabBarButtonProps> = (props) => {
  const { isFocused, label, color, className, routeName } = props;

  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, { duration: 350 });
  }, [isFocused]);

  const animatedTextStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scale.value, [0, 1], [1, 1.1]);
    const translateY = interpolate(scale.value, [0, 1], [0, -6]);
    // Use string weights; numeric interpolation is unreliable on RN
    const weight = scale.value > 0.5 ? "600" : "400";
    return {
      transform: [{ scale: scaleValue }, { translateY }],
      fontWeight: weight as "400" | "600",
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [0, 1]);
    const scaleValue = interpolate(scale.value, [0, 1], [0.8, 1]);
    return {
      opacity,
      transform: [{ scale: scaleValue }],
    };
  });

  const isDropRadar = label === "DROP RADAR";

  return (
    <Pressable
      {...props}
      className={`flex-1 justify-center items-center py-3 pr-1.5 ${className || ""}`}
      // Make this a positioning context so the icon doesn't affect layout
      style={{ position: "relative" }}
    >
      {/* Text - perfectly centered when inactive */}
      <Animated.View style={animatedTextStyle}>
        {isDropRadar ? (
          <Animated.Text
            style={{
              color,
              fontSize: 12,
              textAlign: "center",
              lineHeight: 14,
            }}
          >
            DROP{"\n"}RADAR
          </Animated.Text>
        ) : (
          <Animated.Text
            style={{
              color,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {label}
          </Animated.Text>
        )}
      </Animated.View>

      {/* Icon appears below text only when active; does not reserve layout space */}
      <Animated.View
        pointerEvents="none"
        style={[
          animatedIconStyle,
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 2, // tweak as desired
            alignItems: "center",
          },
        ]}
      >
        <IconSymbol size={12} name={getIconName(routeName)} color={color} />
      </Animated.View>
    </Pressable>
  );
};

export default TabBarButton;
