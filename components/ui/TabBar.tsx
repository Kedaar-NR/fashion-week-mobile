import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { View } from "react-native";
import TabBarButton from "./TabBarButton";

const TabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const primaryColor = "#0891b2";
  const greyColor = "#737373";
  return (
    <View className="absolute bottom-6 left-5 right-5 flex-row justify-between items-center bg-white mx-5 py-2 rounded-3xl shadow-sm">
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        if (["_sitemap", "+not-found"].includes(route.name)) return null;

        // Hide tabs where href is null
        if ((options as any).href === null) return null;

        // Hide tabs where tabBarItemStyle.display is "none"
        if (
          options.tabBarItemStyle &&
          (options.tabBarItemStyle as any).display === "none"
        )
          return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TabBarButton
            key={route.name}
            className="flex-1 items-center justify-center py-2"
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={route.name}
            color={isFocused ? primaryColor : greyColor}
            label={label as string}
          />
        );
      })}
    </View>
  );
};

export default TabBar;
