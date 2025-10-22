// src/utils/auth/googleConfig.ts
import Constants from "expo-constants";

// Lee IDs desde variables EXPO_PUBLIC_* o desde app.json extra
const EX = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest2?.extra || {};

const RAW = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || EX.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || "",
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || EX.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || EX.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || EX.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
};

export const GOOGLE_CONFIG = {
  // En Expo Go, podés usar expoClientId (o el de web como fallback solamente si vos lo configuraste)
  expoClientId: RAW.expoClientId || RAW.webClientId || "",
  iosClientId: RAW.iosClientId,
  androidClientId: RAW.androidClientId,
  webClientId: RAW.webClientId,
};

export function ensureGoogleClientId(): string {
  // Prioridad según entorno típico: Expo Go -> expoClientId/web, Android/iOS nativos -> sus respectivos
  return (
    GOOGLE_CONFIG.expoClientId ||
    GOOGLE_CONFIG.androidClientId ||
    GOOGLE_CONFIG.iosClientId ||
    GOOGLE_CONFIG.webClientId ||
    ""
  );
}
