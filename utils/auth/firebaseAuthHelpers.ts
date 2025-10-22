import Constants from "expo-constants";
import { auth } from "@/utils/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

export type Role = "admin" | "owner" | "user";

export interface AuthUser {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  roles: Role[];
}

function mapFirebaseUser(u: any): AuthUser {
  const displayName = u?.displayName || "";
  const [nombre, ...rest] = displayName.split(" ");
  const apellido = rest.join(" ").trim();
  return {
    id: u.uid,
    username: u.email || "",
    nombre: nombre || "",
    apellido: apellido || "",
    roles: ["user"],
  };
}

export async function fbLoginUser(email: string, password: string): Promise<AuthUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(cred.user);
}

export async function fbLogout(): Promise<void> {
  await signOut(auth);
}

export async function fbLoginWithGoogleIdToken(idOrAccessToken: string): Promise<AuthUser> {
  // Accept either an idToken, or an accessToken prefixed with 'access:'
  let credential;
  if (idOrAccessToken.startsWith('access:')) {
    const accessToken = idOrAccessToken.slice('access:'.length);
    credential = GoogleAuthProvider.credential(null, accessToken);
  } else {
    credential = GoogleAuthProvider.credential(idOrAccessToken);
  }
  const cred = await signInWithCredential(auth, credential);
  return mapFirebaseUser(cred.user);
}

// Web-only: Google login via Firebase popup (no Google Cloud config in app)
export async function fbLoginWithGooglePopup(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth as any, provider);
  return mapFirebaseUser(cred.user);
}

export async function fbRegisterUser(email: string, password: string, displayName?: string): Promise<AuthUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    try { await updateProfile(cred.user, { displayName }); } catch {}
  }
  return mapFirebaseUser(cred.user);
}
