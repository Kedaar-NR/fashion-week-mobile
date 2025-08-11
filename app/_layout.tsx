import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import "react-native-reanimated";
import Auth from "../components/Auth";
import "../global.css";
import { useColorScheme } from "../hooks/useColorScheme";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  // --- RESTORE SESSION/AUTH LOGIC ---
  const [session, setSession] = useState<Session | null>(null);
  const prevSessionString = useRef<string | null>(null);

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
    return <Auth />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
