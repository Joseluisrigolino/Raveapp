// Firebase Auth helpers (Google)
// Implementación real usando Firebase Web SDK

import Constants from "expo-constants";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from "firebase/auth";

export interface AuthUser {
  id: string;
  username: string;
  nombre?: string;
  apellido?: string;
  roles?: string[];
}

function getFirebaseConfig() {
  // Lee la config desde EXPO_PUBLIC_* en app.json o variables de entorno
  const EX = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest2?.extra || {};
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || EX.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || EX.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || EX.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || EX.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || EX.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || EX.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || EX.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  } as const;
}

function ensureFirebase() {
  const config = getFirebaseConfig();
  if (!getApps().length) {
    initializeApp(config);
  }
  return getApp();
}

function mapUser(u: any): AuthUser {
  const displayName: string = u?.displayName || "";
  const [nombre, ...rest] = displayName.split(" ");
  const apellido = rest.join(" ").trim();
  return {
    id: u?.uid,
    username: u?.email || u?.uid || "",
    nombre: nombre || undefined,
    apellido: apellido || undefined,
    roles: [],
  };
}

/**
 * Login con Google usando un id_token ya obtenido (móvil: expo-auth-session)
 */
export async function fbLoginWithGoogleIdToken(idToken: string): Promise<AuthUser | null> {
  try {
    ensureFirebase();
    const auth = getAuth();
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return mapUser(result.user);
  } catch (e) {
    console.warn("fbLoginWithGoogleIdToken error:", e);
    return null;
  }
}

/**
 * Login interactivo con popup (web)
 */
export async function fbLoginWithGooglePopup(): Promise<AuthUser | null> {
  try {
    ensureFirebase();
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return mapUser(result.user);
  } catch (e) {
    console.warn("fbLoginWithGooglePopup error:", e);
    return null;
  }
}

/**
 * Logout para Firebase
 */
export async function fbLogout(): Promise<void> {
  try {
    ensureFirebase();
    const auth = getAuth();
    await signOut(auth);
  } catch {
    // no-op
  }
}

export default {} as any;
