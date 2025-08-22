import { Stack } from "expo-router";

export default function FriendsLayout() {
  return (
    <Stack>
      <Stack.Screen name="friends" options={{ headerShown: false }} />
      <Stack.Screen name="[friend]" options={{ headerShown: false }} />
    </Stack>
  );
}
