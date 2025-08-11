import { router } from "expo-router";
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
import QuizCard from "../components/QuizCard";

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
const CARD_WIDTH = width * 0.88;
const CARD_HEIGHT = width * 1.08;

function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function OnboardingScreen() {
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

  // Intro flow
  const [phase, setPhase] = useState<"intro1" | "intro2" | "quiz">("intro1");
  const introOpacity = useRef(new Animated.Value(1)).current;

  const pan = useRef(new Animated.ValueXY()).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const appearAnim = useRef(new Animated.Value(0)).current;
  const appearScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    setShuffledImages(shuffleArray(quizImages));
    setCurrent(0);
    setDone(false);
    setImageError(false);
    pan.setValue({ x: 0, y: 0 });
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
  }, []);

  // Run intro sequence: intro1 fade out 2s -> intro2 fade in -> hold 2s -> fade out -> quiz
  useEffect(() => {
    if (phase !== "intro1") return;
    introOpacity.setValue(1);
    Animated.timing(introOpacity, {
      toValue: 0,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      setPhase("intro2");
      introOpacity.setValue(0);
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // Hold visible for 2s, then fade out and enter quiz
        setTimeout(() => {
          Animated.timing(introOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }).start(() => {
            setPhase("quiz");
          });
        }, 2000);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    setImageError(false);
  }, [current]);

  useEffect(() => {
    shuffledImages.forEach((uri) => {
      RNImage.prefetch(uri);
    });
  }, [shuffledImages]);

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

  useEffect(() => {
    let didCancel = false;
    setFirstImageLoaded(false);
    const url = quizImages[0];
    RNImage.prefetch(url)
      .then(() => {
        if (!didCancel) setFirstImageLoaded(true);
      })
      .catch(() => {
        if (!didCancel) setFirstImageLoaded(true);
      });
    return () => {
      didCancel = true;
    };
  }, []);

  const animateCard = (direction: "left" | "right") => {
    setIsAnimatingOut(true);
    setTransitioning(true);
    Animated.timing(pan, {
      toValue: { x: direction === "right" ? width * 1.2 : -width * 1.2, y: 0 },
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      if (current < shuffledImages.length - 1) {
        setCurrent((prev) => prev + 1);
      } else {
        setDone(true);
        finishOnboarding();
      }
      setTransitioning(false);
      setIsAnimatingOut(false);
    });
  };

  const finishOnboarding = () => {
    router.replace("/(tabs)");
  };

  const handleAnswer = (answer: "yes" | "no") => {
    if (transitioning || isAnimatingOut) return;
    animateCard(answer === "yes" ? "right" : "left");
  };

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

  const progressNum =
    current < shuffledImages.length ? current + 1 : shuffledImages.length;
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

  if (phase !== "quiz") {
    return (
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "#f3f4f6",
          alignItems: "center",
          justifyContent: "center",
          opacity: introOpacity,
          paddingHorizontal: 24,
        }}
      >
        {phase === "intro1" ? (
          <Text
            style={{
              fontSize: 40,
              fontWeight: "bold",
              color: "#111827",
              textAlign: "center",
            }}
          >
            FIRST LET'S LEARN YOUR STYLE
          </Text>
        ) : (
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#111827",
              textAlign: "center",
              lineHeight: 32,
            }}
          >
            SWIPE RIGHT IF YOU LIKE IT{"\n"}SWIPE LEFT IF YOU DON'T
          </Text>
        )}
      </Animated.View>
    );
  }

  if (done || current >= shuffledImages.length) {
    return null; // No end screen; immediately navigated away
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
      }}
    >
      <Text
        style={{
          fontSize: 40,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        WHO ARE YOU?
      </Text>
      <View style={{ alignItems: "center", width: "100%" }}>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 0,
            backgroundColor: "transparent",
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          }}
        >
          <View style={{ width: "100%", height: "100%" }}>
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
            {current === 0 && !firstImageLoaded && (
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  zIndex: 10,
                }}
              >
                <ActivityIndicator size="large" color="#111" />
              </View>
            )}
          </View>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 18,
          marginBottom: 0,
          alignItems: "center",
          height: 70,
          width: CARD_WIDTH,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            marginHorizontal: 18,
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: "center",
            backgroundColor: "#111827",
            elevation: 2,
          }}
          onPress={() => handleAnswer("no")}
        >
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#fff" }}>
            No
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            marginHorizontal: 18,
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: "center",
            backgroundColor: "#111827",
            elevation: 2,
          }}
          onPress={() => handleAnswer("yes")}
        >
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#fff" }}>
            Yes
          </Text>
        </TouchableOpacity>
      </View>
      <Text
        style={{
          fontSize: 18,
          color: "#6b7280",
          marginTop: 8,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {progressNum} / {shuffledImages.length}
      </Text>
    </View>
  );
}
