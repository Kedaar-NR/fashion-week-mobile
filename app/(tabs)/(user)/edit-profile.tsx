import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Auth from "../../../components/Auth";
import { supabase } from "../../../lib/supabase";

export default function EditProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);

  // Form state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileUrl, setProfileUrl] = useState<string | null>(null);

  // Loading state
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);

  // Username validation/availability
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(
    null
  );

  // Profile picture modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [showViewPhotoModal, setShowViewPhotoModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Bio selection state
  const [selected, setSelected] = useState<"add" | "dontAdd" | null>(null);

  const isValidUsername = (name: string) => /^[A-Za-z0-9._]+$/.test(name);

  const getProfilePicture = async (userId: string, cacheBust = false) => {
    const bucket = supabase.storage.from("profile-pics");
    const prefix = ""; // e.g. "avatars/" if your files are in a folder
    const candidates = [`${userId}.jpg`, `${userId}.jpeg`, `${userId}.png`];

    for (const name of candidates) {
      const { data, error } = await bucket.list(prefix, {
        limit: 1,
        search: name,
      });
      if (!error && data?.some((f) => f.name === name)) {
        // If bucket is public:
        const publicUrl = bucket.getPublicUrl(`${prefix}${name}`).data
          .publicUrl;
        // Add cache busting parameter if requested
        return cacheBust ? `${publicUrl}?t=${Date.now()}` : publicUrl;
        // If bucket is private, use a signed URL instead:
        // const { data: signed } = await bucket.createSignedUrl(`${prefix}${name}`, 60 * 60);
        // return signed?.signedUrl ?? null;
      }
    }

    // Fallback to default
    const defaultUrl = bucket.getPublicUrl(`${prefix}default-user.jpg`).data
      .publicUrl;
    return cacheBust ? `${defaultUrl}?t=${Date.now()}` : defaultUrl;
  };

  // Request camera permissions
  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Sorry, we need camera permissions to take photos for your profile picture.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  // Request media library permissions
  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Photo Library Permission Required",
        "Sorry, we need photo library permissions to select images for your profile picture.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  // Take a new photo
  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  // Select from photo library
  const handleSelectPhoto = async () => {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  // Upload profile image to Supabase storage
  const uploadProfileImage = async (imageUri: string) => {
    if (!session?.user) return;

    setUploadingImage(true);
    try {
      // Use the same naming convention as getProfilePicture function
      const fileName = `${session.user.id}.jpg`;

      // Convert local URI to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();

      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data:image/jpeg;base64, prefix
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      // Upload to profile-pics bucket (same as getProfilePicture function)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-pics")
        .upload(fileName, decode(base64Data), {
          contentType: "image/jpeg",
          upsert: true, // This will overwrite existing file with same name
        });

      if (uploadError) {
        console.log("Error uploading image:", uploadError);
        Alert.alert("Error", "Failed to upload image. Please try again.");
        return;
      }

      // Get the public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from("profile-pics")
        .getPublicUrl(fileName);

      // Update both avatarUrl (for backward compatibility) and profileUrl
      setAvatarUrl(urlData.publicUrl);
      setProfileUrl(urlData.publicUrl);

      // Refresh profile picture with cache busting to ensure immediate update
      setTimeout(async () => {
        if (session?.user?.id) {
          const refreshedUrl = await getProfilePicture(session.user.id, true);
          setProfileUrl(refreshedUrl);
        }
      }, 1000); // Small delay to ensure upload is complete

      setShowImageModal(false);
      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (uploadError) {
      console.log("Error processing image:", uploadError);
      Alert.alert("Error", "Failed to process image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/(user)/edit-profile");
      // Refresh profile picture when screen comes into focus
      if (session?.user?.id) {
        getProfilePicture(session.user.id, true).then(setProfileUrl);
      }
    }, [session])
  );

  // Load session and seed form from user metadata
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      const md = session?.user?.user_metadata || {};
      setUsername(md.display_name || "");
      setBio(md.bio || "");
      setAvatarUrl(md.avatar_url || "");

      // Load saved bio selection from add-bio table
      if (session?.user) {
        try {
          const { data: bioRecord, error } = await supabase
            .from("add-bio")
            .select("add")
            .eq("user_id", session.user.id)
            .single();

          if (!error && bioRecord) {
            setSelected(bioRecord.add ? "add" : "dontAdd");
          }
        } catch (bioError) {
          console.log("Error loading bio selection:", bioError);
        }
      }

      setInitializing(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Check username availability (debounced), excluding the current user
  useEffect(() => {
    if (!session?.user) return;
    const name = username.trim();
    if (name.length < 3 || !isValidUsername(name)) {
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
          .ilike("display_name", name)
          .neq("user_id", session.user.id);
        if (error) {
          setUsernameAvailable(null);
        } else {
          setUsernameAvailable((count ?? 0) === 0);
        }
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username, session]);

  // Load profile picture from storage
  useEffect(() => {
    (async () => {
      if (session?.user?.id) {
        const url = await getProfilePicture(session.user.id);
        setProfileUrl(url);
      }
    })();
  }, [session]);

  const canSaveUsername = useMemo(() => {
    const name = username.trim();
    return (
      name.length >= 3 && isValidUsername(name) && usernameAvailable !== false
    );
  }, [username, usernameAvailable]);

  const handleSave = async () => {
    if (!session?.user) return;
    if (!canSaveUsername) {
      Alert.alert(
        "Invalid username",
        "Make sure it's at least 3 characters and only contains letters, numbers, periods (.) and underscores (_)."
      );
      return;
    }

    setSaving(true);
    try {
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: username.trim(),
          bio: bio,
          avatar_url: avatarUrl,
        },
      });
      if (authError) throw authError;

      // Update user_profiles record (ignore if table doesn't have user_id or fails silently)
      try {
        const { error: upError } = await supabase
          .from("user_profiles")
          .update({ display_name: username.trim() })
          .eq("user_id", session.user.id);
        if (upError) {
          // Try insert if update failed (e.g., no row)
          await supabase.from("user_profiles").insert({
            user_id: session.user.id,
            display_name: username.trim(),
          });
        }
      } catch {}

      // Save bio selection to add-bio table
      if (selected !== null) {
        try {
          // Check if user already has a record in add-bio table
          const { data: existingRecord, error: checkError } = await supabase
            .from("add-bio")
            .select("id")
            .eq("user_id", session.user.id)
            .single();

          console.log("Checking existing record:", {
            existingRecord,
            checkError,
            userId: session.user.id,
          });

          if (checkError && checkError.code !== "PGRST116") {
            // PGRST116 means no rows found, which is expected for new users
            console.log("Error checking existing record:", checkError);
          }

          if (existingRecord) {
            console.log(
              "Updating existing record with add value:",
              selected === "add"
            );
            // Update existing record
            const { error: updateError } = await supabase
              .from("add-bio")
              .update({
                add: selected === "add",
              })
              .eq("user_id", session.user.id);

            if (updateError) {
              console.log("Error updating add-bio record:", updateError);
              Alert.alert(
                "Error",
                "Failed to update bio selection. Please try again."
              );
            } else {
              console.log(
                "Successfully updated bio selection to:",
                selected === "add"
              );
            }
          } else {
            // Insert new record
            const { error: insertError } = await supabase
              .from("add-bio")
              .insert({
                user_id: session.user.id,
                add: selected === "add",
                created_at: new Date().toISOString(),
              });

            if (insertError) {
              console.log("Error inserting add-bio record:", insertError);
            }
          }
        } catch (bioError) {
          console.log("Error saving bio selection:", bioError);
        }
      }

      Alert.alert("Profile updated");
    } catch (e: any) {
      Alert.alert("Update failed", e?.message ?? "Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const showUsernameHelper = username.length > 0 && !isValidUsername(username);
  const showMinLengthHelper =
    username.length > 0 &&
    isValidUsername(username) &&
    username.trim().length < 3;

  return (
    <View className="flex-1 bg-transparent">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Avatar */}
        <View className="items-center mb-6">
          <TouchableOpacity
            onPress={() => setShowImageModal(true)}
            className="relative"
            disabled={uploadingImage}
          >
            <Image
              source={{
                uri:
                  profileUrl ||
                  "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
              }}
              className="w-24 h-24 rounded-full mb-3"
              resizeMode="cover"
            />
            {uploadingImage && (
              <View className="absolute inset-0 bg-black bg-opacity-50 rounded-full items-center justify-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
            <View className="absolute bottom-3 right-1 bg-black bg-opacity-75 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs">+</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Username */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2">Username</Text>
          <View className="relative">
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-4 w-full text-base bg-white pr-12"
              placeholder="Username"
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              enablesReturnKeyAutomatically={true}
            />
            {username.trim().length >= 3 && isValidUsername(username) && (
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
          {showUsernameHelper && (
            <Text className="text-red-500 text-xs mt-2">
              Only letters, numbers, periods (.), and underscores (_) are
              allowed. No spaces or special characters.
            </Text>
          )}
          {showMinLengthHelper && (
            <Text className="text-red-500 text-xs mt-1">
              Username must be at least 3 characters.
            </Text>
          )}
        </View>

        {/* Bio */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2">Bio</Text>
          {/* <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 w-full text-base bg-white"
            placeholder="Say something about your style..."
            placeholderTextColor="#9CA3AF"
            value={bio}
            onChangeText={setBio}
            autoCapitalize="sentences"
            autoCorrect={true}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          /> */}

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-500">
              Thinking about adding this one...
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setSelected("add")}
                className={`px-3 py-1 rounded-lg items-center justify-center min-h-[24px] ${selected === "add" ? "bg-black" : "bg-transparent"}`}
              >
                <Text
                  className={`text-xs font-bold ${selected === "add" ? "text-white" : "text-black"}`}
                >
                  ADD+
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelected("dontAdd")}
                className={`px-3 py-1 rounded-lg items-center justify-center min-h-[24px] ${selected === "dontAdd" ? "bg-black" : "bg-transparent"}`}
              >
                <Text
                  className={`text-xs font-bold ${selected === "dontAdd" ? "text-white" : "text-black"}`}
                >
                  DON'T ADD-
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          className={`px-6 py-4 rounded-xl w-full items-center ${
            saving || !canSaveUsername ? "opacity-50 bg-black" : "bg-black"
          }`}
          disabled={saving || !canSaveUsername}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="font-bold text-base text-white">Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Profile Picture Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-2xl mx-4 mb-4 overflow-hidden">
            <TouchableOpacity
              className="p-4 border-b border-gray-100"
              onPress={handleTakePhoto}
              disabled={uploadingImage}
            >
              <Text className="text-base text-gray-900 text-center">
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4 border-b border-gray-100"
              onPress={handleSelectPhoto}
              disabled={uploadingImage}
            >
              <Text className="text-base text-gray-900 text-center">
                Choose from Library
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4 border-b border-gray-100"
              onPress={() => {
                setShowImageModal(false);
                setShowViewPhotoModal(true);
              }}
              disabled={uploadingImage}
            >
              <Text className="text-base text-gray-900 text-center">
                View Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4"
              onPress={() => setShowImageModal(false)}
              disabled={uploadingImage}
            >
              <Text className="text-base text-gray-500 text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View Photo Modal */}
      <Modal
        visible={showViewPhotoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowViewPhotoModal(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-gray-100 bg-opacity-75 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowViewPhotoModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Image
              source={{
                uri:
                  profileUrl ||
                  "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
              }}
              className="w-80 h-80 rounded-full"
              resizeMode="cover"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
