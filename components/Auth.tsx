import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState<"landing" | "signin" | "signup">("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    // Optionally, you can store the username in a user profile table after sign up
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: username } },
    });
    if (error) Alert.alert(error.message);
    if (!session)
      Alert.alert("Please check your inbox for email verification!");
    setLoading(false);
  }

  if (mode === "landing") {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-3xl font-bold mb-8">Welcome to Fashion Week</Text>
        <Button title="Sign In" onPress={() => setMode("signin")} />
        <View className="h-4" />
        <Button title="Sign Up" onPress={() => setMode("signup")} />
      </View>
    );
  }

  if (mode === "signin") {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-2xl font-bold mb-6">Sign In</Text>
        <TextInput
          className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Sign In" onPress={signInWithEmail} disabled={loading} />
        <View className="h-2" />
        <Button
          title="Back"
          onPress={() => setMode("landing")}
          disabled={loading}
        />
      </View>
    );
  }

  // Sign Up
  return (
    <View className="flex-1 justify-center items-center px-4">
      <Text className="text-2xl font-bold mb-6">Sign Up</Text>
      <TextInput
        className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Sign Up" onPress={signUpWithEmail} disabled={loading} />
      <View className="h-2" />
      <Button
        title="Back"
        onPress={() => setMode("landing")}
        disabled={loading}
      />
    </View>
  );
}
