import { Stack } from "expo-router";

export default function ArchiveLayout() {
  return (
    <Stack>
      <Stack.Screen name="archive" options={{ headerShown: false }} />
      <Stack.Screen name="[brand]" options={{ headerShown: false }} />
    </Stack>
  );
}
