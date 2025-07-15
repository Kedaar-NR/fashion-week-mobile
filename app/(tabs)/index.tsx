import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Video } from "expo-av";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PaginationDots from "../../components/PaginationDots";
import { supabase } from "../../lib/supabase";

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

// Function to get brand ID from brand name
async function getBrandId(brandName: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from("brand")
      .select("id")
      .eq("brand_name", brandName)
      .single();

    if (error || !data) {
      console.log(`Brand not found: ${brandName}`);
      return null;
    }

    return data.id;
  } catch (error) {
    console.log(`Error getting brand ID for ${brandName}:`, error);
    return null;
  }
}

// Function to check if a brand is saved by the current user
async function isBrandSaved(brandId: number, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("saved_brands")
      .select("id")
      .eq("brand_id", brandId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.log("Error checking if brand is saved:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.log("Error checking if brand is saved:", error);
    return false;
  }
}

// Function to save a brand
async function saveBrand(brandId: number, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("saved_brands").insert({
      brand_id: brandId,
      user_id: userId,
    });

    if (error) {
      console.log("Error saving brand:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.log("Error saving brand:", error);
    return false;
  }
}

// Function to unsave a brand
async function unsaveBrand(brandId: number, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("saved_brands")
      .delete()
      .eq("brand_id", brandId)
      .eq("user_id", userId);

    if (error) {
      console.log("Error unsaving brand:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.log("Error unsaving brand:", error);
    return false;
  }
}

async function fetchBrandMediaFromIndex(brand: string) {
  // Fetch index.json from the brand's folder
  const indexUrl = `${BUCKET_URL}/${brand}/index.json`;
  try {
    const res = await fetch(indexUrl);
    if (!res.ok) return null;
    const data = await res.json();
    // console.log(data);
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
        // Move the first video (if any) to the front
        let reorderedFiles = files;
        const firstVideoIdx = files.findIndex((f: any) => f.type === "video");
        if (firstVideoIdx > 0) {
          const [video] = files.splice(firstVideoIdx, 1);
          reorderedFiles = [video, ...files];
        }

        // Fetch brand tagline from database
        let tagline = null;
        try {
          const { data: brandData, error } = await supabase
            .from("brand")
            .select("brand_tagline")
            .eq("brand_name", brand)
            .single();

          if (!error && brandData) {
            tagline = brandData.brand_tagline;
          }
        } catch (error) {
          console.log(`Error fetching tagline for ${brand}:`, error);
        }

        return { brand, media: reorderedFiles, tagline };
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
      tagline: string | null;
    } => !!b
  );
}

export default function HomeScreen() {
  const [brandsMedia, setBrandsMedia] = useState<
    {
      brand: string;
      media: { type: "video" | "image"; url: string; name: string }[];
      tagline: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [verticalIndex, setVerticalIndex] = useState(0); // Which brand
  const [horizontalIndices, setHorizontalIndices] = useState<{
    [brand: string]: number;
  }>({}); // Which media per brand
  const [muted, setMuted] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [savedBrands, setSavedBrands] = useState<Set<string>>(new Set());
  const [session, setSession] = useState<any>(null);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      console.log("📍 Current path: /(tabs)/index");
    }, [])
  );

  // Get current session
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

  // Load saved brands for current user
  useEffect(() => {
    if (!session?.user) return;

    const loadSavedBrands = async () => {
      try {
        const { data, error } = await supabase
          .from("saved_brands")
          .select(
            `
            brand_id,
            brand:brand_id (
              brand_name
            )
          `
          )
          .eq("user_id", session.user.id);

        if (error) {
          console.log("Error loading saved brands:", error);
          return;
        }

        const savedBrandNames = new Set(
          data?.map((item: any) => item.brand?.brand_name).filter(Boolean) || []
        );
        setSavedBrands(savedBrandNames);
      } catch (error) {
        console.log("Error loading saved brands:", error);
      }
    };

    loadSavedBrands();
  }, [session]);

  const handleVerticalScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const newIndex = Math.round(offsetY / screenHeight);
      if (brandsMedia.length > 0 && newIndex >= brandsMedia.length - 1) {
        // Reshuffle brands and reset to top
        const seed = Date.now() % 1000000000;
        const shuffledBrands = shuffleArraySeeded(sanitizedBrands, seed);
        (async () => {
          const all = await fetchAllBrandsMedia(shuffledBrands);
          setBrandsMedia(
            all.filter(
              (
                b
              ): b is {
                brand: string;
                media: { type: "video" | "image"; url: string; name: string }[];
                tagline: string | null;
              } => !!b
            )
          );
          setVerticalIndex(0);
        })();
      } else {
        setVerticalIndex((prev) => (prev !== newIndex ? newIndex : prev));
      }
    },
    [brandsMedia.length]
  );

  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  useEffect(() => {
    const loadBrands = async () => {
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
            tagline: string | null;
          } => !!b
        )
      );
      setLoading(false);
    };
    loadBrands();
  }, []);

  useEffect(() => {
    if (__DEV__) {
      supabase.auth.signInWithPassword({
        email: "test@example.com",
        password: "testpassword",
      });
    }
  }, []);

  // Handle save/unsave brand
  const handleSaveBrand = async (brandName: string) => {
    if (!session?.user) {
      console.log("User not authenticated");
      return;
    }

    try {
      const brandId = await getBrandId(brandName);
      if (!brandId) {
        console.log(`Could not find brand ID for: ${brandName}`);
        return;
      }

      const isCurrentlySaved = savedBrands.has(brandName);

      if (isCurrentlySaved) {
        // Unsave the brand
        const success = await unsaveBrand(brandId, session.user.id);
        if (success) {
          setSavedBrands((prev) => {
            const newSet = new Set(prev);
            newSet.delete(brandName);
            return newSet;
          });
          console.log(`Unsaved brand: ${brandName}`);
        }
      } else {
        // Save the brand
        const success = await saveBrand(brandId, session.user.id);
        if (success) {
          setSavedBrands((prev) => new Set([...prev, brandName]));
          console.log(`Saved brand: ${brandName}`);

          // Show popup only when saving (not unsaving)
          setShowSavedPopup(true);
          setTimeout(() => {
            setShowSavedPopup(false);
          }, 1000); // Hide after 2 seconds
        }
      }
    } catch (error) {
      console.log("Error handling save/unsave:", error);
    }
  };

  // --- Add viewability configs and handlers for robust autoplay ---
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  };

  // Track refs for visible videos per brand
  const videoRefs = useRef<{ [key: string]: any }>({});
  // Track visible horizontal indices per brand
  const horizontalViewable = useRef<{ [brand: string]: number }>({});

  // Handler for horizontal FlatList (media per brand)
  const onHorizontalViewableItemsChanged = React.useRef(
    (brand: string) =>
      async ({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems && viewableItems.length > 0) {
          const idx = viewableItems[0].index;
          horizontalViewable.current[brand] = idx;
          setHorizontalIndices((prev) => ({ ...prev, [brand]: idx }));
          // Autoplay logic: play visible, pause others
          for (let i = 0; i < viewableItems.length; i++) {
            const item = viewableItems[i];
            const key = `${brand}_${item.index}`;
            const ref = videoRefs.current[key];
            if (ref && item.isViewable) {
              try {
                (await ref.playAsync) && ref.playAsync();
              } catch {}
            } else if (ref) {
              try {
                (await ref.pauseAsync) && ref.pauseAsync();
              } catch {}
            }
          }
        }
      }
  );

  // Handler for vertical FlatList (brands)
  const [visibleVerticalIndex, setVisibleVerticalIndex] = useState(0);
  const onVerticalViewableItemsChanged = React.useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems && viewableItems.length > 0) {
        setVisibleVerticalIndex(viewableItems[0].index);
      }
    }
  );

  const renderBrandMedia = React.useCallback(
    ({
      item: { brand, media },
      index: vIndex,
    }: {
      item: { brand: string; media: any[] };
      index: number;
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
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onHorizontalViewableItemsChanged.current(
            brand
          )}
          renderItem={({ item, index }) => {
            // Only play if this brand is the visible vertical brand and this is the visible horizontal media
            const isVisible =
              vIndex === visibleVerticalIndex &&
              (horizontalViewable.current[brand] ?? 0) === index &&
              isScreenFocused;
            const videoKey = `${brand}_${index}`;
            return (
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
                    style={{
                      width: "100%",
                      height: screenHeight,
                      borderRadius: 0,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <Video
                    ref={(ref) => {
                      videoRefs.current[videoKey] = ref;
                    }}
                    source={{ uri: item.url }}
                    style={{
                      width: "100%",
                      height: screenHeight,
                      borderRadius: 0,
                    }}
                    resizeMode={"cover" as any}
                    shouldPlay={isVisible}
                    useNativeControls={false}
                    isLooping={true}
                    isMuted={true}
                    volume={1.0}
                    {...(Platform.OS === "web"
                      ? { playsInline: true, autoPlay: true }
                      : {})}
                  />
                )}
              </View>
            );
          }}
        />
      );
    },
    [
      horizontalIndices,
      insets.bottom,
      isScreenFocused,
      brandsMedia,
      visibleVerticalIndex,
    ]
  );

  if (loading || brandsMedia.length === 0) {
    return <ActivityIndicator size="large" className="flex-1 self-center" />;
  }

  const currentBrand = brandsMedia[verticalIndex]?.brand;
  const isCurrentBrandSaved = currentBrand
    ? savedBrands.has(currentBrand)
    : false;

  return (
    <View style={{ flex: 1 }}>
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

      {/* Brand overlay container at bottom */}
      <View className="absolute bottom-24 left-5 right-5 z-50">
        {/* Saved Brand Popup */}
        {showSavedPopup && (
          <View className="mb-2">
            <View className="bg-black/30 px-4 py-2 rounded-full flex-row items-center justify-center">
              <Text className="text-white text-sm font-semibold text-center">
                Brand Archived
              </Text>
            </View>
          </View>
        )}

        {/* Brand name overlay */}
        {brandsMedia[verticalIndex] && (
          <View className="bg-black/30 px-4 py-3 rounded-full flex-row items-center justify-between">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                // Navigate to brand detail component
                console.log(
                  "Navigating to brand:",
                  brandsMedia[verticalIndex].brand
                );
                router.push({
                  pathname: "/(tabs)/[brand]",
                  params: { brand: brandsMedia[verticalIndex].brand },
                });
              }}
              className="flex-1 items-start justify-center pl-2"
            >
              <Text className="text-white text-sm font-semibold text-left">
                {brandsMedia[verticalIndex].brand}
              </Text>
              <Text className="text-white text-xs opacity-80 text-left mt-1">
                {brandsMedia[verticalIndex].tagline || "No tagline available"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleSaveBrand(brandsMedia[verticalIndex].brand)}
              className="ml-3 items-center justify-center"
            >
              <Ionicons
                name={isCurrentBrandSaved ? "bookmark" : "bookmark-outline"}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Pagination Dots */}
        {brandsMedia[verticalIndex] && (
          <View className="mt-3">
            <PaginationDots
              totalItems={brandsMedia[verticalIndex].media.length}
              currentIndex={
                horizontalIndices[brandsMedia[verticalIndex].brand] || 0
              }
              dotSize={6}
              dotSpacing={4}
              activeColor="#FFFFFF"
              inactiveColor="rgba(255, 255, 255, 0.4)"
            />
          </View>
        )}
      </View>
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
        onScroll={handleVerticalScroll}
        scrollEventThrottle={16}
        renderItem={renderBrandMedia}
        initialScrollIndex={verticalIndex}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onVerticalViewableItemsChanged.current}
      />
    </View>
  );
}
