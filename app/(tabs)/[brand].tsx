import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import * as Linking from "expo-linking";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  TouchableOpacity,
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
  const safeBrand = brand?.replace(/^\/+|\/+$/g, "").replace(/\.[^/.]+$/, "");
  const profilePic = `https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/profile-pics/${safeBrand}.jpg`;
  const [imgError, setImgError] = React.useState(false);
  const [media, setMedia] = React.useState<
    { type: "video" | "image"; url: string; name: string }[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [firstLoaded, setFirstLoaded] = React.useState(false);
  const flatListRef = React.useRef<FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const router = require("expo-router").useRouter();
  const [muted, setMuted] = useState(true); // default to muted
  const videoRefs = useRef<{ [key: string]: any }>({});

  useFocusEffect(
    React.useCallback(() => {
      console.log(`📍 Current path: /(tabs)/(index)/[brand]`);
      console.log(`📍 Brand parameter: ${brand}`);
    }, [brand])
  );

  // PanResponder for swipe-to-go-back
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only trigger if gesture starts near left edge and is a rightward swipe
        return (
          evt.nativeEvent.pageX < 40 &&
          gestureState.dx > 10 &&
          Math.abs(gestureState.dy) < 20
        );
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 60 && Math.abs(gestureState.dy) < 30) {
          // Go back if swiped right enough
          if (router && router.back) router.back();
        }
      },
    })
  ).current;

  React.useEffect(() => {
    async function fetchMedia() {
      setLoading(true);
      const indexUrl = `${BUCKET_URL}/${safeBrand}/index.json`;
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
                  url: `${BUCKET_URL}/${safeBrand}/${name}`,
                  name,
                }
              : null;
          })
          .filter(Boolean) as {
          type: "video" | "image";
          url: string;
          name: string;
        }[];
        // --- DEDUPLICATE: Only show video if both image and video exist for same base name ---
        const baseMap = new Map<
          string,
          { type: "video" | "image"; url: string; name: string }
        >();
        files.forEach((file) => {
          const base = file.name.replace(/\.[^/.]+$/, "");
          if (!baseMap.has(base)) {
            baseMap.set(base, file);
          } else {
            // Prefer video over image
            const existing = baseMap.get(base);
            if (
              existing &&
              existing.type === "image" &&
              file.type === "video"
            ) {
              baseMap.set(base, file);
            }
          }
        });
        setMedia(Array.from(baseMap.values()));
      } catch {
        setMedia([]);
      }
      setLoading(false);
    }
    fetchMedia();
  }, [safeBrand]);

  // Prefetch the first image/video for instant load
  React.useEffect(() => {
    if (media.length > 0) {
      const first = media[0];
      if (first.type === "image") {
        Image.prefetch(first.url)
          .then(() => setFirstLoaded(true))
          .catch(() => setFirstLoaded(true));
      } else {
        setFirstLoaded(true); // For video, assume ready
      }
    }
  }, [media]);

  // Reset to first item whenever media changes, but only if media is not empty
  React.useEffect(() => {
    if (media.length > 0) {
      setCurrentIndex(0);
      flatListRef.current?.scrollToIndex({ index: 0, animated: false });
    }
  }, [media]);

  // Gallery navigation handlers
  const goLeft = () => {
    if (media.length === 0) return;
    if (currentIndex === 0) return; // Don't reshow the first image
    setCurrentIndex((prev) => prev - 1);
    flatListRef.current?.scrollToIndex({
      index: currentIndex - 1,
      animated: true,
    });
  };
  const goRight = () => {
    if (media.length === 0) return;
    if (currentIndex === media.length - 1) return; // Don't go past the last image
    setCurrentIndex((prev) => prev + 1);
    flatListRef.current?.scrollToIndex({
      index: currentIndex + 1,
      animated: true,
    });
  };

  // Pause/mute all videos on navigation away
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        Object.values(videoRefs.current).forEach((ref) => {
          if (ref && ref.pauseAsync) ref.pauseAsync().catch(() => {});
          if (ref && ref.setStatusAsync)
            ref.setStatusAsync({ isMuted: true }).catch(() => {});
        });
      };
    }, [])
  );

  // Keep currentIndex in sync with FlatList scroll
  const onViewableItemsChanged = React.useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      // Pause/mute all videos first
      Object.values(videoRefs.current).forEach((ref) => {
        if (ref && ref.pauseAsync) ref.pauseAsync().catch(() => {});
        if (ref && ref.setStatusAsync)
          ref.setStatusAsync({ isMuted: true }).catch(() => {});
      });
      if (viewableItems && viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index);
        // Play/unmute only the visible video
        const idx = viewableItems[0].index;
        const ref = videoRefs.current[`video_${idx}`];
        if (ref && ref.playAsync) ref.playAsync().catch(() => {});
        if (ref && ref.setStatusAsync)
          ref.setStatusAsync({ isMuted: muted ? true : false }).catch(() => {});
      }
    }
  );

  // After media and firstLoaded are ready, trigger play/unmute for the first video
  React.useEffect(() => {
    if (media.length > 0 && firstLoaded) {
      // Pause/mute all videos first
      Object.values(videoRefs.current).forEach((ref) => {
        if (ref && ref.pauseAsync) ref.pauseAsync().catch(() => {});
        if (ref && ref.setStatusAsync)
          ref.setStatusAsync({ isMuted: true }).catch(() => {});
      });
      // Play/unmute only the first video if it's a video
      const first = media[0];
      if (first && first.type === "video") {
        const ref = videoRefs.current[`video_0`];
        if (ref && ref.playAsync) ref.playAsync().catch(() => {});
        if (ref && ref.setStatusAsync)
          ref.setStatusAsync({ isMuted: muted ? true : false }).catch(() => {});
      }
    }
  }, [media, firstLoaded, muted]);

  if (loading || (media.length > 0 && !firstLoaded)) {
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, alignSelf: "center" }}
      />
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "transparent" }}
      {...panResponder.panHandlers}
    >
      {/* Mute button */}
      <View style={{ position: "absolute", top: 32, right: 24, zIndex: 10 }}>
        <TouchableOpacity
          onPress={() => {
            setMuted((m) => {
              const newMuted = !m;
              // Ensure the current video keeps playing
              const ref = videoRefs.current[`video_${currentIndex}`];
              if (ref && ref.playAsync) ref.playAsync().catch(() => {});
              return newMuted;
            });
          }}
        >
          <Ionicons
            name={muted ? "volume-mute" : "volume-high"}
            size={28}
            color="#222"
          />
        </TouchableOpacity>
      </View>
      {/* Profile Picture */}
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        <Image
          source={
            imgError
              ? require("../../assets/images/icon.png")
              : { uri: profilePic }
          }
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: "#eee",
          }}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
        {/* Instagram Icon Button */}
        <TouchableOpacity
          style={{ marginTop: 10 }}
          onPress={() => {
            const url = `https://instagram.com/${safeBrand}`;
            Linking.openURL(url);
          }}
          accessibilityLabel="Open Instagram"
        >
          <Ionicons name="logo-instagram" size={32} color="#C13584" />
        </TouchableOpacity>
      </View>
      {/* Gallery with left/right buttons */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          marginTop: 24, // Move the gallery down a bit
        }}
      >
        {/* Left Arrow */}
        <View
          style={{
            width: Dimensions.get("window").width * 0.15,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TouchableOpacity
            onPress={goLeft}
            style={{ padding: 12, zIndex: 2 }}
            accessibilityLabel="Previous"
          >
            <Ionicons name="chevron-back" size={32} color="#222" />
          </TouchableOpacity>
        </View>
        {/* Media Carousel */}
        <View
          style={{
            width: Dimensions.get("window").width * 0.7,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FlatList
            ref={flatListRef}
            data={media}
            keyExtractor={(item) => item.url}
            renderItem={({ item, index }) => (
              <View
                style={{
                  width: Dimensions.get("window").width * 0.7,
                  aspectRatio: 4 / 5,
                  borderRadius: 32,
                  overflow: "hidden",
                  backgroundColor: item.type === "image" ? "#eee" : "#000",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative",
                  alignSelf: "center",
                }}
              >
                {item.type === "image" ? (
                  <Image
                    source={{ uri: item.url }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      borderRadius: 32,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <Video
                    ref={(ref) => {
                      videoRefs.current[`video_${index}`] = ref;
                    }}
                    source={{ uri: item.url }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      borderRadius: 32,
                    }}
                    resizeMode={"cover" as any}
                    useNativeControls={true}
                    shouldPlay={index === currentIndex}
                    isMuted={index !== currentIndex || muted}
                    isLooping={true}
                  />
                )}
              </View>
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{
              justifyContent: "center",
              alignItems: "center",
            }}
            initialScrollIndex={currentIndex}
            onViewableItemsChanged={onViewableItemsChanged.current}
            snapToAlignment="center"
            snapToInterval={Dimensions.get("window").width * 0.7}
            decelerationRate="fast"
            getItemLayout={(_, index) => ({
              length: Dimensions.get("window").width * 0.7,
              offset: Dimensions.get("window").width * 0.7 * index,
              index,
            })}
          />
        </View>
        {/* Right Arrow */}
        <View
          style={{
            width: Dimensions.get("window").width * 0.15,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TouchableOpacity
            onPress={goRight}
            style={{ padding: 12, zIndex: 2 }}
            accessibilityLabel="Next"
          >
            <Ionicons name="chevron-forward" size={32} color="#222" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
