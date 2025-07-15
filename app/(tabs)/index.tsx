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
  const lastTapRef = useRef<{ [key: string]: number }>({});
  const [filter, setFilter] = useState<"all" | "liked">("all");
  const isFocused = useIsFocused();
  const [allPaused, setAllPaused] = useState(false);

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

  // --- Replace shuffle logic in loadBrands and reshuffle ---
  useEffect(() => {
    const loadBrands = async () => {
      const recommended = recommendBrands(
        sanitizedBrands,
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

  const handleVerticalScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const newIndex = Math.round(offsetY / screenHeight);
      if (brandsMedia.length > 0 && newIndex >= brandsMedia.length - 1) {
        // Reshuffle brands and reset to top
        const recommended = recommendBrands(
          sanitizedBrands,
          brandScores,
          sessionBrands
        );
        (async () => {
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
          setVerticalIndex(0);
        })();
      } else {
        setVerticalIndex((prev) => (prev !== newIndex ? newIndex : prev));
      }
    },
    [brandsMedia.length, brandScores, sessionBrands]
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

  if (loading || filteredBrandsMedia.length === 0) {
    return <ActivityIndicator size="large" className="flex-1 self-center" />;
  }

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

        {/* Brand name overlay */}
        {filteredBrandsMedia[verticalIndex] && (
          <View className="bg-black/30 px-4 py-3 rounded-full flex-row items-center justify-between">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                // Navigate to brand detail component
                console.log(
                  "Navigating to brand:",
                  filteredBrandsMedia[verticalIndex].brand
                );
                router.push({
                  pathname: "/(tabs)/[brand]",
                  params: { brand: filteredBrandsMedia[verticalIndex].brand },
                });
              }}
              className="flex-1 items-start justify-center pl-2"
            >
              <Text className="text-white text-sm font-semibold text-left">
                {filteredBrandsMedia[verticalIndex].brand}
              </Text>
              <Text className="text-white text-xs opacity-80 text-left mt-1">
                {BRAND_AI_SUMMARIES[filteredBrandsMedia[verticalIndex].brand] ||
                  filteredBrandsMedia[verticalIndex].tagline ||
                  "No tagline available"}
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
