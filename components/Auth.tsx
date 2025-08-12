import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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

  // ADDED (OTP state)
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // ADDED: username availability state
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(
    null
  );

  useEffect(() => {
    if (mode !== "signup") return;
    const name = username.trim();
    if (name.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }
    setCheckingUsername(true);
    const t = setTimeout(async () => {
      try {
        const { count, error } = await supabase
          .from("user_profiles")
          .select("id", { head: true, count: "exact" })
          .ilike("display_name", name);
        if (error) {
          setUsernameAvailable(null);
        } else {
          setUsernameAvailable((count ?? 0) === 0);
        }
      } catch (_e) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username, mode]);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      Alert.alert(error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
  }

  // CHANGED: use OTP flow instead of email confirmation
  async function signUpWithEmail() {
    const name = username.trim();
    if (name.length < 3 || !usernameAvailable) {
      Alert.alert(
        "Username not available",
        "Please choose a different username."
      );
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { display_name: name } },
    });
    setLoading(false);
    if (error) {
      Alert.alert(error.message);
      return;
    }
    setOtp("");
    setOtpVisible(true);
  }

  // ADDED: verify OTP
  async function verifyOtp() {
    if (otp.length !== 6) {
      Alert.alert("Enter the 6-digit code sent to your email.");
      return;
    }
    setOtpLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    setOtpLoading(false);
    if (error) {
      Alert.alert(error.message);
      return;
    }
    setOtpVisible(false);
    router.replace("/onboarding");
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
            className="border border-gray-200 rounded-xl px-4 py-4 w-full text-base bg-white pr-12"
            placeholder="Username"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            blurOnSubmit={false}
            returnKeyType="next"
            enablesReturnKeyAutomatically={true}
          />
          {/* Availability indicator */}
          {username.trim().length >= 3 && (
            <View className="absolute right-4 top-0 bottom-0 justify-center">
              {checkingUsername ? (
                <ActivityIndicator size="small" color="#9CA3AF" />
              ) : usernameAvailable ? (
                <Text className="text-green-600 text-xl">✓</Text>
              ) : usernameAvailable === false ? (
                <Text className="text-red-500 text-xl">✕</Text>
              ) : null}
            </View>
          )}
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
          disabled={
            loading || checkingUsername || !(usernameAvailable === true)
          }
        />

        <CustomButton
          title="BACK"
          onPress={() => setMode("landing")}
          variant="secondary"
          disabled={loading}
        />
      </View>

      {/* ADDED: OTP Modal */}
      <Modal transparent visible={otpVisible} animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="w-full max-w-sm bg-white rounded-2xl p-6">
            <Text className="text-2xl font-bold text-center mb-4 text-black">
              Verify your email
            </Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-4 w-full text-base bg-white text-center tracking-widest mb-6"
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
            <CustomButton
              title="VERIFY"
              onPress={verifyOtp}
              disabled={otpLoading || otp.length !== 6}
            />
            <CustomButton
              title="CANCEL"
              variant="secondary"
              onPress={() => setOtpVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
