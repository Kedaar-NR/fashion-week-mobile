import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

const { width, height } = Dimensions.get("window");
// Adjust card height to leave space for header and buttons
const HEADER_HEIGHT = 70; // estimate for title/subtitle spacing
const BUTTONS_HEIGHT = 90; // estimate for larger buttons
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
  const [responses, setResponses] = useState<
    { idx: number; answer: "yes" | "no" }[]
  >([]);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(Array(quizImages.length).fill(false));
  const [firstLoaded, setFirstLoaded] = useState(false);
  const router = useRouter();

  const pan = useRef(new Animated.ValueXY()).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Reset quiz and reshuffle images when navigating to this screen
  useFocusEffect(
    React.useCallback(() => {
      setShuffledImages(shuffleArray(quizImages));
      setCurrent(0);
      setResponses([]);
      setDone(false);
      setImageError(false);
      setLoaded(Array(quizImages.length).fill(false));
      setFirstLoaded(false);
      pan.setValue({ x: 0, y: 0 });
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }, [])
  );

  // Reset image error when current image changes
  useEffect(() => {
    setImageError(false);
  }, [current]);

  // Helper to animate card off-screen, then reset and show next image
  const animateCard = (direction: "left" | "right", onComplete: () => void) => {
    Animated.timing(pan, {
      toValue: { x: direction === "right" ? width * 1.2 : -width * 1.2, y: 0 },
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      onComplete();
    });
  };

  // Unified answer handler for both swipe and button
  const handleAnswer = (answer: "yes" | "no") => {
    animateCard(answer === "yes" ? "right" : "left", () => {
      if (current < shuffledImages.length - 1) {
        setCurrent((prev) => prev + 1);
      } else {
        setDone(true);
      }
    });
  };

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          animateCard("right", () => {
            if (current < shuffledImages.length - 1) {
              setCurrent((prev) => prev + 1);
            } else {
              setDone(true);
            }
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          animateCard("left", () => {
            if (current < shuffledImages.length - 1) {
              setCurrent((prev) => prev + 1);
            } else {
              setDone(true);
            }
          });
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

  // Show loading spinner until the first image is loaded
  if (!firstLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111" />
        <Text style={{ marginTop: 16, fontSize: 18, color: "#111" }}>
          Loading quiz image...
        </Text>
        {/* Preload all images invisibly */}
        {shuffledImages.map((uri, idx) => (
          <Image
            key={uri}
            source={{ uri }}
            style={{ width: 1, height: 1, position: "absolute", opacity: 0 }}
            onLoad={() => {
              setLoaded((prev) => {
                const next = [...prev];
                next[idx] = true;
                if (idx === 0) setFirstLoaded(true);
                return next;
              });
            }}
            onError={() => {
              setLoaded((prev) => {
                const next = [...prev];
                next[idx] = true;
                if (idx === 0) setFirstLoaded(true);
                return next;
              });
            }}
          />
        ))}
      </View>
    );
  }

  if (done || current >= shuffledImages.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.doneText}>Done</Text>
      </View>
    );
  }

  // Only render the current image (no stacking)
  return (
    <View style={styles.container}>
      <View style={{ height: 8 }} />
      <Text style={styles.title}>WHO ARE YOU?</Text>
      <Text style={styles.subtitle}>Swipe right for Yes, left for No</Text>
      <View style={{ alignItems: "center", width: "100%" }}>
        <View style={styles.swipeContainer}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  {
                    rotate: pan.x.interpolate({
                      inputRange: [-200, 0, 200],
                      outputRange: ["-15deg", "0deg", "15deg"],
                    }),
                  },
                  { scale: scaleAnim },
                ],
                opacity: fadeAnim,
              },
            ]}
          >
            {imageError ? (
              <View
                style={[
                  styles.image,
                  { alignItems: "center", justifyContent: "center" },
                ]}
              >
                <Text style={{ color: "#888" }}>Image not found</Text>
              </View>
            ) : (
              <>
                <Image
                  source={{ uri: shuffledImages[current] }}
                  style={styles.image}
                  resizeMode="contain"
                  onError={() => setImageError(true)}
                />
                <View pointerEvents="none" style={styles.blurCorners} />
              </>
            )}
          </Animated.View>
        </View>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton]}
          onPress={() => handleAnswer("no")}
        >
          <Text style={[styles.buttonText, { color: "#fff" }]}>No</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton]}
          onPress={() => handleAnswer("yes")}
        >
          <Text style={[styles.buttonText, { color: "#fff" }]}>Yes</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.progress}>
        {progressNum} / {shuffledImages.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#f3f4f6",
    paddingTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 0,
    marginTop: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: "center",
  },
  swipeContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    backgroundColor: "transparent",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    backgroundColor: "transparent",
    borderRadius: 14,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: CARD_WIDTH,
    marginTop: 18,
    marginBottom: 0,
    alignItems: "center",
    height: 70,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#111",
    elevation: 2,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  progress: {
    fontSize: 18,
    color: "#444",
    marginTop: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    padding: 0,
  },
  doneText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#111",
  },
  blurCorners: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 0,
    // Simulate blur with a white fade at the corners
    backgroundColor: "rgba(255,255,255,0.13)",
  },
});
