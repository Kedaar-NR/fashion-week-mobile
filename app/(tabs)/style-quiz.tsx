import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Emo_Opium_Goth.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L0Vtb19PcGl1bV9Hb3RoLmpwZyIsImlhdCI6MTc1MTE1OTEzOCwiZXhwIjoxNzgyNjk1MTM4fQ.7MbI5htBaNhUAX29GNOrmZ56fPYACiDy_QKM1FkVLuI",
  // Gorpcore
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Gorpcore.JPG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L0dvcnBjb3JlLkpQRyIsImlhdCI6MTc1MTE1OTE0NSwiZXhwIjoxNzgyNjk1MTQ1fQ.rrvPddkNmGMzRGrbTW4trMAx-7LazpsbWw61eFARsos",
  // Grunge 2
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Grunge%202.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L0dydW5nZSAyLmpwZyIsImlhdCI6MTc1MTE1OTE1MSwiZXhwIjoxNzgyNjk1MTUxfQ.cG7M5E1vP6k8xXEe_APW1VJf28Utnza0rhRPzHDm2q8",
  // Grunge
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Grunge.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L0dydW5nZS5qcGciLCJpYXQiOjE3NTExNTkxNTYsImV4cCI6MTc4MjY5NTE1Nn0.8yTNClPvghSc3bno0GpLJf_8cP95KBKG3hKMGC5HKVw",
  // IMG_4959
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/IMG_4959.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L0lNR180OTU5LmpwZyIsImlhdCI6MTc1MTE1OTE2NCwiZXhwIjoxNzgyNjk1MTY0fQ.Qa9h-tIkcBkOIXJgm-ezHoCUD1Z81vYvd0OUUbpBtlE",
  // Japanese Punk
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Japanese_Punk.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L0phcGFuZXNlX1B1bmsuanBnIiwiaWF0IjoxNzUxMTU5MTczLCJleHAiOjE3ODI2OTUxNzN9.2G-RYbC7JeAS90izTcp6MieN6TUbJdp5J1nDxkfg1us",
  // Leather
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Leather.JPG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L0xlYXRoZXIuSlBHIiwiaWF0IjoxNzUxMTU5MTc5LCJleHAiOjE3ODI2OTUxNzl9.ftsxPB-QXyg4S8fxH26iAbF8DfVzlatHbN_97N1k0H4",
  // Luxary Street (only once)
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Luxary%20Street.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L0x1eGFyeSBTdHJlZXQuanBnIiwiaWF0IjoxNzUxMTU5MTg0LCJleHAiOjE3ODI2OTUxODR9.5TKNQAb2MgggX-YG-KJM_B_UnMVW2XKW2q3-bw5FwIo",
  // Minimal Comfy
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Minimal_Comfy.JPG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L01pbmltYWxfQ29tZnkuSlBHIiwiaWF0IjoxNzUxMTU5MjAwLCJleHAiOjE3ODI2OTUyMDB9.SSp_XwS0GIhVA7Jhb0UlJaSJIrrvIz6CBvR4uz1Pfr0",
  // Minimalist
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Minimalist.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L01pbmltYWxpc3QuanBnIiwiaWF0IjoxNzUxMTU5MjA4LCJleHAiOjE3ODI2OTUyMDh9.cFScUx9cyHSjVOk5rAioNWMhn-zBVq1bhu3kz5V272A",
  // Opium Goth
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Opium_Goth.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L09waXVtX0dvdGguanBnIiwiaWF0IjoxNzUxMTU5MjE1LCJleHAiOjE3ODI2OTUyMTV9.sV3mG24ZHUykMRRdTMZasqf8M1DsH-FHPWFD8sByrjA",
  // Streetwear(1)
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Streetwear(1).JPG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L1N0cmVldHdlYXIoSDEpLkpQRyIsImlhdCI6MTc1MTE1OTIyMCwiZXhwIjoxNzgyNjk1MjIwfQ.nMeqYuZZqeeBrtquFoGx13zOcip7yKe_MfG7Oq9Xe5U",
  // Streetwear
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Streetwear.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L1N0cmVldHdlYXIuanBnIiwiaWF0IjoxNzUxMTU5MjI4LCJleHAiOjE3ODI2OTUyMjh9.UHO9BNGH66wtnUdT-AZl6IwqoDNMiQs7PsvOa5xAazU",
  // Vintage
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Vintage.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L1ZpbnRhZ2UuanBnIiwiaWF0IjoxNzUxMTU5MjM0LCJleHAiOjE3ODI2OTUyMzR9.ltxndn0eRSEYiDehUWqM_StfIn261NyFxq9128zBjrE",
  // work_street
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/work_street.JPG?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L3dvcmtfc3RyZWV0LkpQRyIsImlhdCI6MTc1MTE1OTIzOSwiZXhwIjoxNzgyNjk1MjM5fQ.PgLhyVxVzOuSw-v8wmM-UjeVta66iZ1oz8r9M-Qj1v4",
  // Workwear
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Workwear.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L1dvcmt3ZWFyLmpwZyIsImlhdCI6MTc1MTE1OTI0NCwiZXhwIjoxNzgyNjk1MjQ0fQ.gQDd0eMEXTgI4qu6SoVR4EQ_HqJN1uGO9lMvVKUzGK4",
  // Y2K Street
  "https://bslylabiiircssqasmcs.supabase.co/storage/v1/object/sign/style-quiz/Y2K_Street.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMzRhOTEyYS03YzNlLTQ1ZGYtOGIwNC0zNmU1MDY0M2IwMjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHlsZS1xdWl6L1kyS19TdHJlZXQuanBnIiwiaWF0IjoxNzUxMTU5MjUxLCJleHAiOjE3ODI2OTUyNTF9.z2oZmz6yFAsZkKBuj8fOvGsjMQDo-kCwHSFs8stsTq4",
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
  const router = useRouter();

  const pan = useRef(new Animated.ValueXY()).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Reset quiz and reshuffle images when navigating to this screen
  useFocusEffect(
    React.useCallback(() => {
      // setShuffledImages(shuffleArray(quizImages)); // REMOVED to prevent reshuffling on every focus
      setCurrent(0);
      setResponses([]);
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

  // Instantly switch to next image on swipe or button press
  const handleAnswer = (answer: "yes" | "no") => {
    Animated.timing(pan, {
      toValue: { x: answer === "yes" ? 500 : -500, y: 0 },
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      if (current < shuffledImages.length - 1) {
        setCurrent((prev) => prev + 1);
        pan.setValue({ x: 0, y: 0 });
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
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

  if (done || current >= shuffledImages.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.doneText}>Done</Text>
      </View>
    );
  }

  // Debug: log image URL
  const imageUrl = shuffledImages[current];
  console.log("Loading image:", imageUrl);

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
                {/* Preload the next image invisibly for seamless transition */}
                {current < shuffledImages.length - 1 && (
                  <Image
                    source={{ uri: shuffledImages[current + 1] }}
                    style={[
                      styles.image,
                      {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                      },
                    ]}
                    resizeMode="contain"
                    // No onError needed for preloading
                  />
                )}
                {/* Blur corners overlay */}
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
