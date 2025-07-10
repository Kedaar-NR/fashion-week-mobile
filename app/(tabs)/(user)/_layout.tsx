import { Stack } from "expo-router";

export default function UserLayout() {
  return (
    <Stack>
      <Stack.Screen name="user" options={{ headerShown: false }} />
      <Stack.Screen name="pinnedCollections" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="recently-purchased" options={{ headerShown: false }} />
      <Stack.Screen name="add-friends" options={{ headerShown: false }} />
    </Stack>
  );
}