import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Video } from "expo-av";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  PanResponder,
  Text,
  View,
} from "react-native";

const { height: screenHeight } = Dimensions.get("window");

const BUCKET_URL =
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/brand-content/brand_content";
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const BRANDS = [
  "2001odysey",
  "22kilogram",
  "aliasonline.us",
  "allure.newyork",
  "alreadywritten",
  "angel333online",
  "ArtificialFever",
  "astonecoldstudiosproduction",
  "attachmentsonline",
  "awaitedmilitia",
  "badson.us",
  "berlinc.co",
  "blanksbythirteen",
  "bomiworks",
  "brotherlylove",
  "byjeshal",
  "bykodyphillips",
  "california.arts",
  "chinatowncountryclub",
  "chxmicalover",
  "concrete_orchids",
  "corporateworld",
  "cozy.worldwidee",
  "cyvist",
  "deadatlantic",
  "demiknj",
  "derschutze_clo",
  "ditch",
  "drolandmiller",
  "emestudios_",
  "emptyspaces",
  "eraworldwideclub",
  "eternal_artwear",
  "eternalloveworld",
  "fine.culture",
  "fnkstudios",
  "forcesunseen",
  "forevakaash",
  "fortytwoco",
  "fourfour.jpg",
  "friedrice_nyc",
  "haveyoudiedbefore",
  "__heavencanwait__",
  "heavenonearthstudios",
  "hidden.season",
  "hypedept.co",
  "iconaclub",
  "idle____time",
  "ihp.ihp.ihp",
  "insain.worldwide",
  "kinejkt",
  "kontend__",
  "kyonijr",
  "lantiki_official",
  "lildenimjean",
  "liquidlagoon",
  "maharishi",
  "menacelosangeles",
  "misanthropestudios",
  "Mutimer.co",
  "nihil.ny",
  "nomaintenance",
  "oedemaa",
  "omneeworld",
  "outlw.usa",
  "paradoxeparis",
  "pdf.channel",
  "peaceandwar89",
  "personalfears",
  "poolhousenewyork",
  "profitminded.clo",
  "qbsay",
  "rangercartel",
  "rdvstudios",
  "roypubliclabel",
  "saeminium",
  "sensorydept",
  "septemberseventhstudios",
  "shineluxurystudios",
  "shmuie",
  "sixshooter.us",
  "slovakiandreams",
  "somar.us",
  "srrysora",
  "ssstufff.official",
  "stolenarts_",
  "sundae.school",
  "thegvgallery",
  "throneroomx",
  "vega9602k",
  "vengeance_studios",
  "vicinity_de",
  "winterhouse__",
  "youngchickenpox",
];

// Seeded random number generator (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArraySeeded<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  const random = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fetchBrandMediaFromIndex(brand: string) {
  // Fetch index.json from the brand's folder
  const indexUrl = `${BUCKET_URL}/${brand}/index.json`;
  try {
    const res = await fetch(indexUrl);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.files)) return null;

    // Normalize: get array of filenames (strings)
    const filenames = data.files
      .map((f: any) => (typeof f === "string" ? f : f?.name))
      .filter(Boolean);

    // Prioritize video
    let file = filenames.find((name: string) =>
      VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext))
    );
    let type: "video" | "image" | null = null;
    if (file) type = "video";
    if (!file) {
      file = filenames.find((name: string) =>
        IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext))
      );
      if (file) type = "image";
    }
    if (!file || !type) return null;
    return {
      id: brand,
      type,
      url: `${BUCKET_URL}/${brand}/${file}`,
    };
  } catch {
    return null;
  }
}

const MediaItem = React.memo(
  ({
    item,
    isVisible,
    muted,
    isScreenFocused,
    panHandlers,
  }: {
    item: { id: string; type: "video" | "image"; url: string };
    isVisible: boolean;
    muted?: boolean;
    isScreenFocused: boolean;
    panHandlers?: any;
  }) => {
    if (item.type === "video") {
      return (
        <View
          className="w-full"
          style={{ height: screenHeight }}
          {...(panHandlers || {})}
        >
          <Video
            source={{ uri: item.url }}
            style={{ width: "100%", height: screenHeight }}
            resizeMode={"cover" as any}
            shouldPlay={isVisible && isScreenFocused}
            useNativeControls={false}
            isLooping={true}
            isMuted={muted === undefined ? false : muted}
            volume={1.0}
          />
        </View>
      );
    }
    return (
      <View
        className="w-full"
        style={{ height: screenHeight }}
        {...(panHandlers || {})}
      >
        <ExpoImage
          source={{ uri: item.url }}
          style={{ width: "100%", height: screenHeight }}
          contentFit="cover"
        />
      </View>
    );
  }
);
MediaItem.displayName = "MediaItem";

export default function HomeScreen() {
  const [mediaItems, setMediaItems] = useState<
    { id: string; type: "video" | "image"; url: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [imagesPrefetched, setImagesPrefetched] = useState(false);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 80 });
  const router = useRouter();
  const SWIPE_THRESHOLD = 120;

  // Handle screen focus/blur to pause/resume videos
  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  useEffect(() => {
    (async () => {
      // Use a time-based seed for a different order on every app load
      const seed = Date.now() % 1000000000;
      const shuffledBrands = shuffleArraySeeded(BRANDS, seed);
      const mediaPromises = shuffledBrands.map((brand) =>
        fetchBrandMediaFromIndex(brand)
      );
      const allMedia = (await Promise.all(mediaPromises)).filter(Boolean) as {
        id: string;
        type: "video" | "image";
        url: string;
      }[];
      setMediaItems(allMedia);
      setLoading(false);
    })();
  }, []);

  // Prefetch all images once mediaItems are loaded
  useEffect(() => {
    if (!loading && mediaItems.length > 0) {
      const imageUrls = mediaItems
        .filter((item) => item.type === "image")
        .map((item) => item.url);
      if (imageUrls.length > 0) {
        ExpoImage.prefetch(imageUrls[0])
          .then(() => setFirstImageLoaded(true))
          .catch(() => setFirstImageLoaded(true));
        Promise.all(imageUrls.slice(1).map((url) => ExpoImage.prefetch(url)))
          .then(() => setImagesPrefetched(true))
          .catch(() => setImagesPrefetched(true));
      } else {
        setFirstImageLoaded(true);
        setImagesPrefetched(true);
      }
    }
  }, [loading, mediaItems]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setVisibleIndex(viewableItems[0].index ?? 0);
    }
  });

  // Load mute preference on mount
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("globalMute");
      if (stored !== null) setMuted(stored === "true");
    })();
  }, []);

  // Save mute preference when changed
  useEffect(() => {
    AsyncStorage.setItem("globalMute", muted ? "true" : "false");
  }, [muted]);

  // PanResponder for left swipe on visible media item
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gesture) => {
        // Only allow swipe if touch starts in the middle 70% of the screen
        const x = evt.nativeEvent.pageX;
        const screenWidth = Dimensions.get("window").width;
        const margin = screenWidth * 0.15;
        const inMiddle = x > margin && x < screenWidth - margin;
        return inMiddle && Math.abs(gesture.dx) > 8;
      },
      onMoveShouldSetPanResponder: (evt, gesture) => {
        const x = evt.nativeEvent.pageX;
        const screenWidth = Dimensions.get("window").width;
        const margin = screenWidth * 0.15;
        const inMiddle = x > margin && x < screenWidth - margin;
        return (
          inMiddle &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          Math.abs(gesture.dx) > 8
        );
      },
      onPanResponderMove: () => {}, // No visual feedback
      onPanResponderRelease: (_, gesture) => {
        console.log("PanResponderRelease dx:", gesture.dx);
        if (gesture.dx < -SWIPE_THRESHOLD) {
          // Left swipe detected, extract brand from URL
          const url = mediaItems[visibleIndex]?.url;
          const brand = url
            ? url.split("/brand_content/")[1].split("/")[0]
            : undefined;
          console.log("Left swipe detected for brand:", brand);
          if (brand) {
            try {
              console.log(
                "Attempting navigation to /brand/[brand] with brand:",
                brand
              );
              router.push({ pathname: "/brand/[brand]", params: { brand } });
            } catch (err) {
              console.error("Navigation to brand page failed:", err);
            }
          } else {
            console.error("No brand found for current media item.");
          }
        }
        // Do nothing on insufficient swipe (no bounce back)
      },
    })
  ).current;

  if (loading || !firstImageLoaded) {
    return <ActivityIndicator size="large" className="flex-1 self-center" />;
  }

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {/* Mute button: bright white icon, moved further down from the NavBar */}
      <View
        style={{
          position: "absolute",
          top: 112,
          right: 12,
          zIndex: 50,
          width: 44,
          height: 44,
          justifyContent: "center",
          alignItems: "center",
        }}
        pointerEvents="box-none"
      >
        <Ionicons
          name={muted ? "volume-mute" : "volume-high"}
          size={20}
          color="#fff"
          style={{
            opacity: 1,
            backgroundColor: "transparent",
            borderRadius: 22,
            padding: 6,
            overflow: "hidden",
          }}
          onPress={() => setMuted((m) => !m)}
        />
      </View>
      {/* Brand name overlay at bottom */}
      {mediaItems[visibleIndex] && (
        <View
          className="absolute bottom-24 left-5 right-5 bg-black/30 px-4 py-2 rounded-full items-center justify-center z-50"
          pointerEvents="box-none"
        >
          <Text className="text-white text-sm font-semibold text-center">
            {mediaItems[visibleIndex].id}
          </Text>
        </View>
      )}
      <FlatList
        data={mediaItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          if (index === visibleIndex) {
            console.log("Attaching panHandlers to media item:", item.id);
          }
          return (
            <MediaItem
              item={item}
              isVisible={index === visibleIndex}
              muted={muted}
              isScreenFocused={isScreenFocused}
              panHandlers={
                index === visibleIndex ? panResponder.panHandlers : undefined
              }
            />
          );
        }}
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        className="flex-1"
        removeClippedSubviews={true}
        windowSize={3}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
      />
    </View>
  );
}
