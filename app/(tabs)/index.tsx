import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Video } from "expo-av";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
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

// Sanitize brand names to remove file extensions
const sanitizedBrands = BRANDS.map((b) => b.replace(/\.[^/.]+$/, ""));

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

function getMediaType(filename: string): "video" | "image" | null {
  if (VIDEO_EXTENSIONS.some((ext) => filename.endsWith(ext))) return "video";
  if (IMAGE_EXTENSIONS.some((ext) => filename.endsWith(ext))) return "image";
  return null;
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

// 1. Fetch all media for all brands at once
async function fetchAllBrandsMedia(brands: string[]) {
  const all = await Promise.all(
    brands.map(async (brand) => {
      const indexUrl = `${BUCKET_URL}/${brand}/index.json`;
      try {
        const res = await fetch(indexUrl);
        if (!res.ok) return null;
        const data = await res.json();
        if (!Array.isArray(data.files)) return null;
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
          .filter(Boolean);
        return { brand, media: files };
      } catch {
        return null;
      }
    })
  );
  // Type guard to filter out nulls
  return all.filter(
    (
      b
    ): b is {
      brand: string;
      media: { type: "video" | "image"; url: string; name: string }[];
    } => !!b
  );
}

export default function HomeScreen() {
  const [brandsMedia, setBrandsMedia] = useState<
    {
      brand: string;
      media: { type: "video" | "image"; url: string; name: string }[];
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [verticalIndex, setVerticalIndex] = useState(0); // Which brand
  const [horizontalIndices, setHorizontalIndices] = useState<{
    [brand: string]: number;
  }>({}); // Which media per brand
  const [muted, setMuted] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const router = useRouter();

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
      const seed = Date.now() % 1000000000;
      const shuffledBrands = shuffleArraySeeded(sanitizedBrands, seed);
      const all = await fetchAllBrandsMedia(shuffledBrands);
      setBrandsMedia(
        all.filter(
          (
            b
          ): b is {
            brand: string;
            media: { type: "video" | "image"; url: string; name: string }[];
          } => !!b
        )
      );
      setLoading(false);
    })();
  }, []);

  if (loading || brandsMedia.length === 0) {
    return <ActivityIndicator size="large" className="flex-1 self-center" />;
  }

  // Render a single brand's media as a horizontal FlatList
  const renderBrandMedia = ({
    item: { brand, media },
  }: {
    item: { brand: string; media: any[] };
  }) => {
    const horizontalIndex = horizontalIndices[brand] || 0;
    return (
      <FlatList
        data={media}
        keyExtractor={(item) => item.url}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="center"
        snapToInterval={Dimensions.get("window").width}
        decelerationRate="fast"
        initialScrollIndex={horizontalIndex}
        getItemLayout={(_, index) => ({
          length: Dimensions.get("window").width,
          offset: Dimensions.get("window").width * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(
            e.nativeEvent.contentOffset.x / Dimensions.get("window").width
          );
          setHorizontalIndices((prev) => ({ ...prev, [brand]: newIndex }));
        }}
        renderItem={({ item, index }) => (
          <View
            style={{
              width: Dimensions.get("window").width,
              height: screenHeight,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {item.type === "image" ? (
              <ExpoImage
                source={{ uri: item.url }}
                style={{ width: "100%", height: screenHeight, borderRadius: 0 }}
                contentFit="cover"
              />
            ) : (
              <Video
                source={{ uri: item.url }}
                style={{ width: "100%", height: screenHeight, borderRadius: 0 }}
                resizeMode={"cover" as any}
                shouldPlay={index === horizontalIndex && isScreenFocused}
                useNativeControls={false}
                isLooping={true}
                isMuted={muted}
                volume={1.0}
              />
            )}
            {/* Brand name overlay bubble above the bottom navbar */}
            <View
              style={{
                position: "absolute",
                bottom: 80, // fixed distance above TabBar
                left: 0,
                right: 0,
                alignItems: "center",
                zIndex: 50,
              }}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  router.push({ pathname: "/brand/[brand]", params: { brand } })
                }
                style={{
                  backgroundColor: "rgba(0,0,0,0.6)",
                  height: 32,
                  minWidth: 180,
                  paddingHorizontal: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  {brand}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Mute button */}
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 96,
                right: 12,
                zIndex: 50,
                width: 44,
                height: 44,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => setMuted((m) => !m)}
            >
              <Ionicons
                name={muted ? "volume-mute" : "volume-high"}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        )}
      />
    );
  };

  return (
    <FlatList
      data={brandsMedia}
      keyExtractor={(item) => item.brand}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      snapToInterval={screenHeight}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({
        length: screenHeight,
        offset: screenHeight * index,
        index,
      })}
      onMomentumScrollEnd={(e) => {
        const newIndex = Math.round(
          e.nativeEvent.contentOffset.y / screenHeight
        );
        setVerticalIndex(newIndex);
      }}
      renderItem={renderBrandMedia}
      initialScrollIndex={verticalIndex}
    />
  );
}
