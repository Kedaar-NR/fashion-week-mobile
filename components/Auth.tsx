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
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();

  // OTP verification state
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Username availability state
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(
    null
  );

  // Email availability state
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<null | boolean>(null);

  // Per-button loading
  const [signInLoading, setSignInLoading] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);

  const isValidUsername = (name: string) => /^[A-Za-z0-9._]+$/.test(name);
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (mode !== "signup") return;
    const name = username.trim();
    if (name.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }
    if (!isValidUsername(name)) {
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

  // Check email availability in user_profiles table
  useEffect(() => {
    if (mode !== "signup") return;
    const emailTrimmed = email.trim();
    if (emailTrimmed.length < 3 || !isValidEmail(emailTrimmed)) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }
    setCheckingEmail(true);
    const t = setTimeout(async () => {
      try {
        const { data, count, error } = await supabase
          .from("user_profiles")
          .select("email", { count: "exact" })
          .eq("email", emailTrimmed);

        console.log("Email check for:", emailTrimmed);
        console.log("Matching emails found:", data);
        console.log("Count:", count);

        if (error) {
          console.log("Error checking email:", error);
          setEmailAvailable(null);
        } else {
          setEmailAvailable((count ?? 0) === 0);
        }
      } catch (_e) {
        console.log("Exception checking email:", _e);
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [email, mode]);

  async function signInWithEmail() {
    try {
      setSignInLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }
      // Successfully signed in; navigation handled elsewhere by auth listener.
    } finally {
      setSignInLoading(false);
    }
  }

  // Create user account with email verification
  async function signUpWithEmail() {
    const name = username.trim();
    if (name.length < 3 || !usernameAvailable) {
      Alert.alert(
        "Username not available",
        "Please choose a different username."
      );
      return;
    }
    if (!emailAvailable) {
      Alert.alert(
        "Account Exists",
        "An account already exists with that email."
      );
      return;
    }
    try {
      setSignUpLoading(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: name },
        },
      });
      if (error) {
        Alert.alert("Sign up failed", error.message);
        return;
      }
      // Account created! Show OTP modal
      setOtp("");
      setOtpVisible(true);
    } finally {
      setSignUpLoading(false);
    }
  }

  // Verify 6-digit OTP from {{ .Token }} (email confirmation)
  async function verifyOtp() {
    try {
      setOtpLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: "email", // verify the email confirmation code (signup/magiclink types are deprecated)
      });

      if (error) {
        Alert.alert("Verification failed", error.message);
        return;
      }

      setOtpVisible(false);
      setOtp("");

      // Navigate to onboarding/style-quiz
      router.replace("/onboarding");

      // OPTIONAL: If your Supabase project doesn't auto-create a session on confirm,
      // you can sign the user in now:
      // if (!data.session) {
      //   const { error: signInErr } = await supabase.auth.signInWithPassword({
      //     email: email.trim(),
      //     password,
      //   });
      //   if (signInErr) Alert.alert("Sign-in failed", signInErr.message);
      // }
    } catch (e: any) {
      Alert.alert("Verification error", e?.message ?? "Unknown error");
    } finally {
      setOtpLoading(false);
    }
  }

  async function resendOtp() {
    try {
      setResending(true);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (error) {
        Alert.alert("Could not resend", error.message);
      } else {
        Alert.alert("Sent", "A new code was sent to your email.");
      }
    } finally {
      setResending(false);
    }
  }

  const togglePasswordVisibility = () => setShowPassword((s) => !s);

  const CustomButton = ({
    title,
    onPress,
    disabled = false,
    variant = "primary",
    loading = false,
  }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: "primary" | "secondary";
    loading?: boolean;
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
            disabled={signInLoading}
            loading={signInLoading}
          />

          <CustomButton
            title="BACK"
            onPress={() => setMode("landing")}
            variant="secondary"
            disabled={signInLoading}
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
            autoCorrect={false}
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
          {username.length > 0 && !isValidUsername(username) && (
            <Text className="text-red-500 text-xs mt-2">
              Only letters, numbers, periods (.), and underscores (_) are
              allowed. No spaces or special characters.
            </Text>
          )}
          {username.length > 0 &&
            isValidUsername(username) &&
            username.trim().length < 3 && (
              <Text className="text-red-500 text-xs mt-1">
                Username must be at least 3 characters.
              </Text>
            )}
        </View>

        <View className="relative w-full mb-6">
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-4 w-full text-base bg-white pr-12"
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
          {/* Email availability indicator */}
          {email.trim().length >= 3 && isValidEmail(email.trim()) && (
            <View className="absolute right-4 top-0 bottom-0 justify-center">
              {checkingEmail ? (
                <ActivityIndicator size="small" color="#9CA3AF" />
              ) : emailAvailable ? (
                <Text className="text-green-600 text-xl">✓</Text>
              ) : emailAvailable === false ? (
                <Text className="text-red-500 text-xl">✕</Text>
              ) : null}
            </View>
          )}
          {email.length > 0 && !isValidEmail(email) && (
            <Text className="text-red-500 text-xs mt-2">
              Please enter a valid email address.
            </Text>
          )}
          {email.length > 0 &&
            isValidEmail(email) &&
            emailAvailable === false && (
              <Text className="text-red-500 text-xs mt-2">
                An account already exists with this email.
              </Text>
            )}
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
            signUpLoading ||
            checkingUsername ||
            checkingEmail ||
            !(usernameAvailable === true) ||
            !(emailAvailable === true)
          }
          loading={signUpLoading}
        />

        <CustomButton
          title="BACK"
          onPress={() => setMode("landing")}
          variant="secondary"
          disabled={signUpLoading}
        />
      </View>

      {/* OTP Verification Modal */}
      <Modal transparent visible={otpVisible} animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="w-full max-w-sm bg-white rounded-2xl p-6">
            <Text className="text-2xl font-bold text-center mb-4 text-black">
              Verify your email
            </Text>
            <Text className="text-base text-center mb-6 text-gray-600">
              Enter the 6-digit code sent to your email
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
              title={otpLoading ? "VERIFYING..." : "VERIFY"}
              onPress={verifyOtp}
              disabled={otpLoading || otp.length !== 6}
              loading={otpLoading}
            />
            <CustomButton
              title={resending ? "RESENDING..." : "RESEND CODE"}
              variant="secondary"
              onPress={resendOtp}
              disabled={resending}
              loading={resending}
            />
            <CustomButton
              title="CANCEL"
              variant="secondary"
              onPress={() => {
                setOtpVisible(false);
                setOtp("");
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
