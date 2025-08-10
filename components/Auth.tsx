import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "../hooks/useColorScheme";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState<"landing" | "signin" | "signup">("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();

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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const CustomButton = ({
    title,
    onPress,
    disabled = false,
    variant = "primary",
  }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: "primary" | "secondary";
  }) => (
    <TouchableOpacity
      className={`px-6 py-4 rounded-xl mb-4 w-full items-center ${
        disabled
          ? "opacity-50"
          : variant === "primary"
            ? "bg-black"
            : "bg-gray-100"
      }`}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#FFFFFF" : "#000000"}
        />
      ) : (
        <Text
          className={`font-bold text-base ${
            variant === "primary" ? "text-white" : "text-black"
          }`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (mode === "landing") {
    return (
      <View className="flex-1 justify-center items-center px-6 bg-white">
        <View className="w-full max-w-sm">
          <Text className="text-4xl font-bold text-center mb-2 text-black">
            fashion:week
          </Text>
          <Text className="text-lg text-center mb-12 text-gray-600">
            Discover the latest in fashion
          </Text>

          <CustomButton title="SIGN IN" onPress={() => setMode("signin")} />
          <CustomButton
            title="CREATE ACCOUNT"
            onPress={() => setMode("signup")}
            variant="secondary"
          />
        </View>
      </View>
    );
  }

  if (mode === "signin") {
    return (
      <View className="flex-1 justify-center items-center px-6 bg-white">
        <View className="w-full max-w-sm">
          <Text className="text-3xl font-bold text-center mb-2 text-black">
            Welcome Back
          </Text>
          <Text className="text-base text-center mb-8 text-gray-600">
            Sign in to your account
          </Text>

          <View className="relative w-full mb-6">
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-4 w-full text-base bg-white"
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              blurOnSubmit={false}
              returnKeyType="next"
              enablesReturnKeyAutomatically={true}
            />
          </View>

          <View className="relative w-full mb-6">
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-4 w-full text-base bg-white pr-12"
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              blurOnSubmit={false}
              returnKeyType="done"
              enablesReturnKeyAutomatically={true}
            />
            <TouchableOpacity
              className="absolute right-4 top-0 bottom-0 justify-center"
              onPress={togglePasswordVisibility}
            >
              <Text className="text-gray-400 text-lg">
                {showPassword ? "●" : "⊘"}
              </Text>
            </TouchableOpacity>
          </View>

          <CustomButton
            title="SIGN IN"
            onPress={signInWithEmail}
            disabled={loading}
          />

          <CustomButton
            title="BACK"
            onPress={() => setMode("landing")}
            variant="secondary"
            disabled={loading}
          />
        </View>
      </View>
    );
  }

  // Sign Up
  return (
    <View className="flex-1 justify-center items-center px-6 bg-white">
      <View className="w-full max-w-sm">
        <Text className="text-3xl font-bold text-center mb-2 text-black">
          Create Account
        </Text>
        <Text className="text-base text-center mb-8 text-gray-600">
          Join the fashion community
        </Text>

        <View className="relative w-full mb-6">
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-4 w-full text-base bg-white"
            placeholder="Username"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            blurOnSubmit={false}
            returnKeyType="next"
            enablesReturnKeyAutomatically={true}
          />
        </View>

        <View className="relative w-full mb-6">
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-4 w-full text-base bg-white"
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            blurOnSubmit={false}
            returnKeyType="next"
            enablesReturnKeyAutomatically={true}
          />
        </View>

        <View className="relative w-full mb-6">
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-4 w-full text-base bg-white pr-12"
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            blurOnSubmit={false}
            returnKeyType="done"
            enablesReturnKeyAutomatically={true}
          />
          <TouchableOpacity
            className="absolute right-4 top-0 bottom-0 justify-center"
            onPress={togglePasswordVisibility}
          >
            <Text className="text-gray-400 text-lg">
              {showPassword ? (
                "●"
              ) : (
                <Text className="text-gray-400 text-xl">⊘</Text>
              )}
            </Text>
          </TouchableOpacity>
        </View>

        <CustomButton
          title="CREATE ACCOUNT"
          onPress={signUpWithEmail}
          disabled={loading}
        />

        <CustomButton
          title="BACK"
          onPress={() => setMode("landing")}
          variant="secondary"
          disabled={loading}
        />
      </View>
    </View>
  );
}
