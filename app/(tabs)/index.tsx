import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  Video,
} from "expo-av";
import Constants from "expo-constants";
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

// const BRANDS: { [key: string]: string } = {
//   "5MOREDAYS": "5 More Days",
//   "629": "629",
//   ABSTRAITE_DESIGN: "Abstraite Design",
//   ACDTM: "ACDTM",
//   ACTIVIST_PARIS: "Activist Paris",
//   AKHIELO: "Akhielo",
//   ALREADY_WRITTEN: "Already Written",
//   AMBERBYSOUL: "Amber By Soul",
//   AMESCENSE: "Amescense",
//   ANGEL_ARCADE: "Angel Arcade",
//   ANTHONY_JAMES: "Anthony James",
//   APRILLAND: "Aprilland",
//   ARRIVAL_WORLDWIDE: "Arrival Worldwide",
//   A_STONECOLD_STUDIOS_PRODUCTION: "A Stonecold Studios Production",
//   BAD_HABITS_LA: "Bad Habits LA",
//   BAGJIO: "Bagjio",
//   BANISHDIARIES: "Banish Diaries",
//   BANISHEDUSA: "Banished USA",
//   BEANIES: "Beanies",
//   BEANS: "Beans",
//   BELACARTES: "Belacartes",
//   BIRTH_OF_ROYAL_CHILD: "Birth of Royal Child",
//   BIZZRAD: "Bizzrad",
//   BORIS_KRUEGER: "Boris Krueger",
//   BORNTODIETM: "Born To Die TM",
//   BRAKKA_GARMENTS: "Brakka Garments",
//   BRANDONWVARGAS: "Brandon W Vargas",
//   CAMP_XTRA: "Camp Xtra",
//   CASPER: "Casper",
//   CBAKAPS: "Cbakaps",
//   "CHALK.PRESS": "Chalk Press",
//   CHEATIN_SNAKES_WORLDWIDE: "Cheatin Snakes Worldwide",
//   CHILLDREN: "Chilldren",
//   CIELOS_LOS_ANGELES: "Cielos Los Angeles",
//   CORRUPTKID: "Corrupt Kid",
//   COUCOU_BEBE: "Coucou Bebe",
//   COWBOY_HEARTS: "Cowboy Hearts",
//   CRYSTAL_RIVER: "Crystal River",
//   CUTS_BY_LOWHEADS: "Cuts by Lowheads",
//   DAEKER: "Daeker",
//   DEATH_56_SENTENCE: "Death 56 Sentence",
//   DEMIKNJ: "Demiknj",
//   DENIM: "Denim",
//   DESCENDANT: "Descendant",
//   "DINGBATS-FONT": "Dingbats Font",
//   DOCTORGARMENTZ: "Doctor Garmentz",
//   DOLOR: "Dolor",
//   E4ENYTHING: "E4enything",
//   EMERSON_STONE: "Emerson Stone",
//   EMOTIONAL_DISTRESS: "Emotional Distress",
//   EMPTY_SPACES: "Empty Spaces",
//   EREHWON: "Erehwon",
//   EXCESS: "Excess",
//   EXISTS_PURE: "Exists Pure",
//   EYECRAVE: "Eyecrave",
//   FACIANE_FASHON: "Faciane Fashon",
//   FAIT_PAR_LUI: "Fait Par Lui",
//   FALSEWORKCLUB: "Falsework Club",
//   FISHFELON: "Fish Felon",
//   FNKSTUDIOS: "FNK Studios",
//   FOUNTAIN_OF_SOUL: "Fountain of Soul",
//   FRAUDULENT: "Fraudulent",
//   GBUCK: "G Buck",
//   GEMINI: "Gemini",
//   GEN_2: "Gen 2",
//   GINKO_ULTRA: "Ginko Ultra",
//   GLVSSIC: "Glvssic",
//   GOKYO: "Gokyo",
//   HAVEYOUDIEDBEFORE: "Have You Died Before",
//   HEAVROLET: "Heavrolet",
//   HIS_CARNAGE: "His Carnage",
//   HLYWRK: "HLYWRK",
//   HORN_HEROES: "Horn Heroes",
//   HUBANE: "Hubane",
//   HWASAN: "Hwasan",
//   IDIEDLASTNIGHT: "I Died Last Night",
//   IN_LOVING_MEMORY: "In Loving Memory",
//   JACKJOHNJR: "Jack John Jr",
//   JAKISCHRIST: "Jakis Christ",
//   JALONISDEAD: "Jalon Is Dead",
//   JAXON_JET: "Jaxon Jet",
//   KITOWARES: "Kito Wares",
//   KNARE: "Knare",
//   KORRUPT: "Korrupt",
//   LE_LOSANGE: "Le Losange",
//   LILBASTARDBOY: "Lil Bastard Boy",
//   LONEARCHIVE: "Lone Archive",
//   LOSE_RELIGION: "Lose Religion",
//   LOVEDYLANTHOMAS: "Love Dylan Thomas",
//   LOVEHARDT: "Love Hardt",
//   LOVE_AMERICA: "Love America",
//   LUCIEN_SAGAR: "Lucien Sagar",
//   LUXENBURG: "Luxenburg",
//   MANIC_DIARIES: "Manic Diaries",
//   MICU: "Micu",
//   MILES_FRANKLIN: "Miles Franklin",
//   MIND_BOWLING: "Mind Bowling",
//   MORALE: "Morale",
//   NETSU_DENIM: "Netsu Denim",
//   NIK_BENTEL_STUDIO: "Nik Bentel Studio",
//   "NO.ERRORS": "No Errors",
//   NOCIETY: "Nociety",
//   NOT1FLAW: "Not 1 Flaw",
//   OBJECT_FROM_NOTHING: "Object From Nothing",
//   OMNEE_WORLD: "Omnee World",
//   OMOSTUDIOZ: "Omo Studioz",
//   ONLYTHEBADSTUDIOS: "Only The Bad Studios",
//   "PANELS.": "Panels",
//   PANELS_BY_THOMASJAMES: "Panels by Thomas James",
//   PARAPHERNALIA_97: "Paraphernalia 97",
//   PLA4: "PLA4",
//   PLAGUEROUND: "Plagueround",
//   PLASTIC_STUDIOS: "Plastic Studios",
//   PO5HBOY: "Po5h Boy",
//   POLO_CUTTY: "Polo Cutty",
//   PRESTON_SEVIN: "Preston Sevin",
//   PRIVATE_AFFAIR: "Private Affair",
//   PROHIBITISM: "Prohibitism",
//   PSYCHWARD: "Psych Ward",
//   PUBLIC_HOUSING_SKATE_TEAM: "Public Housing Skate Team",
//   PUPPET_THEATER: "Puppet Theater",
//   PURGATORY: "Purgatory",
//   PYTHIA: "Pythia",
//   RAWCKSTAR_LIFESTYLE: "Rawckstar Lifestyle",
//   REDHEAT: "Red Heat",
//   REVENIGHTS: "Revenights",
//   RITTEN: "Ritten",
//   ROMANCATCHER: "Romancatcher",
//   ROY_PUBLIC_LABEL: "Roy Public Label",
//   RSEKAI: "R Sekai",
//   SCAPEGRACE: "Scapegrace",
//   SCY_BY_JULIUS: "SCY by Julius",
//   SHAWZIP: "Shawzip",
//   SHEFF: "Sheff",
//   SLUMPMAN: "Slumpman",
//   SONGSAMNOUNG: "Song Sam Noung",
//   SOUTH_OF_HEAVEN: "South of Heaven",
//   SPECTRUM_THEORY: "Spectrum Theory",
//   SQUIGGLES: "Squiggles",
//   STAFF_PICKS: "Staff Picks",
//   STOLEN_ARTS: "Stolen Arts",
//   STOMACH_: "Stomach",
//   SUNNY_UNDERGROUND_MARKET: "Sunny Underground Market",
//   SUNSHINE_REIGNS: "Sunshine Reigns",
//   "SWNK-X9": "SWNK-X9",
//   TATE_MARSLAND: "Tate Marsland",
//   TECNINE_GROUP: "Tecnine Group",
//   THE_BLANK_TRAVELER: "The Blank Traveler",
//   THE_CHARTREUSE_HUMAN: "The Chartreuse Human",
//   THE_LAUGHING_GEISHA: "The Laughing Geisha",
//   THE_PEACEFUL_PEOPLE: "The Peaceful People",
//   TRIPPIE_GLUCK: "Trippie Gluck",
//   TROUBLE_NYC: "Trouble NYC",
//   "UNWARRANTED.ATL": "Unwarranted ATL",
//   VACANT_WINTER: "Vacant Winter",
//   VENGEANCE_STUDIOS: "Vengeance Studios",
//   VISUALS_BY_JADA: "Visuals by Jada",
//   VOSTRETTI: "Vostretti",
//   VUOTA: "Vuota",
//   WAVEY_WAKARU: "Wavey Wakaru",
//   WHELM: "Whelm",
//   WHYW0ULDULIE: "Why Would U Lie",
//   WICKED_GLIMMER: "Wicked Glimmer",
//   WNTD_APPAREL: "WNTD Apparel",
//   WOMENS: "Womens",
//   WORKSOFMADNESS: "Works of Madness",
//   WORSHIP: "Worship",
//   WORSTCASE: "Worstcase",
//   XENON: "Xenon",
//   YACHTY_IN_ELIAS: "Yachty in Elias",
//   YAMI_MIYAZAKI: "Yami Miyazaki",
//   YOURAVGCADET: "Your Avg Cadet",
//   YOUTH_MOVEMENT: "Youth Movement",
// };



// const BRANDS: { [key: string]: string } = {
//   "5MOREDAYS": "5 More Days",
//   ABSTRAITE_DESIGN: "Abstraite Design",
//   ACTIVIST_PARIS: "Activist Paris",
//   AKHIELO: "Akhielo",
//   ALREADY_WRITTEN: "Already Written",
//   AMESCENSE: "Amescense",
//   ANGEL_ARCADE: "Angel Arcade",
//   ARRIVAL_WORLDWIDE: "Arrival Worldwide",
//   BAD_HABITS_LA: "Bad Habits LA",
//   BANISHDIARIES: "Banish Diaries",
//   BEANIES: "Beanies",
//   BEANS: "Beans",
//   BELACARTES: "Belacartes",
//   BIRTH_OF_ROYAL_CHILD: "Birth of Royal Child",
//   BIZZRAD: "Bizzrad",
//   BORNTODIETM: "Born To Die TM",
//   BRAKKA_GARMENTS: "Brakka Garments",
//   BRANDONWVARGAS: "Brandon W Vargas",
//   CAMP_XTRA: "Camp Xtra",
//   CASPER: "Casper",
//   CIELOS_LOS_ANGELES: "Cielos Los Angeles",
//   CORRUPTKID: "Corrupt Kid",
//   CRYSTAL_RIVER: "Crystal River",
//   CUTS_BY_LOWHEADS: "Cuts by Lowheads",
//   DAEKER: "Daeker",
//   DEMIKNJ: "Demiknj",
//   DENIM: "Denim",
//   DESCENDANT: "Descendant",
//   DOCTORGARMENTZ: "Doctor Garmentz",
//   DOLOR: "Dolor",
//   EXCESS: "Excess",
//   EYECRAVE: "Eyecrave",
//   FAIT_PAR_LUI: "Fait Par Lui",
//   FISHFELON: "Fish Felon",
//   FNKSTUDIOS: "FNK Studios",
//   FOUNTAIN_OF_SOUL: "Fountain of Soul",
//   GEMINI: "Gemini",
//   GLVSSIC: "Glvssic",
//   HORN_HEROES: "Horn Heroes",
//   HWASAN: "Hwasan",
//   IN_LOVING_MEMORY: "In Loving Memory",
//   KITOWARES: "Kito Wares",
//   KORRUPT: "Korrupt",
//   LONEARCHIVE: "Lone Archive",
//   LOSE_RELIGION: "Lose Religion",
//   LOVEDYLANTHOMAS: "Love Dylan Thomas",
//   MIND_BOWLING: "Mind Bowling",
// };



const BRANDS: { [key: string]: string } = {
  ABSTRAITE_DESIGN: "Abstraite Design",
  BANISHDIARIES: "Banish Diaries",
  BELACARTES: "Belacartes",
  BIRTH_OF_ROYAL_CHILD: "Birth of Royal Child",
  BRANDONWVARGAS: "Brandon W Vargas",
  CUTS_BY_LOWHEADS: "Cuts by Lowheads",
  DOLOR: "Dolor",
  EXCESS: "Excess",
  EYECRAVE: "Eyecrave",
  FAIT_PAR_LUI: "Fait Par Lui",
  HWASAN: "Hwasan",
};

// Sanitize brand names to remove file extensions
const sanitizedBrands = Object.keys(BRANDS).map((b) =>
  b.replace(/\.[^/.]+$/, "")
);

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
      console.log(`Brand not found: ${BRANDS[brandName] || brandName}`);
      return null;
    }

    return data.id;
  } catch (error) {
    console.log(
      `Error getting brand ID for ${BRANDS[brandName] || brandName}:`,
      error
    );
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

// Function to like a product
async function likeProduct(
  productId: number,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("liked_products").insert({
      product_id: productId,
      user_id: userId,
    });

    if (error) {
      console.log("Error liking product:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.log("Error liking product:", error);
    return false;
  }
}

// Function to unlike a product
async function unlikeProduct(
  productId: number,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("liked_products")
      .delete()
      .eq("product_id", productId)
      .eq("user_id", userId);

    if (error) {
      console.log("Error unliking product:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.log("Error unliking product:", error);
    return false;
  }
}

async function fetchBrandMediaFromIndex(brand: string) {
  // Fetch index.json from the brand's scrolling_brand_media folder
  const indexUrl = `${BUCKET_URL}/${brand}/scrolling_brand_media/index.json`;

  try {
    const res = await fetch(indexUrl);

    if (!res.ok) {
      console.warn(
        `Failed to fetch media for ${BRANDS[brand] || brand}: ${res.status}`
      );
      return null;
    }

    const data = await res.json();

    if (!Array.isArray(data.files)) {
      console.warn(`Invalid media structure for ${brand}`);
      return null;
    }

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
      url: `${BUCKET_URL}/${brand}/scrolling_brand_media/${file}`,
    };
  } catch {
    return null;
  }
}

// Function to get all brand folders from the bucket
async function getBrandsFromBucket(): Promise<string[]> {
  try {
    // List all folders in the brand-content bucket
    const { data, error } = await supabase.storage
      .from("brand-content")
      .list("", {
        limit: 1000,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      console.error("Error fetching brands from bucket:", error);
      return [];
    }

    // Filter for folders (directories) and return their names
    const brandFolders = data
      .filter(
        (item) =>
          item.metadata?.mimetype === "application/octet-stream" ||
          item.name.includes("/")
      )
      .map((item) => item.name);

    console.log(
      `Found ${brandFolders.length} brand folders in bucket:`,
      brandFolders
    );
    return brandFolders;
  } catch (error) {
    console.error("Error fetching brands from bucket:", error);
    return [];
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
      // Updated to use scrolling_brand_media folder structure
      const indexUrl = `${BUCKET_URL}/${brand}/scrolling_brand_media/index.json`;
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
                  url: `${BUCKET_URL}/${brand}/scrolling_brand_media/${name}`,
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
            .eq("media_filepath", brand)
            .single();

          if (!error && brandData) {
            tagline = brandData.brand_tagline;
          }
        } catch (error) {
          console.log(
            `Error fetching tagline for ${BRANDS[brand] || brand}:`,
            error
          );
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
  type FeedMode = "brands" | "products";
  const [feedMode, setFeedMode] = useState<FeedMode>("brands");
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
      media: { type: "video" | "image"; url: string; name: string }[];
      tagline: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [verticalIndex, setVerticalIndex] = useState(0); // Which brand
  const [horizontalIndices, setHorizontalIndices] = useState<{
    [brand: string]: number;
  }>({}); // Which media per brand
  const [muted, setMuted] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [savedBrands, setSavedBrands] = useState<Set<string>>(new Set());
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set());
  const [session, setSession] = useState<any>(null);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lastTapRef = useRef<{ [key: string]: number }>({});
  const [filter, setFilter] = useState<"all" | "liked">("all");
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
            media_filepath,
            brand_name
          )
        `
        )
        .eq("user_id", session.user.id);

      if (error) {
        console.log("Error fetching saved brands:", error);
        return;
      }

      // Use media_filepath (sanitized key) for matching/feed and display
      const brandKeys = (data || [])
        .map((item: any) => item.brand?.media_filepath)
        .filter(Boolean);

      setSavedBrands(new Set(brandKeys));
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

  // Function to fetch user's liked products from database
  const fetchLikedProducts = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from("liked_products")
        .select("product_id")
        .eq("user_id", session.user.id);

      if (error) {
        console.log("Error fetching liked products:", error);
        return;
      }

      const likedProductIds = (data || []).map((item: any) => item.product_id);
      setLikedProducts(new Set(likedProductIds));
    } catch (error) {
      console.log("Error fetching liked products:", error);
    }
  };

  // Fetch liked products when session changes
  useEffect(() => {
    if (session?.user) {
      fetchLikedProducts();
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
    const filterHandler = (newFilter: "all" | "liked") => setFilter(newFilter);
    const modeHandler = (mode: FeedMode) => {
      console.log(`[FEED] Mode change requested →`, mode);
      setFeedMode(mode);
    };
    feedFilterEmitter.on("filter", filterHandler);
    feedFilterEmitter.on("mode", modeHandler);
    return () => {
      feedFilterEmitter.off("filter", filterHandler);
      feedFilterEmitter.off("mode", modeHandler);
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
        console.log(
          `Could not find brand ID for: ${BRANDS[brandName] || brandName}`
        );
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
          console.log(`Unsaved brand: ${BRANDS[brandName] || brandName}`);
        }
      } else {
        // Save the brand
        const success = await saveBrand(brandId, session.user.id);
        if (success) {
          setSavedBrands((prev) => new Set([...prev, brandName]));
          console.log(`Saved brand: ${BRANDS[brandName] || brandName}`);

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

  // --- Product Like Functions ---
  const handleProductLike = async (productId: number) => {
    if (!session?.user) {
      console.log("User not authenticated");
      return;
    }

    try {
      const isCurrentlyLiked = likedProducts.has(productId);

      if (isCurrentlyLiked) {
        // Unlike the product
        const success = await unlikeProduct(productId, session.user.id);
        if (success) {
          setLikedProducts((prev) => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
          console.log(`Unliked product: ${productId}`);
        }
      } else {
        // Like the product
        const success = await likeProduct(productId, session.user.id);
        if (success) {
          setLikedProducts((prev) => new Set([...prev, productId]));
          console.log(`Liked product: ${productId}`);

          // Show popup only when liking (not unliking)
          setShowSavedPopup(true);
          setTimeout(() => {
            setShowSavedPopup(false);
          }, 1000); // Hide after 1 second
        }
      }
    } catch (error) {
      console.log("Error handling product like:", error);
    }
  };

  // --- Replace shuffle logic in loadBrands and reshuffle ---
  useEffect(() => {
    const loadBrands = async () => {
      // Get brands dynamically from bucket instead of hardcoded BRANDS
      const bucketBrands = await getBrandsFromBucket();
      if (bucketBrands.length === 0) {
        console.warn(
          "No brands found in bucket, falling back to hardcoded list"
        );
        bucketBrands.push(...sanitizedBrands);
      }

      const recommended = recommendBrands(
        bucketBrands,
        brandScores,
        sessionBrands,
        session?.user?.id // Pass userId for seeding
      );
      const all = await fetchAllBrandsMedia(recommended);
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
      setSessionBrands(new Set(recommended));
      setLoading(false);
    };
    loadBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Products Feed ---
  type ProductMedia = {
    brand: string;
    product: string;
    product_id: number; // Add product ID for liking functionality
    media: { type: "video" | "image"; url: string; name: string }[];
  };
  const [productsMedia, setProductsMedia] = useState<ProductMedia[]>([]);
  const [orderedBrandsForProducts, setOrderedBrandsForProducts] = useState<
    string[]
  >([]);
  const [productsCursor, setProductsCursor] = useState(0);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const productsSessionSeed = useRef<number>(
    Math.floor(Date.now() % 1000000000)
  );

  async function getProductFoldersForBrand(brand: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from("brand-content")
        .list(`${brand}/scrolling_product_media`);
      console.log("data", data);
      if (error || !data) {
        console.warn(
          `[PRODUCTS] No product folders or error for brand`,
          brand,
          error
        );
        return [];
      }
      console.log(`[PRODUCTS] Product folders for`, brand, data);
      const folders = data
        .filter((item: any) => item && item.name && !item.name.includes("."))
        .map((item: any) => item.name);
      console.log(
        `[PRODUCTS] Brand`,
        brand,
        `→`,
        folders.length,
        `product folders`
      );
      return folders;
    } catch (e) {
      console.warn(
        `[PRODUCTS] Exception listing product folders for`,
        brand,
        e
      );
      return [];
    }
  }

  async function fetchProductMediaFromIndex(brand: string, product: string) {
    const indexUrl = `${BUCKET_URL}/${brand}/scrolling_product_media/${product}/index.json`;
    try {
      const res = await fetch(indexUrl);
      if (!res.ok) {
        console.warn(`[PRODUCTS] index.json fetch failed`, {
          brand,
          product,
          status: res.status,
        });
        return null;
      }
      const data = await res.json();
      if (!Array.isArray(data.files)) {
        console.warn(`[PRODUCTS] Invalid index.json structure`, {
          brand,
          product,
        });
        return null;
      }
      const files = data.files
        .map((f: any) => (typeof f === "string" ? f : f?.name))
        .filter(Boolean)
        .map((name: string) => {
          const type = getMediaType(name);
          return type
            ? {
                type,
                url: `${BUCKET_URL}/${brand}/scrolling_product_media/${product}/${name}`,
                name,
              }
            : null;
        })
        .filter(Boolean);
      const videoCount = (files as any[]).filter(
        (f: any) => f.type === "video"
      ).length;
      const imageCount = (files as any[]).filter(
        (f: any) => f.type === "image"
      ).length;
      console.log(`[PRODUCTS] Parsed media`, {
        brand,
        product,
        total: (files as any[]).length,
        videoCount,
        imageCount,
      });
      // Move first video to the front if not first
      let reorderedFiles = files as any[];
      const firstVideoIdx = (files as any[]).findIndex(
        (f: any) => f.type === "video"
      );
      if (firstVideoIdx > 0) {
        const [video] = (files as any[]).splice(firstVideoIdx, 1);
        reorderedFiles = [video, ...(files as any[])];
      }

      // Get product ID from database using the full media_filepath
      let productId: number | null = null;
      try {
        const fullMediaPath = `${brand}/scrolling_product_media/${product}`;
        console.log(
          `[PRODUCTS] Looking up product by media_filepath:`,
          fullMediaPath
        );

        const { data: productData, error: productError } = await supabase
          .from("product")
          .select("id")
          .eq("media_filepath", fullMediaPath)
          .single();

        if (!productError && productData) {
          productId = productData.id;
          console.log(`[PRODUCTS] Found product ID:`, productId);
        } else {
          console.warn(`[PRODUCTS] Product not found in database:`, {
            fullMediaPath,
            productError,
          });
        }
      } catch (error) {
        console.error(
          `[PRODUCTS] Error getting product ID for ${brand}/${product}:`,
          error
        );
      }

      return {
        brand,
        product,
        product_id: productId || 0, // Use 0 if product ID not found
        media: reorderedFiles,
      } as ProductMedia;
    } catch {
      console.warn(`[PRODUCTS] Exception parsing index.json`, {
        brand,
        product,
        indexUrl,
      });
      return null;
    }
  }

  async function loadProductsFeed() {
    if (loadingProducts) return;
    const t0 = Date.now();
    console.log(`[PRODUCTS] Loading products feed…`);
    setLoadingProducts(true);
    try {
      // Order brands algorithmically first
      let bucketBrands = await getBrandsFromBucket();
      if (bucketBrands.length === 0) bucketBrands = [...sanitizedBrands];
      const orderedBrands = recommendBrands(
        bucketBrands,
        brandScores,
        sessionBrands,
        session?.user?.id
      );
      console.log(
        `[PRODUCTS] Ordered brands count:`,
        orderedBrands.length,
        `sample:`,
        orderedBrands.slice(0, 10)
      );
      // Add extra session-level randomness for products feed ordering
      const randomizedBrands = shuffleArraySeeded(
        orderedBrands,
        productsSessionSeed.current
      );
      // Save order and reset cursor, then load first batch
      setOrderedBrandsForProducts(randomizedBrands);
      setProductsCursor(0);
      setProductsMedia([]);
      await loadMoreProducts(randomizedBrands, 0);
      console.log(`[PRODUCTS] Initial batch loaded`, {
        items: productsMedia.length,
        ms: Date.now() - t0,
      });
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadMoreProducts(order?: string[], startIndex?: number) {
    if (loadingMoreProducts) return;
    const t0 = Date.now();
    setLoadingMoreProducts(true);
    try {
      const list = order || orderedBrandsForProducts;
      let cursor = startIndex !== undefined ? startIndex : productsCursor;
      if (!list || list.length === 0) return;

      const BATCH_BRANDS = 6; // number of brands per batch
      const PER_BRAND_LIMIT = 2; // products per brand per batch
      let nextSlice = list.slice(cursor, cursor + BATCH_BRANDS);
      // Shuffle the slice to avoid predictable brand presentation in a batch
      nextSlice = shuffleArraySeeded(nextSlice, productsSessionSeed.current);

      const batchResults: ProductMedia[] = [];
      for (const brand of nextSlice) {
        const productFolders = await getProductFoldersForBrand(brand);
        if (productFolders.length === 0) continue;
        const seed = session?.user?.id
          ? Array.from(session.user.id as string).reduce(
              (acc: number, c: string) => acc + c.charCodeAt(0),
              0
            )
          : Date.now();
        const chosen = shuffleArraySeeded(productFolders, seed).slice(
          0,
          PER_BRAND_LIMIT
        );
        console.log(`[PRODUCTS] Batch brand`, brand, `chosen:`, chosen);
        for (const product of chosen) {
          const item = await fetchProductMediaFromIndex(brand, product);
          if (item && item.media.length > 0) batchResults.push(item);
        }
      }

      if (batchResults.length > 0) {
        // Interleave/shuffle to avoid long runs of the same brand back-to-back
        function interleaveAvoidAdjacency(
          items: ProductMedia[],
          seedNum: number
        ): ProductMedia[] {
          let arr = shuffleArraySeeded(items, seedNum);
          for (let i = 1; i < arr.length; i++) {
            if (arr[i].brand === arr[i - 1].brand) {
              // find next with different brand and swap
              let swapIndex = -1;
              for (let j = i + 1; j < arr.length; j++) {
                if (arr[j].brand !== arr[i - 1].brand) {
                  swapIndex = j;
                  break;
                }
              }
              if (swapIndex !== -1) {
                const tmp = arr[i];
                arr[i] = arr[swapIndex];
                arr[swapIndex] = tmp;
              }
            }
          }
          return arr;
        }

        const interleavedBatch = interleaveAvoidAdjacency(
          batchResults,
          productsSessionSeed.current
        );

        setProductsMedia((prev) => {
          if (!prev || prev.length === 0) return [...interleavedBatch];
          // If boundary brands match, rotate the new batch to reduce adjacency
          let rotated = [...interleavedBatch];
          if (prev[prev.length - 1].brand === rotated[0].brand) {
            const idx = rotated.findIndex((p) => p.brand !== rotated[0].brand);
            if (idx > 0) {
              rotated = [...rotated.slice(idx), ...rotated.slice(0, idx)];
            }
          }
          return [...prev, ...rotated];
        });
      }
      setProductsCursor(cursor + nextSlice.length);
      console.log(`[PRODUCTS] Batch loaded`, {
        added: batchResults.length,
        total: productsMedia.length + batchResults.length,
        ms: Date.now() - t0,
      });
    } finally {
      setLoadingMoreProducts(false);
    }
  }

  // Load products when switching to products mode the first time
  useEffect(() => {
    if (feedMode === "products" && productsMedia.length === 0) {
      console.log(`[PRODUCTS] First-time switch to products mode → fetching…`);
      loadProductsFeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedMode]);

  const handleVerticalScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const newIndex = Math.round(offsetY / screenHeight);

      if (brandsMedia.length > 0 && newIndex >= brandsMedia.length - 1) {
        console.log(`Reached end of feed, reloading content...`);

        // Reshuffle brands and reset to top
        const startTime = Date.now();

        // Get brands dynamically for reshuffle
        (async () => {
          const bucketBrands = await getBrandsFromBucket();
          if (bucketBrands.length === 0) {
            console.warn(
              "No brands found in bucket during reshuffle, falling back to hardcoded list"
            );
            bucketBrands.push(...sanitizedBrands);
          }

          const recommended = recommendBrands(
            bucketBrands,
            brandScores,
            sessionBrands
          );
          const recommendTime = Date.now() - startTime;

          console.log(
            `🤖 [SCROLL DEBUG] Reshuffle recommendation took ${recommendTime}ms`
          );
          console.log(`📋 [SCROLL DEBUG] New recommended brands:`, recommended);

          const fetchStart = Date.now();
          const all = await fetchAllBrandsMedia(recommended);
          const fetchTime = Date.now() - fetchStart;

          console.log(
            `📁 [SCROLL DEBUG] Reshuffle media fetch took ${fetchTime}ms`
          );
          console.log(
            `✅ [SCROLL DEBUG] Loaded ${all.length} brands for reshuffle`
          );

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
          setSessionBrands(new Set(recommended));
          setVerticalIndex(0);

          console.log(
            `🏁 [SCROLL DEBUG] Reshuffle completed, reset to index 0`
          );
        })();
      } else {
        setVerticalIndex((prev) => (prev !== newIndex ? newIndex : prev));
      }
    },
    [brandsMedia.length, brandScores, sessionBrands]
  );

  const [visibleVerticalIndex, setVisibleVerticalIndex] = useState(0);

  // Log product ID when scrolling to new product
  useEffect(() => {
    if (feedMode === "products" && productsMedia[verticalIndex]) {
      const currentProduct = productsMedia[verticalIndex];
      console.log("🛍️ Scrolled to product:", {
        productId: currentProduct.product_id,
        productName: currentProduct.product,
        brandName: currentProduct.brand,
        verticalIndex,
      });
    }
  }, [verticalIndex, feedMode, productsMedia]);

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

  if (
    (feedMode === "brands" && (loading || filteredBrandsMedia.length === 0)) ||
    (feedMode === "products" && (loadingProducts || productsMedia.length === 0))
  ) {
    return <ActivityIndicator size="large" className="flex-1 self-center" />;
  }

  if (filter === "liked" && filteredBrandsMedia.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-white text-lg">None here</Text>
      </View>
    );
  }

  const currentBrand =
    feedMode === "brands"
      ? filteredBrandsMedia[verticalIndex]?.brand
      : productsMedia[verticalIndex]?.brand;
  const isCurrentBrandSaved = currentBrand
    ? savedBrands.has(currentBrand)
    : false;

  const currentProductId =
    feedMode === "products" && productsMedia[verticalIndex]?.product_id
      ? productsMedia[verticalIndex].product_id
      : null;
  const isCurrentProductLiked = currentProductId
    ? likedProducts.has(currentProductId)
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

      {/* Overlay container at bottom */}
      <View className="absolute bottom-24 left-5 right-5 z-50">
        {/* Saved Brand/Product Popup */}
        {showSavedPopup && (
          <View className="mb-2">
            <View className="bg-black/30 px-4 py-2 rounded-full flex-row items-center justify-center">
              <Text className="text-white text-sm font-semibold text-center">
                {feedMode === "brands" ? "Brand Archived" : "Product Liked"}
              </Text>
            </View>
          </View>
        )}

        {/* Name overlay */}
        {(feedMode === "brands" && filteredBrandsMedia[verticalIndex]) ||
        (feedMode === "products" && productsMedia[verticalIndex]) ? (
          <View className="bg-black/30 px-4 py-3 rounded-full flex-row items-center justify-between">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (feedMode === "brands") {
                  const brandKey = filteredBrandsMedia[verticalIndex].brand;
                  router.push({
                    pathname: "/(tabs)/[brand]",
                    params: { brand: brandKey },
                  });
                } else {
                  // Products mode
                  const productId = productsMedia[verticalIndex].product_id;
                  router.push({
                    pathname: "/(tabs)/product/[id]",
                    params: { id: productId },
                  });
                }
              }}
              className="flex-1 items-start justify-center pl-2"
            >
              <Text className="text-white text-sm font-semibold text-left">
                {feedMode === "brands"
                  ? BRANDS[filteredBrandsMedia[verticalIndex].brand] ||
                    filteredBrandsMedia[verticalIndex].brand
                  : `${BRANDS[productsMedia[verticalIndex].brand] || productsMedia[verticalIndex].brand} · ${productsMedia[verticalIndex].product}`}
              </Text>
              {feedMode === "brands" &&
              (BRAND_AI_SUMMARIES[filteredBrandsMedia[verticalIndex].brand] ||
                filteredBrandsMedia[verticalIndex].tagline) ? (
                <Text className="text-white text-xs opacity-80 text-left mt-1">
                  {BRAND_AI_SUMMARIES[
                    filteredBrandsMedia[verticalIndex].brand
                  ] || filteredBrandsMedia[verticalIndex].tagline}
                </Text>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (feedMode === "brands") {
                  handleSaveBrand(filteredBrandsMedia[verticalIndex].brand);
                } else if (
                  feedMode === "products" &&
                  productsMedia[verticalIndex]?.product_id
                ) {
                  handleProductLike(productsMedia[verticalIndex].product_id);
                }
              }}
              className="ml-3 items-center justify-center"
            >
              <Ionicons
                name={
                  feedMode === "brands"
                    ? isCurrentBrandSaved
                      ? "bookmark"
                      : "bookmark-outline"
                    : isCurrentProductLiked
                      ? "heart"
                      : "heart-outline"
                }
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Pagination Dots */}
        {(feedMode === "brands" && filteredBrandsMedia[verticalIndex]) ||
        (feedMode === "products" && productsMedia[verticalIndex]) ? (
          <View className="mt-3">
            <PaginationDots
              totalItems={
                feedMode === "brands"
                  ? filteredBrandsMedia[verticalIndex].media.length
                  : productsMedia[verticalIndex].media.length
              }
              currentIndex={(() => {
                const key =
                  feedMode === "brands"
                    ? filteredBrandsMedia[verticalIndex].brand
                    : productsMedia[verticalIndex].brand;
                return horizontalIndices[key] || 0;
              })()}
              dotSize={6}
              dotSpacing={4}
              activeColor="#FFFFFF"
              inactiveColor="rgba(255, 255, 255, 0.4)"
            />
          </View>
        ) : null}
      </View>
      {feedMode === "brands" ? (
        <FlatList
          data={filteredBrandsMedia}
          keyExtractor={(item) => `brand::${item.brand}`}
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
      ) : (
        <FlatList
          data={productsMedia}
          keyExtractor={(item) => `product::${item.brand}/${item.product}`}
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
          onScroll={(e) => {
            handleVerticalScroll(e);
            const y = e.nativeEvent.contentOffset.y;
            const idx = Math.round(y / screenHeight);
            // Prefetch when 2 from bottom of currently loaded products
            if (
              !loadingMoreProducts &&
              idx >= productsMedia.length - 3 &&
              productsCursor < orderedBrandsForProducts.length
            ) {
              console.log(`[PRODUCTS] Near end → loading next batch`, {
                idx,
                total: productsMedia.length,
              });
              loadMoreProducts();
            }
          }}
          scrollEventThrottle={16}
          renderItem={({ item: { brand, media }, index }) =>
            renderBrandMedia({ item: { brand, media }, index })
          }
          initialScrollIndex={verticalIndex}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onVerticalViewableItemsChanged.current}
        />
      )}
    </View>
  );
}
