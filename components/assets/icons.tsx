import { AntDesign, Feather } from "@expo/vector-icons";
import React from "react";

interface IconProps {
  color: string;
  size?: number;
}

export const icons: Record<string, React.FC<IconProps>> = {
  index: ({ color, size = 20 }) => (
    <AntDesign name="home" size={size} color={color} />
  ),
  "(collections)": ({ color, size = 20 }) => (
    <Feather name="grid" size={size} color={color} />
  ),
  "(drops)": ({ color, size = 20 }) => (
    <Feather name="clock" size={size} color={color} />
  ),
  archive: ({ color, size = 20 }) => (
    <Feather name="archive" size={size} color={color} />
  ),
  "style-quiz": ({ color, size = 20 }) => (
    <Feather name="help-circle" size={size} color={color} />
  ),
  user: ({ color, size = 20 }) => (
    <Feather name="user" size={size} color={color} />
  ),
  "(user)": ({ color, size = 20 }) => (
    <Feather name="user" size={size} color={color} />
  ),
  default: ({ color, size = 20 }) => (
    <AntDesign name="question" size={size} color={color} />
  ),
};
