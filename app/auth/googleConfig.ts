// app/auth/googleConfig.ts

import Constants from "expo-constants"; // Leemos la config de Expo (extra, manifest, etc.)

/**
 * Tipo de lo que esperamos encontrar en `extra` de Expo.
 * No es estrictamente necesario, pero ayuda a que el archivo sea más entendible.
 */
type ExpoGoogleExtra = {
  EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
  // Permitimos cualquier otra key por si hay extra adicionales
  [key: string]: any;
};

/**
 * Configuración normalizada que va a usar la app para Google Sign-In.
 */
export interface GoogleConfig {
  expoClientId: string;
  iosClientId: string;
  androidClientId: string;
  webClientId: string;
}

/**
 * Obtenemos el objeto `extra` de la config de Expo.
 * - En proyectos nuevos viene en `expoConfig.extra`
 * - En algunos formatos/versions pasa por `manifest2.extra`
 */
const expoExtra: ExpoGoogleExtra =
  (Constants?.expoConfig as any)?.extra ||
  (Constants as any)?.manifest2?.extra ||
  {};

/**
 * Helper para leer una variable EXPO_PUBLIC_*:
 * 1) intenta usar process.env (útil en web/build),
 * 2) si no está, busca en `extra` de Expo (app.json / app.config).
 */
function readPublicEnvOrExtra(
  envKey: keyof ExpoGoogleExtra
): string {
  // Intentamos primero desde process.env (útil para web / builds con env)
  const fromEnv = process.env[envKey as string];
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  // Si no, miramos en el extra de Expo (app.json / app.config.js)
  const fromExtra = expoExtra[envKey];
  if (typeof fromExtra === "string" && fromExtra.trim().length > 0) {
    return fromExtra.trim();
  }

  // Si no hay nada, devolvemos string vacío
  return "";
}

/**
 * Leemos las raw client IDs sin aplicar aún la lógica de prioridades.
 */
const rawGoogleConfig = {
  // ID para Expo Go (cliente Expo)
  expoClientId: readPublicEnvOrExtra("EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID"),
  // ID nativo iOS
  iosClientId: readPublicEnvOrExtra("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID"),
  // ID nativo Android
  androidClientId: readPublicEnvOrExtra("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID"),
  // ID para web (y a veces también se usa como fallback en Expo Go)
  webClientId: readPublicEnvOrExtra("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"),
};

/**
 * Config que exportamos para usar en los hooks o componentes de login con Google.
 * Acá ya aplicamos la prioridad de fallback para `expoClientId`.
 */
export const GOOGLE_CONFIG: GoogleConfig = {
  // En Expo Go:
  // - primero intentamos con expoClientId
  // - si no hay, usamos webClientId como fallback
  // - y si tampoco hay, devolvemos string vacío
  expoClientId:
    rawGoogleConfig.expoClientId ||
    rawGoogleConfig.webClientId ||
    "",
  // Para nativos dejamos los valores tal cual (pueden ser string vacío si no se configuraron)
  iosClientId: rawGoogleConfig.iosClientId,
  androidClientId: rawGoogleConfig.androidClientId,
  webClientId: rawGoogleConfig.webClientId,
};

/**
 * Devuelve "algún" clientId válido para Google, según un orden de prioridad.
 *
 * Idea:
 * - En desarrollo / Expo Go suele servir expoClientId/webClientId.
 * - En builds nativas, preferimos el clientId específico de la plataforma.
 *
 * Si no hay ningún clientId configurado, devuelve string vacío.
 */
export function ensureGoogleClientId(): string {
  return (
    // Para apps en Expo Go / entorno híbrido
    GOOGLE_CONFIG.expoClientId ||
    // Para apps nativas Android
    GOOGLE_CONFIG.androidClientId ||
    // Para apps nativas iOS
    GOOGLE_CONFIG.iosClientId ||
    // Como último recurso, el de web
    GOOGLE_CONFIG.webClientId ||
    ""
  );
}
