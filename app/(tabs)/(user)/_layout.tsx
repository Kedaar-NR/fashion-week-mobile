import { Stack } from "expo-router";

export default function UserLayout() {
  return (
    <Stack>
      <Stack.Screen name="user" options={{ headerShown: false }} />
      <Stack.Screen name="pinnedCollections" options={{ headerShown: false }} />
    </Stack>
  );
}
