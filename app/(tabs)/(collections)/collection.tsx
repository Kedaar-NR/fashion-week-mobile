import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

interface FashionPiece {
  id: string;
  name: string;
  type: string;
  designer: string;
  image: string;
  likedAt: Date;
}

interface Collection {
  id: number;
  collection_name: string;
  description: string | null;
  collection_image: string | null;
  is_pinned: boolean;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  pieces: number[];
}

const mockFashionPieces: FashionPiece[] = [
  {
    id: "1",
    name: "Aviator Sunglasses",
    type: "Accessories",
    designer: "Ray-Ban",
    image: "placeholder",
    likedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
  {
    id: "2",
    name: "Denim Jacket",
    type: "Outerwear",
    designer: "Levi's",
    image: "placeholder",
    likedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: "3",
    name: "White Sneakers",
    type: "Footwear",
    designer: "Nike",
    image: "placeholder",
    likedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
  },
  {
    id: "4",
    name: "Silk Scarf",
    type: "Accessories",
    designer: "Hermès",
    image: "placeholder",
    likedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: "5",
    name: "Leather Bag",
    type: "Accessories",
    designer: "Coach",
    image: "placeholder",
    likedAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
  },
];

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 64) / 3; // 3 columns with padding

export default function CollectionScreen() {
  const [fashionPieces] = useState<FashionPiece[]>(mockFashionPieces);
  const [session, setSession] = useState<Session | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newCollectionCover, setNewCollectionCover] = useState<string | null>(
    null
  );
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );
  const [editCollectionName, setEditCollectionName] = useState("");
  const [editCollectionDescription, setEditCollectionDescription] =
    useState("");
  const [editCollectionCover, setEditCollectionCover] = useState<string | null>(
    null
  );
  const [updatingCollection, setUpdatingCollection] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!session) return;

      setLoading(true);
      supabase
        .from("collections")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.log("Error fetching collections:", error);
            setCollections([]);
          } else {
            setCollections(data || []);
          }
          setLoading(false);
        });
    }, [session])
  );

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/(collections)/collection");
    }, [])
  );

  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera roll permissions to select images for your collection cover.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const handleSelectCoverImage = async () => {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for collection covers
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewCollectionCover(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const handleCreateCollection = async () => {
    if (!session?.user || !newCollectionName.trim()) return;

    setCreatingCollection(true);
    try {
      let imageUrl = null;

      // Upload image to Supabase storage if selected
      if (newCollectionCover) {
        try {
          const fileName = `collection-covers/${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

          // Convert local URI to base64
          const response = await fetch(newCollectionCover);
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

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("collection-images")
              .upload(fileName, decode(base64Data), {
                contentType: "image/jpeg",
              });

          if (uploadError) {
            console.log("Error uploading image:", uploadError);
            Alert.alert("Error", "Failed to upload image. Please try again.");
            return;
          }

          // Get the public URL for the uploaded image
          const { data: urlData } = supabase.storage
            .from("collection-images")
            .getPublicUrl(fileName);

          imageUrl = urlData.publicUrl;
        } catch (uploadError) {
          console.log("Error processing image:", uploadError);
          Alert.alert("Error", "Failed to process image. Please try again.");
          return;
        }
      }

      const { data, error } = await supabase
        .from("collections")
        .insert({
          collection_name: newCollectionName.trim(),
          description: newCollectionDescription.trim(),
          collection_image: imageUrl,
          user_id: session.user.id,
          is_pinned: false,
        })
        .select()
        .single();

      if (error) {
        console.log("Error creating collection:", error);
        Alert.alert("Error", "Failed to create collection. Please try again.");
        return;
      }

      // Add the new collection to the local state
      setCollections((prev) => [...prev, data]);

      // Reset form and close modal
      setNewCollectionName("");
      setNewCollectionDescription("");
      setNewCollectionCover(null);
      setShowCreateModal(false);

      console.log("Collection created successfully:", data);
    } catch (error) {
      console.log("Error creating collection:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setNewCollectionName("");
    setNewCollectionDescription("");
    setNewCollectionCover(null);
  };

  const handleSelectEditCoverImage = async () => {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for collection covers
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEditCollectionCover(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setEditCollectionName(collection.collection_name);
    setEditCollectionDescription(collection.description || "");
    setEditCollectionCover(collection.collection_image);
    setShowEditModal(true);
  };

  const handleUpdateCollection = async () => {
    if (!session?.user || !editingCollection || !editCollectionName.trim())
      return;

    setUpdatingCollection(true);
    try {
      let imageUrl = editingCollection.collection_image;

      // Handle image removal or upload
      if (editCollectionCover === null) {
        // User wants to remove the image
        imageUrl = null;
      } else if (
        editCollectionCover &&
        editCollectionCover !== editingCollection.collection_image
      ) {
        // Upload new image to Supabase storage if selected
        try {
          const fileName = `collection-covers/${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

          // Convert local URI to base64
          const response = await fetch(editCollectionCover);
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

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("collection-images")
              .upload(fileName, decode(base64Data), {
                contentType: "image/jpeg",
              });

          if (uploadError) {
            console.log("Error uploading image:", uploadError);
            Alert.alert("Error", "Failed to upload image. Please try again.");
            return;
          }

          // Get the public URL for the uploaded image
          const { data: urlData } = supabase.storage
            .from("collection-images")
            .getPublicUrl(fileName);

          imageUrl = urlData.publicUrl;
        } catch (uploadError) {
          console.log("Error processing image:", uploadError);
          Alert.alert("Error", "Failed to process image. Please try again.");
          return;
        }
      }

      const { data, error } = await supabase
        .from("collections")
        .update({
          collection_name: editCollectionName.trim(),
          description: editCollectionDescription.trim(),
          collection_image: imageUrl,
        })
        .eq("id", editingCollection.id)
        .eq("user_id", session.user.id)
        .select()
        .single();

      if (error) {
        console.log("Error updating collection:", error);
        Alert.alert("Error", "Failed to update collection. Please try again.");
        return;
      }

      // Update the collection in local state
      setCollections((prev) =>
        prev.map((collection) =>
          collection.id === editingCollection.id ? data : collection
        )
      );

      // Reset form and close modal
      setEditCollectionName("");
      setEditCollectionDescription("");
      setEditCollectionCover(null);
      setEditingCollection(null);
      setShowEditModal(false);

      console.log("Collection updated successfully:", data);
    } catch (error) {
      console.log("Error updating collection:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setUpdatingCollection(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditCollectionName("");
    setEditCollectionDescription("");
    setEditCollectionCover(null);
    setEditingCollection(null);
  };

  const sortOptions = [
    {
      label: "NAME",
      onPress: () => {
        setCollections((prev) =>
          [...prev].sort((a, b) =>
            a.collection_name.localeCompare(b.collection_name)
          )
        );
        setSortDropdownOpen(false);
      },
    },
    {
      label: "DATE CREATED",
      onPress: () => {
        setCollections((prev) =>
          [...prev].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        );
        setSortDropdownOpen(false);
      },
    },
    {
      label: "MOST ITEMS",
      onPress: () => {
        setCollections((prev) =>
          [...prev].sort((a, b) => {
            const aCount = a.pieces?.length || 0;
            const bCount = b.pieces?.length || 0;
            return bCount - aCount;
          })
        );
        setSortDropdownOpen(false);
      },
    },
  ];

  // Get the 3 most recently liked pieces
  const recentlyLiked = fashionPieces
    .sort((a, b) => b.likedAt.getTime() - a.likedAt.getTime())
    .slice(0, 3);

  const renderRecentlyLikedItem = ({ item }: { item: FashionPiece }) => (
    <View className="items-center" style={{ width: gridItemWidth }}>
      <View
        className="bg-gray-200 rounded-xl justify-center items-center mb-2"
        style={{ width: gridItemWidth, height: gridItemWidth }}
      >
        <Text className="text-xs opacity-50">Image</Text>
      </View>
      <Text className="text-xs font-medium text-center" numberOfLines={1}>
        {item.name}
      </Text>
    </View>
  );

  const renderGridItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      className="items-center"
      style={{ width: gridItemWidth }}
      onPress={() =>
        router.push({
          pathname: "/(tabs)/(collections)/[collection]",
          params: { collection: item.collection_name },
        })
      }
      onLongPress={() => handleEditCollection(item)}
    >
      <View
        className="bg-gray-200 rounded-xl justify-center items-center mb-2 overflow-hidden"
        style={{ width: gridItemWidth, height: gridItemWidth }}
      >
        {item.collection_image ? (
          <Image
            source={{ uri: item.collection_image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-xs opacity-50">No Image</Text>
        )}
      </View>
      <Text className="text-xs font-medium text-left" numberOfLines={1}>
        {item.collection_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-4">
        {/* Recently Liked Section */}
        <View className="mb-8">
          <View className="flex-row items-center gap-4 mb-4">
            <Text className="text-xl font-bold">LIKED</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(collections)/[collection]",
                  params: { collection: "all-liked" },
                })
              }
            >
              <Text className="text-sm font-bold">SEE MORE ›</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentlyLiked}
            keyExtractor={(item) => item.id}
            renderItem={renderRecentlyLikedItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingRight: 16 }}
          />
        </View>

        {/* Collections Grid Section */}
        <View className="flex-1">
          <View className="flex-row items-center gap-4 mb-2">
            <Text className="text-xl font-bold">COLLECTIONS</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(true)}>
              <Text className="text-sm font-bold">CREATE+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSortDropdownOpen(!sortDropdownOpen)}
            >
              <Text className="text-sm font-bold">SORT BY+</Text>
            </TouchableOpacity>
          </View>

          {/* Sort Dropdown */}
          {sortDropdownOpen && (
            <View className="mb-4">
              {sortOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={option.onPress}
                  className="py-2"
                >
                  <Text className="text-sm font-bold">{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {loading ? (
            <Text className="text-center py-8">Loading collections...</Text>
          ) : collections.length === 0 ? (
            <Text className="text-center py-8">No collections found</Text>
          ) : (
            <FlatList
              data={collections}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderGridItem}
              numColumns={3}
              columnWrapperStyle={{
                gap: 16,
                marginBottom: 16,
              }}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </ScrollView>

      {/* Create Collection Modal */}
      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center p-4"
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <TouchableOpacity
            className="bg-white rounded-2xl w-full max-w-sm max-h-[80%]"
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <TouchableOpacity onPress={handleCloseModal}>
                <Text className="text-gray-500 text-lg">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Create Collection</Text>
              <TouchableOpacity
                onPress={handleCreateCollection}
                disabled={!newCollectionName.trim() || creatingCollection}
              >
                <Text
                  className={`text-lg ${
                    newCollectionName.trim() && !creatingCollection
                      ? "text-blue-500 font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  {creatingCollection ? "Creating..." : "Create"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView className="p-4">
              {/* Cover Image Selection */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Cover Image (Optional)
                </Text>
                <TouchableOpacity
                  onPress={handleSelectCoverImage}
                  className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 justify-center items-center overflow-hidden"
                >
                  {newCollectionCover ? (
                    <Image
                      source={{ uri: newCollectionCover }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="items-center">
                      <Text className="text-gray-500 text-sm">
                        Tap to select cover
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        from camera roll
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {newCollectionCover && (
                  <TouchableOpacity
                    onPress={() => setNewCollectionCover(null)}
                    className="mt-2"
                  >
                    <Text className="text-red-500 text-sm text-center">
                      Remove cover
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Collection Name *
                </Text>
                <TextInput
                  value={newCollectionName}
                  onChangeText={setNewCollectionName}
                  placeholder="Enter collection name"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  autoFocus
                  maxLength={50}
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </Text>
                <TextInput
                  value={newCollectionDescription}
                  onChangeText={setNewCollectionDescription}
                  placeholder="Describe your collection"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={200}
                />
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Collection Modal */}
      <Modal
        visible={showEditModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseEditModal}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center p-4"
          activeOpacity={1}
          onPress={handleCloseEditModal}
        >
          <TouchableOpacity
            className="bg-white rounded-2xl w-full max-w-sm max-h-[80%]"
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <TouchableOpacity onPress={handleCloseEditModal}>
                <Text className="text-gray-500 text-lg">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Edit Collection</Text>
              <TouchableOpacity
                onPress={handleUpdateCollection}
                disabled={!editCollectionName.trim() || updatingCollection}
              >
                <Text
                  className={`text-lg ${
                    editCollectionName.trim() && !updatingCollection
                      ? "text-blue-500 font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  {updatingCollection ? "Updating..." : "Update"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView className="p-4">
              {/* Cover Image Selection */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Cover Image (Optional)
                </Text>
                <TouchableOpacity
                  onPress={handleSelectEditCoverImage}
                  className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 justify-center items-center overflow-hidden"
                >
                  {editCollectionCover ? (
                    <Image
                      source={{ uri: editCollectionCover }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="items-center">
                      <Text className="text-gray-500 text-sm">
                        Tap to select cover
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        from camera roll
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {editCollectionCover && (
                  <TouchableOpacity
                    onPress={() => setEditCollectionCover(null)}
                    className="mt-2"
                  >
                    <Text className="text-red-500 text-sm text-center">
                      Remove cover
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Collection Name *
                </Text>
                <TextInput
                  value={editCollectionName}
                  onChangeText={setEditCollectionName}
                  placeholder="Enter collection name"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  autoFocus
                  maxLength={50}
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </Text>
                <TextInput
                  value={editCollectionDescription}
                  onChangeText={setEditCollectionDescription}
                  placeholder="Describe your collection"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={200}
                />
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
