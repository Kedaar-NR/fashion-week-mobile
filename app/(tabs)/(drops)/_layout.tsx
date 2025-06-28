import { Stack } from "expo-router";

export default function DropsLayout() {
  return (
    <Stack>
      <Stack.Screen name="drops" options={{ headerShown: false }} />
      <Stack.Screen name="[drops]" options={{ headerShown: false }} />
    </Stack>
  );
}
