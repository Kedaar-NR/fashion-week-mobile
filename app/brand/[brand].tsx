import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  Text,
  View,
} from "react-native";

const BUCKET_URL =
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/brand-content/brand_content";
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function getMediaType(filename: string): "video" | "image" | null {
  if (VIDEO_EXTENSIONS.some((ext) => filename.endsWith(ext))) return "video";
  if (IMAGE_EXTENSIONS.some((ext) => filename.endsWith(ext))) return "image";
  return null;
}

export default function BrandDetailScreen() {
  const { brand } = useLocalSearchParams<{ brand: string }>();
  const router = useRouter();
  const SWIPE_THRESHOLD = 100;
  const [media, setMedia] = useState<
    { type: "video" | "image"; url: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
        Math.abs(gesture.dx) > 10,
      onPanResponderMove: () => {},
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          router.back();
        }
      },
    })
  ).current;
  const profilePic = `https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/profile-pics/${brand}.jpg`;
  const { width } = Dimensions.get("window");
  const gridItemWidth = (width - 48) / 3;

  useEffect(() => {
    async function fetchMedia() {
      setLoading(true);
      const indexUrl = `${BUCKET_URL}/${brand}/index.json`;
      try {
        const res = await fetch(indexUrl);
        if (!res.ok) throw new Error("No index.json");
        const data = await res.json();
        if (!Array.isArray(data.files)) throw new Error("No files");
        const files = data.files
          .map((f: any) => (typeof f === "string" ? f : f?.name))
          .filter(Boolean)
          .map((name: string) => {
            const type = getMediaType(name);
            return type
              ? {
                  type,
                  url: `${BUCKET_URL}/${brand}/${name}`,
                  name,
                }
              : null;
          })
          .filter(Boolean) as {
          type: "video" | "image";
          url: string;
          name: string;
        }[];
        setMedia(files);
      } catch {
        setMedia([]);
      }
      setLoading(false);
    }
    fetchMedia();
  }, [brand]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, alignSelf: "center" }}
      />
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#fff" }}
      {...panResponder.panHandlers}
    >
      <FlatList
        ListHeaderComponent={
          <View className="items-center pt-10 pb-2">
            <Image
              source={{ uri: profilePic }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                marginBottom: 12,
              }}
              resizeMode="cover"
            />
            <Text className="text-xl font-bold text-gray-800 mb-4">
              {brand}
            </Text>
          </View>
        }
        data={media}
        keyExtractor={(item) => item.url}
        numColumns={3}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32 }}
        columnWrapperStyle={{ gap: 12, marginBottom: 16 }}
        renderItem={({ item }) => (
          <View
            style={{
              width: gridItemWidth,
              height: gridItemWidth,
              borderRadius: 14,
              overflow: "hidden",
              backgroundColor: "#f3f4f6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.type === "image" ? (
              <Image
                source={{ uri: item.url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Video
                source={{ uri: item.url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.COVER}
                useNativeControls={false}
                shouldPlay={false}
                isMuted={true}
                isLooping={true}
              />
            )}
          </View>
        )}
      />
    </View>
  );
}
