import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  Video,
} from "expo-av";
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
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PaginationDots from "../../components/PaginationDots";
import { feedFilterEmitter } from "../../components/ui/NavBar";
import { supabase } from "../../lib/supabase";

const { height: screenHeight } = Dimensions.get("window");

const BUCKET_URL =
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/brand-content";
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const BRANDS = {
  "5MOREDAYS": "5MOREDAYS",
  "629": "629",
  ABSTRAITE_DESIGN: "ABSTRAITE DESIGN",
  ACDTM: "ACD™",
  ACTIVIST_PARIS: "ACTIVIST PARIS",
  AKHIELO: "AKHIELO",
  ALREADY_WRITTEN: "ALREADY WRITTEN",
  AMBERBYSOUL: "AMBERBYSOUL",
  AMESCENSE: "AMESCENSE",
  ANGEL_ARCADE: "ANGEL ARCADE",
  ANTHONY_JAMES: "ANTHONY JAMES",
  APRILLAND: "APRILLAND",
  ARRIVAL_WORLDWIDE: "ARRIVAL WORLDWIDE",
  A_STONECOLD_STUDIOS_PRODUCTION: "A STONECOLD STUDIOS PRODUCTION",
  BAD_HABITS_LA: "BAD HABITS LA",
  BAGJIO: "BAGJIO",
  BANISHDIARIES: "BANISHDIARIES",
  BANISHEDUSA: "BANISHEDUSA",
  BEANIES: "BEANIES",
  BEANS: "BEANS",
  BELACARTES: "BELACARTES",
  BIRTH_OF_ROYAL_CHILD: "BIRTH OF ROYAL CHILD",
  BIZZRAD: "BIZZRAD",
  BORIS_KRUEGER: "BORIS KRUEGER",
  BORNTODIETM: "BORNTODIE™",
  BRAKKA_GARMENTS: "BRAKKA GARMENTS",
  BRANDONWVARGAS: "BRANDONWVARGAS",
  CAMP_XTRA: "CAMP XTRA",
  CASPER: "CASPER",
  CBAKAPS: "CBAKAPS",
  "CHALK.PRESS": "CHALK.PRESS",
  CHEATIN_SNAKES_WORLDWIDE: "CHEATIN SNAKES WORLDWIDE",
  CHILLDREN: "CHILLDREN",
  CIELOS_LOS_ANGELES: "CIELOS LOS ANGELES",
  CORRUPTKID: "CORRUPTKID",
  COUCOU_BEBE: "COUCOU BEBE",
  COWBOY_HEARTS: "COWBOY HEARTS",
  CRYSTAL_RIVER: "CRYSTAL RIVER",
  CUTS_BY_LOWHEADS: "CUTS BY LOWHEADS",
  DAEKER: "DAEKER",
  DEATH_56_SENTENCE: "DEATH 56 SENTENCE",
  DEMIKNJ: "DEMIKNJ",
  DENIM: "DENIM",
  DESCENDANT: "DESCENDANT",
  "DINGBATS-FONT": "DINGBATS-FONT",
  DOCTORGARMENTZ: "DOCTORGARMENTZ",
  DOLOR: "DOLOR",
  E4ENYTHING: "E4ENYTHING",
  EMERSON_STONE: "EMERSON STONE",
  EMOTIONAL_DISTRESS: "EMOTIONAL DISTRESS",
  EMPTY_SPACES: "EMPTY SPACES",
  EREHWON: "EREHWON",
  EXCESS: "EXCESS",
  EXISTS_PURE: "EXISTS PURE",
  EYECRAVE: "EYECRAVE",
  FACIANE_FASHON: "FACIANE [FÀSH•ON]",
  FAIT_PAR_LUI: "FAIT PAR LUI",
  FALSEWORKCLUB: "FALSEWORKCLUB",
  FISHFELON: "FISHFELON",
  FNKSTUDIOS: "FNKSTUDIOS",
  FOUNTAIN_OF_SOUL: "FOUNTAIN OF SOUL",
  FRAUDULENT: "FRAUDULENT",
  GBUCK: "GBUCK",
  GEMINI: "GEMINI",
  GEN_2: "GEN 2",
  GINKO_ULTRA: "GINKO ULTRA",
  GLVSSIC: "GLVSSIC",
  GOKYO: "GOKYO",
  HAVEYOUDIEDBEFORE: "HAVEYOUDIEDBEFORE",
  HEAVROLET: "HEAVROLET",
  HIS_CARNAGE: "HIS CARNAGE",
  HLYWRK: "HLYWRK",
  HORN_HEROES: "HORN HEROES",
  HUBANE: "HUBANE",
  HWASAN: "HWASAN",
  IDIEDLASTNIGHT: "IDIEDLASTNIGHT",
  IN_LOVING_MEMORY: "IN_LOVING_MEMORY",
  JACKJOHNJR: "JACKJOHNJR",
  JAKISCHRIST: "JAKISCHRIST",
  JALONISDEAD: "JALONISDEAD",
  JAXON_JET: "JAXON JET",
  KITOWARES: "KITOWARES",
  KNARE: "KNARE",
  KORRUPT: "KORRUPT",
  LE_LOSANGE: "LE LOSANGE",
  LILBASTARDBOY: "LILBASTARDBOY",
  LONEARCHIVE: "LONEARCHIVE",
  LOSE_RELIGION: "LOSE RELIGION",
  LOVEDYLANTHOMAS: "LOVEDYLANTHOMAS",
  LOVEHARDT: "LOVEHARDT",
  LOVE_AMERICA: "LOVE, AMERICA",
  LUCIEN_SAGAR: "LUCIEN SAGAR",
  LUXENBURG: "LUXENBURG",
  MANIC_DIARIES: "MANIC DIARIES",
  MICU: "MICU",
  MILES_FRANKLIN: "MILES FRANKLIN",
  MIND_BOWLING: "MIND BOWLING",
  MORALE: "MORALE",
  NETSU_DENIM: "NETSU DENIM",
  NIK_BENTEL_STUDIO: "NIK BENTEL STUDIO",
  "NO.ERRORS": "NO.ERRORS",
  NOCIETY: "NOCIETY",
  NOT1FLAW: "NOT1%FLAW",
  OBJECT_FROM_NOTHING: "OBJECT FROM NOTHING",
  OMNEE_WORLD: "OMNEE WORLD",
  OMOSTUDIOZ: "OMOSTUDIOZ",
  ONLYTHEBADSTUDIOS: "ONLYTHEBADSTUDIOS",
  "PANELS.": "PANELS.",
  PANELS_BY_THOMASJAMES: "PANELS BY THOMASJAMES",
  PARAPHERNALIA_97: "PARAPHERNALIA ⁹⁷",
  PLA4: "PLA4",
  PLAGUEROUND: "PLAGUEROUND",
  PLASTIC_STUDIOS: "PLASTIC STUDIOS",
  PO5HBOY: "PO5HBOY",
  POLO_CUTTY: "POLO CUTTY",
  PRESTON_SEVIN: "PRESTON SEVIN",
  PRIVATE_AFFAIR: "PRIVATE AFFAIR",
  PROHIBITISM: "PROHIBITISM",
  PSYCHWARD: "PSYCHWARD",
  PUBLIC_HOUSING_SKATE_TEAM: "PUBLIC HOUSING SKATE TEAM",
  PUPPET_THEATER: "PUPPET THEATER",
  PURGATORY: "PURGATORY",
  PYTHIA: "PYTHIA",
  RAWCKSTAR_LIFESTYLE: "RAWCKSTAR LIFESTYLE",
  REDHEAT: "REDHEAT",
  REVENIGHTS: "REVENIGHTS",
  RITTEN: "RITTEN",
  ROMANCATCHER: "ROMANCATCHER",
  ROY_PUBLIC_LABEL: "ROY PUBLIC LABEL",
  RSEKAI: "RSEKAI",
  SCAPEGRACE: "SCAPEGRACE",
  SCY_BY_JULIUS: "SCY BY JULIUS",
  SHAWZIP: "SHAWZIP",
  SHEFF: "SHEFF",
  SLUMPMAN: "SLUMPMAN",
  SONGSAMNOUNG: "SONGSAMNOUNG",
  SOUTH_OF_HEAVEN: "SOUTH OF HEAVEN",
  SPECTRUM_THEORY: "SPECTRUM THEORY",
  SQUIGGLES: "SQUIGGLES",
  STAFF_PICKS: "STAFF PICKS",
  STOLEN_ARTS: "STOLEN ARTS",
  STOMACH_: "STOMACH ?",
  SUNNY_UNDERGROUND_MARKET: "SUNNY UNDERGROUND MARKET",
  SUNSHINE_REIGNS: "SUNSHINE REIGNS",
  "SWNK-X9": "SWNK-X9",
  TATE_MARSLAND: "TATE MARSLAND",
  TECNINE_GROUP: "TECNINE GROUP",
  THE_BLANK_TRAVELER: "THE BLANK TRAVELER",
  THE_CHARTREUSE_HUMAN: "THE CHARTREUSE HUMAN",
  THE_LAUGHING_GEISHA: "THE LAUGHING GEISHA",
  THE_PEACEFUL_PEOPLE: "THE PEACEFUL PEOPLE",
  TRIPPIE_GLUCK: "TRIPPIE GLUCK",
  TROUBLE_NYC: "TROUBLE NYC",
  "UNWARRANTED.ATL": "UNWARRANTED.ATL",
  VACANT_WINTER: "VACANT WINTER",
  VENGEANCE_STUDIOS: "VENGEANCE STUDIOS",
  VISUALS_BY_JADA: "VISUALS BY JADA",
  VOSTRETTI: "VOSTRETTI",
  VUOTA: "VUOTA",
  WAVEY_WAKARU: "WAVEY WAKARU",
  WHELM: "WHELM",
  WHYW0ULDULIE: "WHYW0ULDULIE",
  WICKED_GLIMMER: "WICKED GLIMMER",
  WNTD_APPAREL: "WNTD APPAREL",
  WOMENS: "WOMEN'S",
  WORKSOFMADNESS: "WORKSOFMADNESS",
  WORSHIP: "WORSHIP",
  WORSTCASE: "WORSTCASE",
  XENON: "XENON",
  YACHTY_IN_ELIAS: "YACHTY IN ELIAS",
  YAMI_MIYAZAKI: "YAMI MIYAZAKI",
  YOURAVGCADET: "YOURAVGCADET",
  YOUTH_MOVEMENT: "YOUTH MOVEMENT",
} as const;

// Get sanitized brand names (keys) for file paths
const sanitizedBrands = Object.keys(BRANDS);

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
      .eq("media_filepath", brandName)
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
  // Fetch index.json from the brand's scrolling_brand_media folder
  const indexUrl = `${BUCKET_URL}/${brand}/scrolling_brand_media/index.json`;
  console.log(`🔍 [MEDIA DEBUG] Fetching index for brand: ${brand}`);
  console.log(`📍 [MEDIA DEBUG] Index URL: ${indexUrl}`);

  try {
    const startTime = Date.now();
    const res = await fetch(indexUrl);
    const fetchTime = Date.now() - startTime;

    console.log(`⏱️ [MEDIA DEBUG] Fetch took ${fetchTime}ms for ${brand}`);
    console.log(
      `📊 [MEDIA DEBUG] Response status: ${res.status} ${res.statusText}`
    );

    if (!res.ok) {
      console.warn(
        `❌ [MEDIA DEBUG] Failed to fetch index for ${brand}: ${res.status} ${res.statusText}`
      );
      return null;
    }

    const data = await res.json();
    console.log(
      `📄 [MEDIA DEBUG] Index data for ${brand}:`,
      JSON.stringify(data, null, 2)
    );

    if (!Array.isArray(data.files)) {
      console.warn(
        `❌ [MEDIA DEBUG] Invalid index structure for ${brand}: files is not an array`
      );
      console.log(`🔍 [MEDIA DEBUG] Data.files type:`, typeof data.files);
      console.log(`🔍 [MEDIA DEBUG] Data.files value:`, data.files);
      return null;
    }

    console.log(
      `📁 [MEDIA DEBUG] Found ${data.files.length} files for ${brand}`
    );

    // Normalize: get array of filenames (strings)
    const filenames = data.files
      .map((f: any) => (typeof f === "string" ? f : f?.name))
      .filter(Boolean);

    console.log(
      `📝 [MEDIA DEBUG] Normalized filenames for ${brand}:`,
      filenames
    );

    // Prioritize video
    let file = filenames.find((name: string) =>
      VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext))
    );
    let type: "video" | "image" | null = null;
    if (file) {
      type = "video";
      console.log(`🎬 [MEDIA DEBUG] Found video file for ${brand}: ${file}`);
    }
    if (!file) {
      file = filenames.find((name: string) =>
        IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext))
      );
      if (file) {
        type = "image";
        console.log(`🖼️ [MEDIA DEBUG] Found image file for ${brand}: ${file}`);
      }
    }

    if (!file || !type) {
      console.warn(`❌ [MEDIA DEBUG] No valid media files found for ${brand}`);
      console.log(`🔍 [MEDIA DEBUG] Available filenames:`, filenames);
      console.log(`🔍 [MEDIA DEBUG] Video extensions:`, VIDEO_EXTENSIONS);
      console.log(`🔍 [MEDIA DEBUG] Image extensions:`, IMAGE_EXTENSIONS);
      return null;
    }

    const finalUrl = `${BUCKET_URL}/${brand}/scrolling_brand_media/${file}`;
    console.log(
      `✅ [MEDIA DEBUG] Successfully processed ${brand}: ${type} - ${finalUrl}`
    );

    return {
      id: brand,
      type,
      url: finalUrl,
    };
  } catch (error) {
    console.error(`💥 [MEDIA DEBUG] Error fetching media for ${brand}:`, error);
    console.error(`💥 [MEDIA DEBUG] Error details:`, {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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
    console.log(
      `🎬 [MEDIA ITEM DEBUG] Rendering ${item.type} for brand ${item.id}:`
    );
    console.log(`📍 [MEDIA ITEM DEBUG] URL: ${item.url}`);
    console.log(
      `👁️ [MEDIA ITEM DEBUG] Visible: ${isVisible}, Screen focused: ${isScreenFocused}, Muted: ${muted}`
    );

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
            onLoad={() => {
              console.log(
                `✅ [VIDEO DEBUG] Video loaded successfully for ${item.id}: ${item.url}`
              );
            }}
            onLoadStart={() => {
              console.log(
                `⏳ [VIDEO DEBUG] Video load started for ${item.id}: ${item.url}`
              );
            }}
            onError={(error) => {
              console.error(
                `💥 [VIDEO DEBUG] Video error for ${item.id}:`,
                error
              );
              console.error(`💥 [VIDEO DEBUG] Failed URL: ${item.url}`);
            }}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded) {
                console.log(
                  `▶️ [VIDEO DEBUG] Playback status for ${item.id}:`,
                  {
                    isPlaying: status.isPlaying,
                    positionMillis: status.positionMillis,
                    durationMillis: status.durationMillis,
                    shouldPlay: status.shouldPlay,
                  }
                );
              } else if (
                !status.isLoaded &&
                "error" in status &&
                status.error
              ) {
                console.error(
                  `💥 [VIDEO DEBUG] Playback error for ${item.id}:`,
                  status.error
                );
              }
            }}
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
          onLoad={() => {
            console.log(
              `✅ [IMAGE DEBUG] Image loaded successfully for ${item.id}: ${item.url}`
            );
          }}
          onLoadStart={() => {
            console.log(
              `⏳ [IMAGE DEBUG] Image load started for ${item.id}: ${item.url}`
            );
          }}
          onError={(error) => {
            console.error(
              `💥 [IMAGE DEBUG] Image error for ${item.id}:`,
              error
            );
            console.error(`💥 [IMAGE DEBUG] Failed URL: ${item.url}`);
          }}
        />
      </View>
    );
  }
);
MediaItem.displayName = "MediaItem";

// 1. Fetch all media for all brands at once
async function fetchAllBrandsMedia(brands: string[]) {
  console.log(
    `🚀 [BRANDS DEBUG] Starting fetchAllBrandsMedia for ${brands.length} brands`
  );
  console.log(`📋 [BRANDS DEBUG] Brand list:`, brands);

  const startTime = Date.now();
  const all = await Promise.all(
    brands.map(async (brand, index) => {
      console.log(
        `🔄 [BRANDS DEBUG] Processing brand ${index + 1}/${brands.length}: ${brand}`
      );
      const indexUrl = `${BUCKET_URL}/${brand}/scrolling_brand_media/index.json`;

      try {
        console.log(
          `📡 [BRANDS DEBUG] Fetching index for ${brand}: ${indexUrl}`
        );
        const fetchStart = Date.now();
        const res = await fetch(indexUrl);
        const fetchTime = Date.now() - fetchStart;

        console.log(
          `⏱️ [BRANDS DEBUG] Fetch for ${brand} took ${fetchTime}ms - Status: ${res.status}`
        );

        if (!res.ok) {
          console.warn(
            `❌ [BRANDS DEBUG] Failed to fetch ${brand}: ${res.status} ${res.statusText}`
          );
          return null;
        }

        const data = await res.json();
        console.log(`📄 [BRANDS DEBUG] Index data for ${brand}:`, {
          filesCount: Array.isArray(data.files)
            ? data.files.length
            : "Not an array",
          filesType: typeof data.files,
          sampleFiles: Array.isArray(data.files)
            ? data.files.slice(0, 3)
            : data.files,
        });

        if (!Array.isArray(data.files)) {
          console.warn(
            `❌ [BRANDS DEBUG] Invalid files structure for ${brand}:`,
            data
          );
          return null;
        }

        const rawFiles = data.files
          .map((f: any) => (typeof f === "string" ? f : f?.name))
          .filter(Boolean);

        console.log(`📁 [BRANDS DEBUG] Raw files for ${brand}:`, rawFiles);

        const files = rawFiles
          .map((name: string) => {
            const type = getMediaType(name);
            const result = type
              ? {
                  type,
                  url: `${BUCKET_URL}/${brand}/scrolling_brand_media/${name}`,
                  name,
                }
              : null;

            if (result) {
              console.log(
                `✅ [BRANDS DEBUG] Valid media file for ${brand}: ${name} (${type})`
              );
            } else {
              console.log(
                `⚠️ [BRANDS DEBUG] Skipped file for ${brand}: ${name} (unknown type)`
              );
            }

            return result;
          })
          .filter(Boolean);

        console.log(
          `🎯 [BRANDS DEBUG] Processed ${files.length} valid media files for ${brand}`
        );

        // Move the first video (if any) to the front
        let reorderedFiles = files;
        const firstVideoIdx = files.findIndex((f: any) => f.type === "video");

        if (firstVideoIdx > 0) {
          console.log(
            `🎬 [BRANDS DEBUG] Moving video to front for ${brand}: video at index ${firstVideoIdx}`
          );
          const [video] = files.splice(firstVideoIdx, 1);
          reorderedFiles = [video, ...files];
        } else if (firstVideoIdx === 0) {
          console.log(`🎬 [BRANDS DEBUG] Video already at front for ${brand}`);
        } else {
          console.log(
            `📷 [BRANDS DEBUG] No videos found for ${brand}, keeping original order`
          );
        }

        // Fetch brand tagline from database
        let tagline = null;
        try {
          console.log(
            `📝 [BRANDS DEBUG] Fetching tagline for ${brand} from database`
          );
          const taglineStart = Date.now();
          const { data: brandData, error } = await supabase
            .from("brand")
            .select("brand_tagline")
            .eq("brand_name", brand)
            .single();

          const taglineTime = Date.now() - taglineStart;
          console.log(
            `⏱️ [BRANDS DEBUG] Tagline fetch for ${brand} took ${taglineTime}ms`
          );

          if (!error && brandData) {
            tagline = brandData.brand_tagline;
            console.log(
              `✅ [BRANDS DEBUG] Got tagline for ${brand}: "${tagline}"`
            );
          } else {
            console.log(
              `⚠️ [BRANDS DEBUG] No tagline found for ${brand}:`,
              error
            );
          }
        } catch (error) {
          console.error(
            `💥 [BRANDS DEBUG] Error fetching tagline for ${brand}:`,
            error
          );
        }

        const result = { brand, media: reorderedFiles, tagline };
        console.log(
          `✅ [BRANDS DEBUG] Successfully processed ${brand}: ${reorderedFiles.length} media files, tagline: ${tagline ? '"' + tagline + '"' : "null"}`
        );

        return result;
      } catch (error) {
        console.error(`💥 [BRANDS DEBUG] Error processing ${brand}:`, error);
        console.error(`💥 [BRANDS DEBUG] Error details for ${brand}:`, {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : String(error),
          indexUrl,
        });
        return null;
      }
    })
  );

  const totalTime = Date.now() - startTime;
  const successful = all.filter(Boolean);
  const failed = all.length - successful.length;

  console.log(
    `🏁 [BRANDS DEBUG] fetchAllBrandsMedia completed in ${totalTime}ms`
  );
  console.log(
    `📊 [BRANDS DEBUG] Results: ${successful.length} successful, ${failed} failed`
  );
  console.log(
    `📋 [BRANDS DEBUG] Successful brands:`,
    successful.map((b) => b?.brand)
  );

  if (failed > 0) {
    const failedBrands = brands.filter((brand, index) => !all[index]);
    console.warn(`⚠️ [BRANDS DEBUG] Failed brands:`, failedBrands);
  }

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

// --- Fetch Products Data ---
async function fetchAllProductsMedia(products: any[]) {
  console.log(
    `🚀 [PRODUCTS DEBUG] Starting fetchAllProductsMedia for ${products.length} products`
  );

  const startTime = Date.now();
  const all = await Promise.all(
    products.map(async (product, index) => {
      console.log(
        `🔄 [PRODUCTS DEBUG] Processing product ${index + 1}/${products.length}: ${product.product_name}`
      );

      try {
        const brandKey =
          product.brand?.media_filepath ||
          product.media_filepath?.split("/")[0];
        const indexUrl = `${BUCKET_URL}/${brandKey}/scrolling_product_media/${product.media_filepath?.split("/")[2] || "unknown"}/index.json`;

        console.log(
          `📡 [PRODUCTS DEBUG] Fetching index for ${product.product_name}: ${indexUrl}`
        );
        const fetchStart = Date.now();
        const res = await fetch(indexUrl);
        const fetchTime = Date.now() - fetchStart;

        console.log(
          `⏱️ [PRODUCTS DEBUG] Fetch for ${product.product_name} took ${fetchTime}ms - Status: ${res.status}`
        );

        if (!res.ok) {
          console.warn(
            `❌ [PRODUCTS DEBUG] Failed to fetch ${product.product_name}: ${res.status} ${res.statusText}`
          );
          return null;
        }

        const data = await res.json();
        if (!Array.isArray(data.files)) {
          console.warn(
            `❌ [PRODUCTS DEBUG] Invalid files structure for ${product.product_name}:`,
            data
          );
          return null;
        }

        const rawFiles = data.files
          .map((f: any) => (typeof f === "string" ? f : f?.name))
          .filter(Boolean);

        const files = rawFiles
          .map((name: string) => {
            const type = getMediaType(name);
            return type
              ? {
                  type,
                  url: `${BUCKET_URL}/${brandKey}/scrolling_product_media/${product.media_filepath?.split("/")[2] || "unknown"}/${name}`,
                  name,
                }
              : null;
          })
          .filter(Boolean);

        // Prioritize videos
        let reorderedFiles = files;
        const firstVideoIdx = files.findIndex((f: any) => f.type === "video");
        if (firstVideoIdx > 0) {
          const [video] = files.splice(firstVideoIdx, 1);
          reorderedFiles = [video, ...files];
        }

        return {
          product: product.product_name,
          brand: product.brand?.brand_name || "Unknown",
          media: reorderedFiles,
          tagline: `${product.brand?.brand_name || "Unknown"} - ${product.product_name}`,
          price: product.price,
          type: "product",
        };
      } catch (error) {
        console.error(
          `💥 [PRODUCTS DEBUG] Error processing ${product.product_name}:`,
          error
        );
        return null;
      }
    })
  );

  const successful = all.filter(Boolean);
  const totalTime = Date.now() - startTime;

  console.log(
    `🏁 [PRODUCTS DEBUG] fetchAllProductsMedia completed in ${totalTime}ms`
  );
  console.log(
    `📊 [PRODUCTS DEBUG] Results: ${successful.length} successful, ${all.length - successful.length} failed`
  );

  return successful.filter(
    (
      p
    ): p is {
      product: string;
      brand: string;
      media: { type: "video" | "image"; url: string; name: string }[];
      tagline: string;
      price: number | null;
      type: "product";
    } => !!p
  );
}

// --- Fetch Products from Database ---
async function fetchProductsFromDatabase() {
  try {
    console.log(`🚀 [PRODUCTS DEBUG] Fetching products from database`);
    const { data, error } = await supabase
      .from("product")
      .select(
        `
        id,
        product_name,
        product_desc,
        media_filepath,
        price,
        type,
        color,
        brand:brand_id (
          id,
          brand_name,
          brand_tagline,
          media_filepath
        )
      `
      )
      .limit(50); // Limit for performance

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    console.log(
      `✅ [PRODUCTS DEBUG] Fetched ${data?.length || 0} products from database`
    );
    return data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// --- Fetch Following Data ---
async function fetchFollowingMedia(userId?: string) {
  console.log(
    `🚀 [FOLLOWING DEBUG] Starting fetchFollowingMedia - fetching saved brands for user: ${userId}`
  );

  if (!userId) {
    console.log(
      `⚠️ [FOLLOWING DEBUG] No user ID provided, returning empty array`
    );
    return [];
  }

  try {
    // Fetch saved brands for the user
    const { data: savedBrandsData, error } = await supabase
      .from("saved_brands")
      .select(
        `
        id,
        brand_id,
        brand:brand_id (
          id,
          brand_name,
          brand_tagline,
          media_filepath
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching saved brands:", error);
      return [];
    }

    console.log(
      `✅ [FOLLOWING DEBUG] Fetched ${savedBrandsData?.length || 0} saved brands`
    );

    const brandKeys =
      savedBrandsData
        ?.map((item) => (item as any).brand?.media_filepath)
        .filter(Boolean) || [];
    return await fetchAllBrandsMedia(brandKeys);
  } catch (error) {
    console.error("Error fetching following media:", error);
    return [];
  }
}

// --- Fetch Featured Data ---
async function fetchFeaturedMedia() {
  console.log(
    `🚀 [FEATURED DEBUG] Starting fetchFeaturedMedia - fetching featured content`
  );

  // For now, this will return a curated selection of popular brands
  // In a real implementation, you'd have a featured content system
  const featuredBrands = [
    "629",
    "A_STONECOLD_STUDIOS_PRODUCTION",
    "ABSTRAITE_DESIGN",
    "ACTIVIST_PARIS",
    "AKHIELO",
  ];
  return await fetchAllBrandsMedia(featuredBrands);
}

// --- Recommendation Algorithm ---
function recommendBrands(
  allBrands: string[],
  scores: {
    [brand: string]: {
      saves: number;
      doubleTaps: number;
      linger: number;
      lastSeen: number;
    };
  },
  sessionSet: Set<string>,
  userId?: string // Add userId for seeding
) {
  // If this is the first round (sessionSet is empty), randomize order for each user
  if (!sessionSet || sessionSet.size === 0) {
    // Use a seeded shuffle for per-user randomness
    const seed = userId
      ? Array.from(userId).reduce((acc, c) => acc + c.charCodeAt(0), 0)
      : Date.now();
    return shuffleArraySeeded(allBrands, seed);
  }
  // Otherwise, use adaptive scoring, but still show all brands (best matches first)
  const scored = allBrands.map((brand) => {
    const s = scores[brand] || {
      saves: 0,
      doubleTaps: 0,
      linger: 0,
      lastSeen: 0,
    };
    return {
      brand,
      score: 10 * s.saves + 10 * s.doubleTaps + s.linger,
      lastSeen: s.lastSeen,
      isNew: !sessionSet.has(brand),
    };
  });
  // Sort by score desc, then lastSeen desc
  scored.sort((a, b) => b.score - a.score || b.lastSeen - a.lastSeen);
  // Show all brands exactly once, best matches first
  const usedBrands = new Set<string>();
  const ordered = [];
  for (const b of scored) {
    if (!usedBrands.has(b.brand)) {
      ordered.push(b);
      usedBrands.add(b.brand);
    }
  }
  return ordered.filter(Boolean).map((b) => b!.brand);
}

// --- Brand AI Summaries ---
const BRAND_AI_SUMMARIES: { [brand: string]: string } = {
  "2001odysey": "Futuristic fashion brand, see 2001odysey.org",
  "22kilogram": "Streetwear label, official site 22kilogram.com",
  "aliasonline.us": "Hype drops, often sell out, shop at aliasonline.us",
  "allure.newyork": "New York-based, new collection, allurenewyork.com",
  alreadywritten: "Contemporary label, already-written.com",
  angel333online: "Mysterious/cryptic, shop at angel333.online",
  ArtificialFever: "Minimalist, avant-garde, artificialfever.com",
  astonecoldstudiosproduction:
    "London-based, denim focus, stonecoldstudios.co.uk",
  attachmentsonline: "Classic American merch, currently closed",
  awaitedmilitia: "Streetwear, SMS/email signups, awaitedmilitia.com",
  "badson.us": "Utah-based, light-themed, badson.us",
  "berlinc.co": "California-based, quality essentials",
  blanksbythirteen: "US-made basics, blanksbythirteen.com",
  bomiworks: "Experimental, bomiworks.com",
  brotherlylove: "Philly-based, capsule drops, brotherlylove.store",
  byjeshal: "Purpose-driven, jeshal.net",
  bykodyphillips: "Unique pants, press/stylist focus, kodyphillips.com",
  "california.arts": "Minimalist California style, california-arts.com",
  chinatowncountryclub:
    "Retail/cafe, global shipping, chinatowncountryclub.com",
  chxmicalover: "Edgy, www.chxmicalover.com",
  concrete_orchids: "Urban-inspired, concreteorchids.com",
  corporateworld: "Hopeful, music collabs, corporateworld.shop",
  "cozy.worldwidee": "Global menswear, cozyworldwide.co",
  cyvist: "Womenswear coming soon, cyvist.com",
  deadatlantic: "Outdoor-inspired, deadatlantic.com",
  demiknj: "Unique, fast shipping, demiknj.com",
  derschutze_clo: "Wearable art, London/NYC, derschutze.com",
  ditch: "Blank basics, Discord, ditch.la/store",
  drolandmiller: "Collection live, drolandmiller.com",
  emestudios_: "Grateful, global shipping, emestudios.com",
  emptyspaces: "Current collection, empty-spaces.live",
  eraworldwideclub: "Raw style, eraworldwide.club",
  eternal_artwear: "Resurrection theme, responsive support",
  eternalloveworld: "LA-based, new collection, eternallove.world",
  "fine.culture": "Fast shipping, community, fineculturee.com",
  fnkstudios: "Discord, PR/support focus, fnkstudios.com",
  forcesunseen: "Conceptual, mysterious themes",
  forevakaash: "Legacy brand, site closed, forevakaash.com",
  fortytwoco: "Restocks, contact info, fortytwoco.net",
  "fourfour.jpg": "Top tier, hand-waxed denim, fourfouronline.com",
  friedrice_nyc: "NYC creative, friedrice-nyc.com",
  haveyoudiedbefore: "LA-based, drop dates, haveyoudiedbefore.online",
  __heavencanwait__: "Competitions, heaven can wait, heavencanwait.store",
  heavenonearthstudios:
    "Christian streetwear, all sales final, heavenonearth.shop",
  "hidden.season": "Open site, by Jordan Killgore, hiddenseason.com",
  "hypedept.co": "Customer support focus, hypedept.com",
  iconaclub: "Mini capsule drops, iconaclub.com",
  idle____time: "Orders in production, findingpure.com/store",
  "ihp.ihp.ihp": "Positive vibes, imhappypromise.com",
  "insain.worldwide": "Forged road theme, support info, insainworldwide.com",
  kinejkt: "Art-focused, kinejkt.com",
  kontend__: "Journey theme, no website",
  kyonijr: "Kyoni online, kyoni.online",
  lantiki_official: "Tokyo/Kobe, lantikimarket.com",
  lildenimjean: "Faded clothes, passionate design, lildenimjean.com",
  liquidlagoon: "New opening, liquidlagoon.com",
  maharishi: "Pacifist military design, London, maharishi",
  menacelosangeles: "LA-based, menacelosangeles.com",
  misanthropestudios: "SMS updates, misanthropestudios.us",
  "Mutimer.co": "Melbourne-based, free shipping, mutimer.co",
  "nihil.ny": "Minimalist, nihilny.com",
  nomaintenance: "Memory-themed, nomaintenance.us",
  oedemaa: "Chernihiv-based, oedema.studio",
  omneeworld: "4-year drop, omnee.world",
  "outlw.usa": "Exclusive, outlw.xyz",
  paradoxeparis: "Parisian artisanal, paradoxeparis.com",
  "pdf.channel": "Project-based, pdfchannel.com",
  peaceandwar89: "Contact info, peaceandwar.store",
  personalfears: "NYC jewelry, personalfears.com",
  poolhousenewyork: "Classic style, poolhousenewyork.com",
  "profitminded.clo": "Free shipping, early access, profitmindedclothing.com",
  qbsay: "Worldwide shipping, qbsay.com",
  rangercartel: "Bridge theme, rangercartel.com",
  rdvstudios: "Studio, rdvstudios.xyz",
  roypubliclabel: "Private label, royprivatelabel.com",
  saeminium: "Artist-driven, saeminiumgallery",
  sensorydept: "Band/brand hybrid, sensorydept.com",
  septemberseventhstudios: "Anniversary sale, septemberseventhh.com",
  shineluxurystudios: "Luxury, shineluxury.com",
  shmuie: "Pop-ups, seasonless, shmuie.com",
  "sixshooter.us": "Denim/zip-ups, sixshooter.shop",
  slovakiandreams: "Survivor theme, slovakian-dreams.com",
  "somar.us": "Somar, somar.us",
  srrysora: "Reset theme, new site coming",
  "ssstufff.official": "Inspired by chaos, stores in Spain, ssstufff.com",
  stolenarts_: "By Nolovescott, stolenarts.us",
  "sundae.school": "Higher education theme, sundaeschool.com",
  thegvgallery: "Imperfection theme, thegvgallery.com",
  throneroomx: "Ambivalence archive, digital art",
  vega9602k: "Activewear, vega.rip",
  vengeance_studios: "Mystery theme, vengeancestudios.store ",
};

export default function HomeScreen() {
  // --- Adaptive Recommendation State ---
  const [brandScores, setBrandScores] = useState<{
    [brand: string]: {
      saves: number;
      doubleTaps: number;
      linger: number;
      lastSeen: number;
    };
  }>({});
  const [sessionBrands, setSessionBrands] = useState<Set<string>>(new Set());
  const lingerTimers = useRef<{ [brand: string]: number }>({});

  const [brandsMedia, setBrandsMedia] = useState<
    {
      brand: string;
      product?: string;
      media: { type: "video" | "image"; url: string; name: string }[];
      tagline: string | null;
      price?: number | null;
      type?: "brand" | "product";
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
  const lastTapRef = useRef<{ [key: string]: number }>({});
  const [filter, setFilter] = useState<"all" | "liked">("all");
  const [contentType, setContentType] = useState<
    "brands" | "products" | "following" | "featured"
  >("brands");
  const isFocused = useIsFocused();
  const [allPaused, setAllPaused] = useState(false);

  // --- Authentication Setup ---
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

  // Refresh session when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
    }, [])
  );

  // Function to fetch user's saved brands from database
  const fetchSavedBrands = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from("saved_brands")
        .select(
          `
          id,
          brand_id,
          brand:brand_id (
            id,
            brand_name
          )
        `
        )
        .eq("user_id", session.user.id);

      if (error) {
        console.log("Error fetching saved brands:", error);
        return;
      }

      // Transform the data to get brand names
      const brandNames = (data || [])
        .map((item: any) => item.brand?.brand_name)
        .filter(Boolean);

      setSavedBrands(new Set(brandNames));
    } catch (error) {
      console.log("Error fetching saved brands:", error);
    }
  };

  // Fetch saved brands when session changes
  useEffect(() => {
    if (session?.user) {
      fetchSavedBrands();
    }
  }, [session]);

  // Refresh saved brands when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (session?.user) {
        fetchSavedBrands();
      }
    }, [session])
  );

  // Mute all videos immediately when the home tab loses focus
  useEffect(() => {
    if (!isFocused) {
      Object.values(videoRefs.current).forEach((ref) => {
        if (ref && ref.setStatusAsync) {
          ref.setStatusAsync({ isMuted: true }).catch(() => {});
        }
      });
    }
  }, [isFocused]);

  useEffect(() => {
    const handler = (newFilter: "all" | "liked") => setFilter(newFilter);
    feedFilterEmitter.on("filter", handler);
    return () => {
      feedFilterEmitter.off("filter", handler);
    };
  }, []);

  useEffect(() => {
    const handler = (
      newContentType: "brands" | "products" | "following" | "featured"
    ) => {
      setContentType(newContentType);
      setLoading(true);
      setVerticalIndex(0);
    };
    feedFilterEmitter.on("contentType", handler);
    return () => {
      feedFilterEmitter.off("contentType", handler);
    };
  }, []);

  // --- Track Linger Time ---
  useEffect(() => {
    if (brandsMedia.length === 0) return;
    const brand = brandsMedia[verticalIndex]?.brand;
    if (!brand) return;
    const start = Date.now();
    lingerTimers.current[brand] = start;
    return () => {
      const end = Date.now();
      const linger = Math.floor(
        (end - (lingerTimers.current[brand] || end)) / 1000
      );
      setBrandScores((prev) => ({
        ...prev,
        [brand]: {
          ...(prev[brand] || {
            saves: 0,
            doubleTaps: 0,
            linger: 0,
            lastSeen: 0,
          }),
          linger: (prev[brand]?.linger || 0) + linger,
          lastSeen: end,
        },
      }));
    };
  }, [verticalIndex, brandsMedia]);

  // --- Track Saves/Double-Taps ---
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
      setBrandScores((prev) => ({
        ...prev,
        [brandName]: {
          ...(prev[brandName] || {
            saves: 0,
            doubleTaps: 0,
            linger: 0,
            lastSeen: 0,
          }),
          saves: isCurrentlySaved
            ? (prev[brandName]?.saves || 1) - 1
            : (prev[brandName]?.saves || 0) + 1,
          lastSeen: Date.now(),
        },
      }));
    } catch (error) {
      console.log("Error handling save/unsave:", error);
    }
  };

  // --- Load Content Based on Type ---
  const loadContent = async () => {
    console.log(
      `🚀 [LOAD DEBUG] Starting content loading for type: ${contentType}`
    );
    setLoading(true);

    try {
      let content: any[] = [];

      switch (contentType) {
        case "brands":
          console.log(
            `📊 [LOAD DEBUG] Loading brands - Available brands count: ${sanitizedBrands.length}`
          );
          const recommended = recommendBrands(
            sanitizedBrands,
            brandScores,
            sessionBrands,
            session?.user?.id
          );
          const brandsContent = await fetchAllBrandsMedia(recommended);
          content = brandsContent.map((b) => ({ ...b, type: "brand" }));
          setSessionBrands(new Set(recommended));
          break;

        case "products":
          console.log(`🛍️ [LOAD DEBUG] Loading products from database`);
          const productsData = await fetchProductsFromDatabase();
          const productsContent = await fetchAllProductsMedia(productsData);
          content = productsContent;
          break;

        case "following":
          console.log(`👥 [LOAD DEBUG] Loading following content`);
          const followingContent = await fetchFollowingMedia(session?.user?.id);
          content = followingContent.map((b) => ({ ...b, type: "brand" }));
          break;

        case "featured":
          console.log(`⭐ [LOAD DEBUG] Loading featured content`);
          const featuredContent = await fetchFeaturedMedia();
          content = featuredContent.map((b) => ({ ...b, type: "brand" }));
          break;

        default:
          console.warn(`❌ [LOAD DEBUG] Unknown content type: ${contentType}`);
          break;
      }

      console.log(
        `✅ [LOAD DEBUG] Successfully loaded ${content.length} items for ${contentType}`
      );
      setBrandsMedia(content);
      setVerticalIndex(0);
      setLoading(false);
    } catch (error) {
      console.error(
        `💥 [LOAD DEBUG] Error loading ${contentType} content:`,
        error
      );
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load content when type changes
  useEffect(() => {
    if (contentType) {
      loadContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  const handleVerticalScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const newIndex = Math.round(offsetY / screenHeight);

      console.log(
        `📜 [SCROLL DEBUG] Scroll event - offsetY: ${offsetY}, newIndex: ${newIndex}, brandsMedia.length: ${brandsMedia.length}`
      );

      if (brandsMedia.length > 0 && newIndex >= brandsMedia.length - 1) {
        console.log(
          `🔄 [SCROLL DEBUG] Reached end of feed, triggering reload for ${contentType}...`
        );

        // Only reshuffle for brands content type
        if (contentType === "brands") {
          console.log(
            `📈 [SCROLL DEBUG] Current brand scores before reshuffle:`,
            brandScores
          );
          console.log(
            `🎯 [SCROLL DEBUG] Session brands before reshuffle:`,
            Array.from(sessionBrands)
          );

          // Reshuffle brands and reset to top
          const startTime = Date.now();
          const recommended = recommendBrands(
            sanitizedBrands,
            brandScores,
            sessionBrands
          );
          const recommendTime = Date.now() - startTime;

          console.log(
            `🤖 [SCROLL DEBUG] Reshuffle recommendation took ${recommendTime}ms`
          );
          console.log(`📋 [SCROLL DEBUG] New recommended brands:`, recommended);

          (async () => {
            const fetchStart = Date.now();
            const all = await fetchAllBrandsMedia(recommended);
            const fetchTime = Date.now() - fetchStart;

            console.log(
              `📁 [SCROLL DEBUG] Reshuffle media fetch took ${fetchTime}ms`
            );
            console.log(
              `✅ [SCROLL DEBUG] Loaded ${all.length} brands for reshuffle`
            );

            const finalContent = all.map((b) => ({
              ...b,
              type: "brand" as const,
            }));

            console.log(
              `🎬 [SCROLL DEBUG] Final reshuffled content:`,
              finalContent.map((b) => ({
                brand: b.brand,
                mediaCount: b.media.length,
              }))
            );

            setBrandsMedia(finalContent);
            setSessionBrands(new Set(recommended));
            setVerticalIndex(0);

            console.log(
              `🏁 [SCROLL DEBUG] Reshuffle completed, reset to index 0`
            );
          })();
        } else {
          // For other content types, just reload the content
          console.log(`🔄 [SCROLL DEBUG] Reloading ${contentType} content`);
          loadContent();
        }
      } else {
        if (newIndex !== verticalIndex) {
          console.log(
            `📍 [SCROLL DEBUG] Index changed from ${verticalIndex} to ${newIndex}`
          );
          if (brandsMedia[newIndex]) {
            console.log(
              `🎯 [SCROLL DEBUG] Now viewing brand: ${brandsMedia[newIndex].brand}`
            );
          }
        }
        setVerticalIndex((prev) => (prev !== newIndex ? newIndex : prev));
      }
    },
    [brandsMedia.length, brandScores, sessionBrands, verticalIndex]
  );

  const [visibleVerticalIndex, setVisibleVerticalIndex] = useState(0);
  // Pause all videos on screen blur/unfocus
  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      setAllPaused(false);
      // Removed restore visibleVerticalIndex logic from here to prevent infinite loop
      return () => {
        setIsScreenFocused(false);
        setAllPaused(true);
        setVisibleVerticalIndex(-1); // No video is visible
        updateVideoPlayback({ brand: "", hIndex: 0, muted: true, play: false });
        Object.values(videoRefs.current).forEach((ref) => {
          if (ref && ref.pauseAsync) {
            ref.pauseAsync().catch(() => {});
          }
          if (ref && ref.setStatusAsync) {
            ref.setStatusAsync({ isMuted: true }).catch(() => {});
          }
        });
      };
    }, [])
  );

  // Restore visibleVerticalIndex and playback only when tab is focused and index is -1
  useEffect(() => {
    if (isScreenFocused && visibleVerticalIndex === -1) {
      const restoreIndex = verticalIndex || 0;
      setVisibleVerticalIndex(restoreIndex);
      const brand = brandsMedia[restoreIndex]?.brand;
      const hIndex = horizontalIndices[brand] || 0;
      updateVideoPlayback({ brand, hIndex, muted, play: true });
    }
  }, [
    isScreenFocused,
    visibleVerticalIndex,
    verticalIndex,
    brandsMedia,
    horizontalIndices,
    muted,
  ]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    })
      .then(() => {
        console.log("[AUDIO] Audio mode set successfully");
      })
      .catch((e) => {
        console.log("[AUDIO] Error setting audio mode:", e);
      });
  }, []);

  // --- Add viewability configs and handlers for robust autoplay ---
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  };

  // Track refs for visible videos per brand
  const videoRefs = useRef<{ [key: string]: any }>({});
  // Track visible horizontal indices per brand
  const horizontalViewable = useRef<{ [brand: string]: number }>({});

  // --- Helper: Pause and mute all videos except the visible one ---
  function updateVideoPlayback({
    brand,
    hIndex,
    muted,
    play,
  }: {
    brand: string;
    hIndex: number;
    muted: boolean;
    play: boolean;
  }) {
    Object.entries(videoRefs.current).forEach(([key, ref]) => {
      if (ref && ref.pauseAsync) {
        ref.pauseAsync().catch(() => {});
      }
      if (ref && ref.setStatusAsync) {
        ref.setStatusAsync({ isMuted: true }).catch(() => {});
      }
    });
    const visibleKey = `${brand}_${hIndex}`;
    const visibleRef = videoRefs.current[visibleKey];
    if (visibleRef) {
      if (play && visibleRef.playAsync) {
        visibleRef.playAsync().catch(() => {});
      }
      if (visibleRef.setStatusAsync) {
        visibleRef.setStatusAsync({ isMuted: muted }).catch(() => {});
      }
    }
  }

  // Handler for horizontal FlatList (media per brand)
  const onHorizontalViewableItemsChanged = React.useRef(
    (brand: string) =>
      async ({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems && viewableItems.length > 0) {
          const idx = viewableItems[0].index;
          horizontalViewable.current[brand] = idx;
          setHorizontalIndices((prev) => ({ ...prev, [brand]: idx }));
          updateVideoPlayback({ brand, hIndex: idx, muted, play: true });
        } else {
          updateVideoPlayback({ brand, hIndex: 0, muted: true, play: false });
        }
      }
  );

  // Handler for vertical FlatList (brands)
  const onVerticalViewableItemsChanged = React.useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems && viewableItems.length > 0) {
        setVisibleVerticalIndex(viewableItems[0].index);
        const vIndex = viewableItems[0].index;
        const brand = brandsMedia[vIndex]?.brand;
        const hIndex = horizontalIndices[brand] || 0;
        updateVideoPlayback({ brand, hIndex, muted, play: true });
      } else {
        // Pause/mute all if nothing visible
        updateVideoPlayback({ brand: "", hIndex: 0, muted: true, play: false });
      }
    }
  );

  const renderBrandMedia = React.useCallback(
    ({
      item,
      index: vIndex,
    }: {
      item: {
        brand: string;
        product?: string;
        media: any[];
        type?: "brand" | "product";
      };
      index: number;
    }) => {
      const { brand, media } = item;
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
          // Remove initialScrollIndex to always start at 0 and avoid duplicate media
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
            const isVisible =
              vIndex === visibleVerticalIndex &&
              (horizontalViewable.current[brand] ?? 0) === index &&
              isScreenFocused &&
              !allPaused &&
              visibleVerticalIndex !== -1;
            const videoKey = `${brand}_${index}`;
            const lastTapKey = `${brand}_${index}`;

            const handleDoubleTap = () => {
              const now = Date.now();
              if (
                lastTapRef.current[lastTapKey] &&
                now - lastTapRef.current[lastTapKey] < 300
              ) {
                // Always save the brand, even for products
                handleSaveBrand(brand);
              }
              lastTapRef.current[lastTapKey] = now;
            };

            return (
              <Pressable
                onPress={handleDoubleTap}
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
                    isMuted={!isVisible || muted || allPaused}
                    volume={1.0}
                    {...(Platform.OS === "web"
                      ? { playsInline: true, autoPlay: true }
                      : {})}
                  />
                )}
              </Pressable>
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
      allPaused,
      muted,
    ]
  );

  // On initial load, play/unmute only the first video
  useEffect(() => {
    if (!isScreenFocused || brandsMedia.length === 0) return;
    const firstBrand = brandsMedia[0]?.brand;
    if (!firstBrand) return;
    const hIndex = horizontalIndices[firstBrand] || 0;
    updateVideoPlayback({ brand: firstBrand, hIndex, muted, play: true });
  }, [brandsMedia, isScreenFocused, muted, horizontalIndices]);

  // Ensure visible video always autoplays when visibleVerticalIndex or horizontalIndices change
  useEffect(() => {
    if (brandsMedia.length === 0) return;
    const brand = brandsMedia[visibleVerticalIndex]?.brand;
    if (!brand) return;
    const hIndex = horizontalIndices[brand] || 0;
    updateVideoPlayback({ brand, hIndex, muted, play: true });
  }, [visibleVerticalIndex, horizontalIndices, brandsMedia, muted]);

  // In the brandsMedia state, filter by savedBrands if filter === 'liked'
  const filteredBrandsMedia =
    filter === "liked"
      ? brandsMedia.filter((b) => savedBrands.has(b.brand))
      : brandsMedia;

  if (loading || filteredBrandsMedia.length === 0) {
    console.log(
      `⏳ [APP DEBUG] Loading state: loading=${loading}, brandsMedia.length=${brandsMedia.length}, filteredBrandsMedia.length=${filteredBrandsMedia.length}`
    );
    return <ActivityIndicator size="large" className="flex-1 self-center" />;
  }

  console.log(
    `🎬 [APP DEBUG] Rendering feed with ${filteredBrandsMedia.length} brands (filter: ${filter})`
  );
  console.log(
    `📊 [APP DEBUG] Current state: verticalIndex=${verticalIndex}, visibleVerticalIndex=${visibleVerticalIndex}`
  );

  if (filter === "liked" && filteredBrandsMedia.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-white text-lg">None here</Text>
      </View>
    );
  }

  const currentBrand = filteredBrandsMedia[verticalIndex]?.brand;
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
          onPress={() => {
            setMuted((prevMuted) => {
              const newMuted = !prevMuted;
              // Only update the visible video
              const brand = filteredBrandsMedia[verticalIndex]?.brand;
              const hIndex = horizontalIndices[brand] || 0;
              updateVideoPlayback({
                brand,
                hIndex,
                muted: newMuted,
                play: true,
              });
              return newMuted;
            });
          }}
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

        {/* Content overlay */}
        {filteredBrandsMedia[verticalIndex] && (
          <View className="bg-black/30 px-4 py-3 rounded-full flex-row items-center justify-between">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                const currentItem = filteredBrandsMedia[verticalIndex];
                if (currentItem.type === "product") {
                  // For products, navigate to brand page
                  console.log(
                    "Navigating to brand from product:",
                    currentItem.brand
                  );
                  router.push({
                    pathname: "/(tabs)/[brand]",
                    params: { brand: currentItem.brand },
                  });
                } else {
                  // For brands, navigate to brand detail
                  console.log("Navigating to brand:", currentItem.brand);
                  router.push({
                    pathname: "/(tabs)/[brand]",
                    params: { brand: currentItem.brand },
                  });
                }
              }}
              className="flex-1 items-start justify-center pl-2"
            >
              <Text className="text-white text-sm font-semibold text-left">
                {filteredBrandsMedia[verticalIndex].type === "product"
                  ? `${filteredBrandsMedia[verticalIndex].brand} - ${filteredBrandsMedia[verticalIndex].product}`
                  : BRANDS[
                      filteredBrandsMedia[verticalIndex]
                        .brand as keyof typeof BRANDS
                    ] || filteredBrandsMedia[verticalIndex].brand}
              </Text>
              <Text className="text-white text-xs opacity-80 text-left mt-1">
                {filteredBrandsMedia[verticalIndex].type === "product" &&
                filteredBrandsMedia[verticalIndex].price
                  ? `$${filteredBrandsMedia[verticalIndex].price}`
                  : BRAND_AI_SUMMARIES[
                      filteredBrandsMedia[verticalIndex].brand
                    ] ||
                    filteredBrandsMedia[verticalIndex].tagline ||
                    "No description available"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                handleSaveBrand(filteredBrandsMedia[verticalIndex].brand)
              }
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
        {filteredBrandsMedia[verticalIndex] && (
          <View className="mt-3">
            <PaginationDots
              totalItems={filteredBrandsMedia[verticalIndex].media.length}
              currentIndex={
                horizontalIndices[filteredBrandsMedia[verticalIndex].brand] || 0
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
        data={filteredBrandsMedia}
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
