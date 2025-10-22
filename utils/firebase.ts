import Constants from "expo-constants";
import { initializeApp, getApps } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth, getAuth } from "firebase/auth";
// getReactNativePersistence is available at runtime in RN builds but may not be typed depending on sdk/ts setup
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getReactNativePersistence } = require("firebase/auth");

const EX = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest2?.extra || {};

const firebaseConfig = {
  apiKey: EX.EXPO_PUBLIC_FIREBASE_API_KEY || undefined,
  authDomain: EX.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || undefined,
  projectId: EX.EXPO_PUBLIC_FIREBASE_PROJECT_ID || undefined,
  storageBucket: EX.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: EX.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: EX.EXPO_PUBLIC_FIREBASE_APP_ID || undefined,
  measurementId: EX.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
};

// Initialize Firebase only once
const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig as any);

// Initialize Auth with React Native persistence (guard against re-init during fast refresh)
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // If Auth was already initialized for this app, retrieve it
  authInstance = getAuth(app);
}

export const auth = authInstance;
