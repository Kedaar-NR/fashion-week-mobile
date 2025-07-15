import { useColorScheme } from "@/hooks/useColorScheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
// import { Session } from "@supabase/supabase-js"; // commented out for dev
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-reanimated";
import "../global.css";
// import { supabase } from "../lib/supabase"; // commented out for dev

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  /*
  // --- ORIGINAL SESSION/AUTH LOGIC (commented out for dev convenience) ---
  const [session, setSession] = useState<Session | null>(null);
  const prevSessionString = useRef<string | null>(null);

  // Auto sign-in for development if not already signed in
  useEffect(() => {
    if (!session && __DEV__) {
      supabase.auth.signInWithPassword({
        email: "test@example.com",
        password: "testpassword",
      });
    }
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionString = JSON.stringify(session);
      if (prevSessionString.current !== sessionString) {
        setSession(session);
        prevSessionString.current = sessionString;
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const sessionString = JSON.stringify(session);
        if (prevSessionString.current !== sessionString) {
          setSession(session);
          prevSessionString.current = sessionString;
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  if (!session) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Auth />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }
  */

  // DEV ONLY: Always show main app, skip Auth and session logic
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
