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
      style={{
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 20,
        marginBottom: 16,
        width: "100%",
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
        backgroundColor: variant === "primary" ? "#000" : "#E0E0E0",
      }}
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
          style={{
            fontWeight: "bold",
            fontSize: 18,
            color: variant === "primary" ? "#FFFFFF" : "#000000",
          }}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );

  const CustomInput = ({
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    keyboardType = "default",
    autoCapitalize = "none",
  }: {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address";
    autoCapitalize?: "none" | "words";
  }) => (
    <View style={{ width: "100%", marginBottom: 24 }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#D1D5DB",
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 16,
          fontSize: 16,
          backgroundColor: "#FFFFFF",
        }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );

  const PasswordInput = ({
    placeholder,
    value,
    onChangeText,
  }: {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
  }) => (
    <View style={{ width: "100%", marginBottom: 24 }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#D1D5DB",
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 16,
          fontSize: 16,
          backgroundColor: "#FFFFFF",
          paddingRight: 48, // Adjust padding for icon
        }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={!showPassword}
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity
        style={{
          position: "absolute",
          right: 16,
          top: 0,
          bottom: 0,
          justifyContent: "center",
        }}
        onPress={togglePasswordVisibility}
      >
        <Text style={{ color: "#9CA3AF", fontSize: 24 }}>
          {showPassword ? "👁️" : "👁️‍🗨️"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (mode === "landing") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          backgroundColor: "#fff",
        }}
      >
        <View style={{ width: "100%", maxWidth: 300 }}>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 8,
              color: "#000",
            }}
          >
            fashion:week
          </Text>
          <Text
            style={{
              fontSize: 20,
              textAlign: "center",
              marginBottom: 36,
              color: "#6B7280",
            }}
          >
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          backgroundColor: "#fff",
        }}
      >
        <View style={{ width: "100%", maxWidth: 300 }}>
          <Text
            style={{
              fontSize: 36,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 8,
              color: "#000",
            }}
          >
            Welcome Back
          </Text>
          <Text
            style={{
              fontSize: 18,
              textAlign: "center",
              marginBottom: 24,
              color: "#6B7280",
            }}
          >
            Sign in to your account
          </Text>

          <CustomInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <PasswordInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
          />

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
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        backgroundColor: "#fff",
      }}
    >
      <View style={{ width: "100%", maxWidth: 300 }}>
        <Text
          style={{
            fontSize: 36,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 8,
            color: "#000",
          }}
        >
          Create Account
        </Text>
        <Text
          style={{
            fontSize: 18,
            textAlign: "center",
            marginBottom: 24,
            color: "#6B7280",
          }}
        >
          Join the fashion community
        </Text>

        <CustomInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="words"
        />

        <CustomInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <PasswordInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
        />

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
