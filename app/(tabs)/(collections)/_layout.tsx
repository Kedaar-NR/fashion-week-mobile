import { Stack } from "expo-router";

export default function CollectionsLayout() {
  return (
    <Stack>
      <Stack.Screen name="collection" options={{ headerShown: false }} />
      <Stack.Screen name="[collection]" options={{ headerShown: false }} />
    </Stack>
  );
}
