// app/auth/googleConfig.ts
import Constants from "expo-constants";

type ExpoGoogleExtra = {
  EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
  [key: string]: any;
};

export interface GoogleConfig {
  expoClientId: string;
  webClientId: string;
  androidClientId: string;
  iosClientId: string;
}

const expoExtra: ExpoGoogleExtra =
  (Constants?.expoConfig as any)?.extra ||
  (Constants as any)?.manifest2?.extra ||
  {};

function readPublicEnvOrExtra(envKey: keyof ExpoGoogleExtra): string {
  const fromEnv = process.env[envKey as string];
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  const fromExtra = expoExtra[envKey];
  if (typeof fromExtra === "string" && fromExtra.trim().length > 0) {
    return fromExtra.trim();
  }
  return "";
}

const rawGoogleConfig = {
  expoClientId: readPublicEnvOrExtra("EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID"),
  webClientId: readPublicEnvOrExtra("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"),
  androidClientId: readPublicEnvOrExtra("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID"),
  iosClientId: readPublicEnvOrExtra("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID"),
};

export const GOOGLE_CONFIG: GoogleConfig = {
  expoClientId: rawGoogleConfig.expoClientId || rawGoogleConfig.webClientId || "",
  webClientId: rawGoogleConfig.webClientId || rawGoogleConfig.expoClientId || "",
  androidClientId: rawGoogleConfig.androidClientId,
  iosClientId: rawGoogleConfig.iosClientId,
};

export function ensureGoogleClientId(): string {
  return (
    GOOGLE_CONFIG.expoClientId ||
    GOOGLE_CONFIG.androidClientId ||
    GOOGLE_CONFIG.iosClientId ||
    GOOGLE_CONFIG.webClientId ||
    ""
  );
}
