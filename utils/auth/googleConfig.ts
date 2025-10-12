// src/utils/auth/googleConfig.ts

// Fallbacks de desarrollo: se pueden quitar en producción si preferís usar solo env vars
const FALLBACK_ANDROID_ID = "728778718807-imc5ad9jh3om4oj48ohkaiv81o4e7gsv.apps.googleusercontent.com";

const RAW = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || "",
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || FALLBACK_ANDROID_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
};

export const GOOGLE_CONFIG = {
  // Si no hay expoClientId, usamos el mismo de la web para correr en Expo Go
  expoClientId: RAW.expoClientId || RAW.webClientId || "",
  iosClientId: RAW.iosClientId,
  androidClientId: RAW.androidClientId,
  webClientId: RAW.webClientId,
};

export function ensureGoogleClientId(): string {
  // En apps Expo (nativo) se usa normalmente el client id de Android/iOS. Para web, el webClientId.
  // Devolveremos uno prioritario o vacío si falta para que el caller pueda advertir.
  return (
    GOOGLE_CONFIG.expoClientId ||
    GOOGLE_CONFIG.androidClientId ||
    GOOGLE_CONFIG.iosClientId ||
    GOOGLE_CONFIG.webClientId ||
    ""
  );
}
