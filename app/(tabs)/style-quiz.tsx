import { useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Image as RNImage,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QuizCard from "../../components/QuizCard";

const quizImages = [
  // Emo Opium Goth
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Emo_Opium_Goth.jpg",
  // Gorpcore
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Gorpcore.JPG",
  // Grunge 2
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Grunge 2.jpg",
  // Grunge
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Grunge.jpg",
  // IMG_4959
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/IMG_4959.jpg",
  // Japanese Punk
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Japanese_Punk.jpg",
  // Leather
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Leather.JPG",
  // Luxary Street (only once)
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Luxary Street.jpg",
  // Minimal Comfy
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Minimal_Comfy.JPG",
  // Minimalist
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Minimalist.jpg",
  // Opium Goth
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Opium_Goth.jpg",
  // Streetwear(1)
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Streetwear(1).JPG",
  // Streetwear
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Streetwear.jpg",
  // Vintage
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Vintage.jpg",
  // work_street
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/work_street.JPG",
  // Workwear
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Workwear.jpg",
  // Y2K Street
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/public/style-quiz/Y2K_Street.jpg",
];
const SWIPE_THRESHOLD = 120;

const { width } = Dimensions.get("window");
// Adjust card height to leave space for header and buttons
const CARD_WIDTH = width * 0.88;
const CARD_HEIGHT = width * 1.08;

// Add a shuffle function
function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function StyleQuizScreen() {
  // Store the shuffled images in state
  const [shuffledImages, setShuffledImages] = useState(() =>
    shuffleArray(quizImages)
  );
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [preloaded, setPreloaded] = useState<Record<string, boolean>>({});
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const appearAnim = useRef(new Animated.Value(0)).current;
  const appearScale = useRef(new Animated.Value(0.95)).current;

  // Reset quiz and reshuffle images when navigating to this screen
  useFocusEffect(
    React.useCallback(() => {
      setShuffledImages(shuffleArray(quizImages));
      setCurrent(0);
      setDone(false);
      setImageError(false);
      pan.setValue({ x: 0, y: 0 });
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }, [])
  );

  // Reset image error when current image changes
  useEffect(() => {
    setImageError(false);
  }, [current]);

  // Preload all images as soon as the component mounts
  useEffect(() => {
    shuffledImages.forEach((uri) => {
      RNImage.prefetch(uri);
    });
  }, [shuffledImages]);

  // Preload the next image using Image.prefetch (React Native safe)
  useEffect(() => {
    if (current < shuffledImages.length - 1) {
      const nextUrl = shuffledImages[current + 1];
      if (!preloaded[nextUrl]) {
        Image.prefetch(nextUrl).then(() => {
          setPreloaded((prev) => ({ ...prev, [nextUrl]: true }));
        });
      }
    }
  }, [current, shuffledImages, preloaded]);

  // Prefetch the first image on mount, as soon as possible
  useEffect(() => {
    let didCancel = false;
    setFirstImageLoaded(false);
    const url = quizImages[0];
    RNImage.prefetch(url)
      .then(() => {
        if (!didCancel) setFirstImageLoaded(true);
      })
      .catch(() => {
        if (!didCancel) setFirstImageLoaded(true); // fallback: let it try to load in the card
      });
    return () => {
      didCancel = true;
    };
  }, []);

  // Helper to animate card off-screen, then reset and show next image
  const animateCard = (direction: "left" | "right", onComplete: () => void) => {
    setIsAnimatingOut(true);
    setTransitioning(true);
    Animated.timing(pan, {
      toValue: { x: direction === "right" ? width * 1.2 : -width * 1.2, y: 0 },
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      // After animation, update index and reset card position
      pan.setValue({ x: 0, y: 0 });
      if (current < shuffledImages.length - 1) {
        setCurrent((prev) => prev + 1);
      } else {
        setDone(true);
      }
      setTransitioning(false);
      setIsAnimatingOut(false);
      onComplete();
    });
  };

  // Unified answer handler for both swipe and button
  const handleAnswer = (answer: "yes" | "no") => {
    if (transitioning || isAnimatingOut) return; // Prevent double triggers
    animateCard(answer === "yes" ? "right" : "left", () => {});
  };

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !transitioning,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && !transitioning,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (transitioning) return;
        if (gesture.dx > SWIPE_THRESHOLD) {
          handleAnswer("yes");
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          handleAnswer("no");
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Counter: only increment after animation and image index update
  const progressNum =
    current < shuffledImages.length ? current + 1 : shuffledImages.length;

  // Use a key that changes after animation to force React to remount the card
  const cardKey = `${current}-${isAnimatingOut ? "animating" : "static"}`;

  useEffect(() => {
    appearAnim.setValue(0);
    appearScale.setValue(0.95);
    Animated.parallel([
      Animated.timing(appearAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(appearScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: 8,
      }),
    ]).start();
  }, [cardKey]);

  if (done || current >= shuffledImages.length) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f3f4f6",
        }}
      >
        <Text
          className="text-5xl font-bold text-gray-900"
          style={{ textAlign: "center" }}
        >
          Done
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-start bg-gray-100">
      <View className="h-2" />
      <Text className="text-3xl font-bold mb-0 mt-2 text-center">
        WHO ARE YOU?
      </Text>
      <Text className="text-base mb-1 text-center">
        Swipe right for Yes, left for No
      </Text>
      <View className="items-center w-full">
        <View
          className="items-center justify-center mb-0 bg-transparent"
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        >
          <View className="w-full h-full">
            <QuizCard
              key={cardKey}
              cardKey={cardKey}
              imageUrl={shuffledImages[current]}
              panHandlers={panResponder.panHandlers}
              pan={pan}
              fadeAnim={fadeAnim}
              scaleAnim={scaleAnim}
              imageError={imageError}
              onImageError={() => setImageError(true)}
              appearAnim={appearAnim}
              appearScale={appearScale}
            />
            {/* Overlay spinner only for first image if not loaded */}
            {current === 0 && !firstImageLoaded && (
              <View className="absolute inset-0 items-center justify-center bg-white/20 z-10">
                <ActivityIndicator size="large" color="#111" />
              </View>
            )}
          </View>
        </View>
      </View>
      <View
        className="flex-row justify-between mt-[18px] mb-0 items-center h-[70px]"
        style={{ width: CARD_WIDTH }}
      >
        <TouchableOpacity
          className="flex-1 mx-[18px] py-[18px] rounded-2xl items-center bg-gray-900"
          style={{ elevation: 2 }}
          onPress={() => handleAnswer("no")}
        >
          <Text className="text-2xl font-bold text-white">No</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 mx-[18px] py-[18px] rounded-2xl items-center bg-gray-900"
          style={{ elevation: 2 }}
          onPress={() => handleAnswer("yes")}
        >
          <Text className="text-2xl font-bold text-white">Yes</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-lg text-gray-600 mt-2 font-bold text-center">
        {progressNum} / {shuffledImages.length}
      </Text>
    </View>
  );
}
