// app/(tabs)/product/[id].tsx
import { useFocusEffect } from "@react-navigation/native";
import { Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { IconSymbol } from "../../../components/ui/IconSymbol";
import { supabase } from "../../../lib/supabase";

const BUCKET_URL =
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/brand-content";
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const { width: screenW } = Dimensions.get("window");

type Media = { type: "video" | "image"; url: string; name: string };

function getMediaType(filename: string): "video" | "image" | null {
  const n = filename.toLowerCase();
  if (VIDEO_EXTENSIONS.some((ext) => n.endsWith(ext))) return "video";
  if (IMAGE_EXTENSIONS.some((ext) => n.endsWith(ext))) return "image";
  return null;
}

export default function ProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = useMemo(() => Number(id), [id]);

  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [brand, setBrand] = useState<{
    id: number;
    name: string;
    mediaPath: string;
  } | null>(null);
  const [mediaPath, setMediaPath] = useState<string | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log("🧭 ProductScreen params", {
      id,
      productId,
      typeofId: typeof id,
    });
  }, [id, productId]);

  // session
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSessionUserId(data.session?.user?.id ?? null);
      console.log("🔐 Session at mount", {
        userId: data.session?.user?.id ?? null,
      });
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evt, session) => {
        setSessionUserId(session?.user?.id ?? null);
        console.log("🔐 Auth state change", {
          userId: session?.user?.id ?? null,
        });
      }
    );
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // fetch product + media
  const load = useCallback(async () => {
    if (!productId) {
      console.warn("⚠️ No productId provided to ProductScreen", { id });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const t0 = Date.now();
      console.log("⏳ Loading product start", { productId });
      // 1) product row (join brand for name + media root hints)
      const { data: product, error: prodErr } = await supabase
        .from("product")
        .select(
          `
          id,
          product_name,
          product_desc,
          price,
          media_filepath,
          brand:brand_id (
            id,
            brand_name,
            media_filepath
          )
        `
        )
        .eq("id", productId)
        .single();

      console.log("📦 Supabase product response", {
        hasError: !!prodErr,
        productFound: !!product,
      });
      if (prodErr || !product) {
        console.warn("❌ Product not found or query error", {
          prodErr,
          productId,
        });
        setError("Product not found");
        setLoading(false);
        return;
      }

      setName(product.product_name || "");
      setDesc(product.product_desc || "");
      setPrice(product.price || 0);
      setMediaPath(product.media_filepath || null);
      const brandInfo = product.brand
        ? {
            id: product.brand.id,
            name: product.brand.brand_name || "",
            mediaPath: product.brand.media_filepath || "",
          }
        : null;
      setBrand(brandInfo);

      // 2) like status (if logged in)
      if (sessionUserId) {
        const { data: likedRow, error: likedErr } = await supabase
          .from("liked_products")
          .select("id")
          .eq("user_id", sessionUserId)
          .eq("product_id", productId)
          .maybeSingle();
        console.log("❤️ Like status response", {
          likedErr,
          likedRowExists: !!likedRow,
        });
        if (!likedErr) setIsLiked(!!likedRow);
      }

      // 3) product media from product.media_filepath (your listing/asset folder)
      // Expect: brand-content/<media_filepath>/index.json
      let mediaList: Media[] = [];
      if (product.media_filepath) {
        const indexUrl = `${BUCKET_URL}/${product.media_filepath}/index.json`;
        try {
          const res = await fetch(indexUrl);
          console.log("🖼️ Fetch media index", {
            indexUrl,
            status: res.status,
            ok: res.ok,
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.files)) {
              console.log("🗂️ Media files listed", {
                count: data.files.length,
              });
              mediaList = data.files
                .map((f: any) => (typeof f === "string" ? f : f?.name))
                .filter(Boolean)
                .map((name: string) => {
                  const type = getMediaType(name);
                  return type
                    ? {
                        type,
                        url: `${BUCKET_URL}/${product.media_filepath}/${name}`,
                        name,
                      }
                    : null;
                })
                .filter(Boolean) as Media[];
              // Put first video first if available
              const firstVideoIdx = mediaList.findIndex(
                (m) => m.type === "video"
              );
              if (firstVideoIdx > 0) {
                const [v] = mediaList.splice(firstVideoIdx, 1);
                mediaList = [v, ...mediaList];
              }
            }
          } else {
            console.warn("🛑 Media index fetch not ok", {
              indexUrl,
              status: res.status,
            });
          }
        } catch (e) {
          console.error("💥 Media index fetch error", { indexUrl, error: e });
        }
      }

      setMedia(mediaList);
      console.log("✅ Loaded product successfully", {
        productId,
        mediaCount: mediaList.length,
        durationMs: Date.now() - t0,
      });
    } catch (e) {
      console.error("💥 Unexpected load error", e);
      setError("Failed to load product");
    } finally {
      setLoading(false);
      console.log("🏁 Loading finished", { productId });
    }
  }, [productId, sessionUserId]);

  useFocusEffect(
    useCallback(() => {
      console.log("🎯 Screen focused → loading product", { productId });
      load();
    }, [load])
  );

  const toggleLike = async () => {
    if (!sessionUserId) return;
    setLiking(true);
    try {
      if (isLiked) {
        const { error } = await supabase
          .from("liked_products")
          .delete()
          .eq("user_id", sessionUserId)
          .eq("product_id", productId);
        if (!error) setIsLiked(false);
      } else {
        const { error } = await supabase
          .from("liked_products")
          .insert({ user_id: sessionUserId, product_id: productId });
        if (!error) setIsLiked(true);
      }
    } finally {
      setLiking(false);
    }
  };

  const addToCart = () => {
    // TODO: integrate your cart (context / backend). For now:
    console.log("Add to cart:", { productId, name, price });
  };

  const buyNow = () => {
    // TODO: integrate checkout. For now:
    console.log("Buy now:", { productId, name, price });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-600">Loading product…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={load}
          className="bg-black px-4 py-2 rounded-full"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Media carousel */}
      {media.length > 0 ? (
        <FlatList
          data={media}
          keyExtractor={(m) => m.url}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ width: screenW, aspectRatio: 1 }}>
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
                  resizeMode={"cover" as any}
                  shouldPlay
                  isLooping
                  isMuted
                  useNativeControls={false}
                />
              )}
            </View>
          )}
        />
      ) : (
        <View className="w-full aspect-square bg-gray-200 justify-center items-center">
          <Text className="text-gray-500">No media</Text>
        </View>
      )}

      {/* Header */}
      <View className="px-4 mt-4">
        {brand ? (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(tabs)/[brand]",
                params: { brand: brand.mediaPath }, // uses your brand route
              })
            }
          >
            <Text className="text-xs text-gray-600">{brand.name}</Text>
          </TouchableOpacity>
        ) : null}
        <View className="flex-row items-start justify-between mt-1">
          <Text className="text-xl font-bold flex-1 mr-3">{name}</Text>
          <TouchableOpacity
            onPress={toggleLike}
            disabled={liking || !sessionUserId}
            className="w-9 h-9 rounded-full bg-black/5 items-center justify-center"
          >
            <IconSymbol
              size={18}
              name={isLiked ? "heart.fill" : "heart"}
              color={isLiked ? "#ef4444" : "#111827"}
            />
          </TouchableOpacity>
        </View>
        <Text className="text-base font-semibold mt-2">${price}</Text>
      </View>

      {/* Actions */}
      <View className="px-4 mt-4 flex-row gap-3">
        <TouchableOpacity
          onPress={buyNow}
          className="flex-1 bg-black py-3 rounded-full items-center"
        >
          <Text className="text-white font-semibold">Buy Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={addToCart}
          className="flex-1 border border-black py-3 rounded-full items-center"
        >
          <Text className="font-semibold">Add to Cart</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      {desc ? (
        <View className="px-4 mt-6">
          <Text className="text-sm text-gray-800 leading-6">{desc}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
