// src/context/AuthContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
// Config de Expo: donde leemos variables de entorno tipo EXPO_PUBLIC_*
import Constants from "expo-constants";
// Helpers propios para login clásico contra la API
import { loginUser, AuthUser as ApiAuthUser } from "@/app/auth/authApi";
// Helpers propios para login con Firebase + Google
import {
  fbLoginWithGoogleIdToken,
  fbLoginWithGooglePopup,
  fbLogout,
  AuthUser as FbAuthUser,
} from "@/app/auth/firebaseAuthHelpers";
// Para decodificar el id_token de Google y extraer email/nombre
import * as jwtDecode from "jwt-decode";
// Cliente HTTP y helper para hacer login “técnico” contra la API (sin usuario final)
import { apiClient, login as apiLogin } from "@/app/apis/apiClient";
// Helpers de usuario (perfil + creación)
import { getProfile, createUsuario } from "@/app/auth/userApi";
// Storage persistente en el dispositivo
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Claves de AsyncStorage usadas para guardar info de autenticación.
 */
const STORAGE_KEYS = {
  USER: "raveapp_user",
  LOGIN_EXTRAS: "raveapp_login_extras",
};

/**
 * Leemos las variables extra de la config de Expo.
 * Esto se evalúa una sola vez al importar el módulo.
 */
const EX =
  (Constants?.expoConfig as any)?.extra ||
  (Constants as any)?.manifest2?.extra ||
  {};

/**
 * Flag para saber si debemos usar Firebase Auth (según variable de entorno).
 */
const USE_FIREBASE = !!EX.EXPO_PUBLIC_USE_FIREBASE_AUTH;

/**
 * Tipo unificado de usuario autenticado:
 * puede venir de la API propia (ApiAuthUser) o de Firebase (FbAuthUser).
 */
type AuthUser = ApiAuthUser | FbAuthUser;

/**
 * Tipo interno para el perfil simplificado de Google que vamos a usar
 * cuando creamos un usuario nuevo a partir de su cuenta de Google.
 */
type GoogleProfile = {
  email: string;
  givenName?: string;
  familyName?: string;
  pictureUrl?: string;
};

/**
 * Interfaz pública del contexto de autenticación:
 * lo que cualquier componente de la app puede consumir vía useAuth().
 */
interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<AuthUser | null>;
  loginWithGoogle: (idToken: string) => Promise<AuthUser | null>;
  loginWithGooglePopup?: () => Promise<AuthUser | null>;
  loginOrCreateWithGoogleIdToken?: (
    idToken: string
  ) => Promise<ApiAuthUser | null>;
  loginOrCreateWithGoogleProfile?: (
    profile: GoogleProfile
  ) => Promise<ApiAuthUser | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  updateUsuario: (payload: any) => Promise<void>;
  stashLoginExtras?: (extras: {
    nickname?: string;
    birthdate?: string;
  }) => Promise<void>;
}

/**
 * Creamos el contexto con valores por defecto “neutros”.
 * Esto evita que se rompa nada si alguien usa useAuth() fuera del provider,
 * pero la idea es que siempre se envuelva la app con <AuthProvider>.
 */
const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => null,
  loginWithGoogle: async () => null,
  loginWithGooglePopup: async () => null,
  loginOrCreateWithGoogleIdToken: async () => null,
  loginOrCreateWithGoogleProfile: async () => null,
  logout: async () => {},
  isAuthenticated: false,
  hasRole: () => false,
  hasAnyRole: () => false,
  updateUsuario: async () => {},
  stashLoginExtras: async () => {},
});

/**
 * Helper para guardar el usuario en AsyncStorage.
 */
async function saveUserToStorage(user: AuthUser) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {
    // Si falla el storage, no queremos romper el flujo de login.
  }
}

/**
 * Helper para leer el usuario almacenado en AsyncStorage.
 */
async function loadUserFromStorage(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Helper para limpiar toda la info de autenticación en AsyncStorage.
 */
async function clearAuthStorage() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_EXTRAS);
  } catch {
    // Si falla la limpieza, tampoco queremos romper la app.
  }
}

/**
 * Provider de autenticación.
 * Envuelve al resto de la app y expone el contexto vía AuthContext.Provider.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Obtenemos updateUsuario con require dinámico.
  // (Esto suele usarse para evitar ciclos de import en algunos proyectos.)
  const { updateUsuario } = require("@/app/auth/userApi");

  // Estado con el usuario autenticado (o null si no hay sesión)
  const [user, setUser] = useState<AuthUser | null>(null);
  // Flag para saber si todavía estamos cargando el usuario desde storage
  const [loading, setLoading] = useState(true);

  /**
   * Al montar el provider:
   * - intentamos recuperar el usuario persistido en AsyncStorage
   * - y luego marcamos que terminó la carga inicial.
   */
  useEffect(() => {
    (async () => {
      const storedUser = await loadUserFromStorage();
      if (storedUser) {
        setUser(storedUser);
      }
      setLoading(false);
    })();
  }, []);

  /**
   * Login tradicional con usuario/contraseña contra nuestra API.
   * - delega en loginUser (que se encarga de token + perfil)
   * - guarda el usuario en estado y en AsyncStorage
   */
  async function login(
    username: string,
    password: string
  ): Promise<AuthUser | null> {
    try {
      const loggedUser = await loginUser(username, password);
      // Si el login fue OK, persistimos el usuario
      if (loggedUser) {
        setUser(loggedUser);
        await saveUserToStorage(loggedUser);
      }
      return loggedUser;
    } catch {
      // Si algo falla, devolvemos null y no seteamos usuario
      return null;
    }
  }

  /**
   * Logout general de la app.
   * - si usamos Firebase, desloguea también ahí
   * - limpia estado y storage local
   */
  async function logout(): Promise<void> {
    try {
      if (USE_FIREBASE) {
        await fbLogout();
      }
    } finally {
      setUser(null);
      await clearAuthStorage();
    }
  }

  /**
   * Login con Google usando un idToken obtenido desde el cliente,
   * delegando todo en Firebase.
   */
  async function loginWithGoogle(idToken: string): Promise<AuthUser | null> {
    try {
      const loggedUser = await fbLoginWithGoogleIdToken(idToken);
      setUser(loggedUser);
      await saveUserToStorage(loggedUser);
      return loggedUser;
    } catch {
      return null;
    }
  }

  /**
   * Login con Google usando el popup de Firebase (solo aplica en web).
   */
  async function loginWithGooglePopup(): Promise<AuthUser | null> {
    try {
      const loggedUser = await fbLoginWithGooglePopup();
      setUser(loggedUser);
      await saveUserToStorage(loggedUser);
      return loggedUser;
    } catch {
      return null;
    }
  }

  /**
   * Dado un perfil de Google:
   * - intenta buscar el usuario en el backend por correo
   * - si existe, lo setea como usuario autenticado
   * - si NO existe, crea un usuario nuevo con datos básicos de Google
   *   y luego lo trae para setearlo como autenticado.
   */
  async function loginOrCreateWithGoogleProfile(
    profile: GoogleProfile
  ): Promise<ApiAuthUser | null> {
    const email = String(profile?.email || "")
      .trim()
      .toLowerCase();
    if (!email) return null;

    try {
      // 1) Intentamos ver si ya existe un usuario con ese correo
      const existing = await getProfile(email).catch(() => null);

      if (existing) {
        // Si existe, lo seteamos como usuario actual y persistimos
        setUser(existing as any);
        await saveUserToStorage(existing as any);
        return existing as any;
      }

      // 2) Si no existe, creamos un usuario nuevo en el backend

      // Primero hacemos un login “técnico” para poder llamar al endpoint de creación
      const token = await apiLogin().catch(() => null);
      if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      // Generamos una contraseña aleatoria (no se usa a nivel frontend)
      const randomPass =
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2);

      // Creamos el usuario en el backend con datos mínimos de Google
      await createUsuario({
        domicilio: {
          localidad: { nombre: "", codigo: "" },
          municipio: { nombre: "", codigo: "" },
          provincia: { nombre: "", codigo: "" },
          direccion: "",
          latitud: 0,
          longitud: 0,
        },
        nombre: (profile.givenName || "").trim() || "Usuario",
        apellido: (profile.familyName || "").trim(),
        correo: email,
        cbu: "",
        dni: "",
        telefono: "",
        nombreFantasia: "",
        bio: "",
        password: randomPass,
        socials: {
          idSocial: "",
          mdInstagram: "",
          mdSpotify: "",
          mdSoundcloud: "",
        },
        dtNacimiento: new Date("2000-01-01").toISOString(),
      });

      // Una vez creado, volvemos a pedir el perfil para obtener
      // la versión “real” que maneja el backend
      const created = await getProfile(email);

      setUser(created as any);
      await saveUserToStorage(created as any);

      return created as any;
    } catch {
      return null;
    }
  }

  /**
   * Variante donde en lugar de recibir el perfil de Google ya “armado”,
   * recibimos directamente el id_token y lo decodificamos acá.
   */
  async function loginOrCreateWithGoogleIdToken(
    idToken: string
  ): Promise<ApiAuthUser | null> {
    try {
      // jwtDecode está importado como módulo completo, así que lo tratamos como función any
      const payload: any = (jwtDecode as any)(idToken);

      // Según la implementación de Google, estos campos pueden variar un poco
      const email = payload?.email || payload?.upn || "";
      const givenName = payload?.given_name || payload?.givenName || "";
      const familyName = payload?.family_name || payload?.familyName || "";
      const pictureUrl = payload?.picture || "";

      return await loginOrCreateWithGoogleProfile({
        email,
        givenName,
        familyName,
        pictureUrl,
      });
    } catch {
      return null;
    }
  }

  /**
   * Flag derivado: simplemente true/false según haya usuario cargado o no.
   */
  const isAuthenticated = useMemo(() => !!user, [user]);

  /**
   * Chequea si el usuario tiene un rol puntual.
   * Asume que user.roles es un array de strings.
   */
  const hasRole = useCallback(
    (role: string) => {
      return !!(user as any)?.roles?.includes(role);
    },
    [user]
  );

  /**
   * Chequea si el usuario tiene al menos uno de los roles pasados.
   */
  const hasAnyRole = useCallback(
    (roles: string[]) => {
      const userRoles: string[] = (user as any)?.roles || [];
      if (!userRoles.length) return false;
      return userRoles.some((r) => roles.includes(r));
    },
    [user]
  );

  /**
   * Permite guardar info extra del login (ej: nickname, fecha de nacimiento)
   * que todavía no está en el backend, pero se quiere usar en el flujo.
   */
  async function stashLoginExtras(extras: {
    nickname?: string;
    birthdate?: string;
  }) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LOGIN_EXTRAS,
        JSON.stringify(extras)
      );
    } catch {
      // No queremos romper el flujo si falla el storage.
    }
  }

  /**
   * Mientras estamos cargando el usuario desde AsyncStorage,
   * podemos devolver null o algún loader global.
   * (Acá se deja en null para que el árbol no se renderice hasta terminar.)
   */
  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        loginWithGooglePopup,
        loginOrCreateWithGoogleIdToken,
        loginOrCreateWithGoogleProfile,
        logout,
        isAuthenticated,
        hasRole,
        hasAnyRole,
        updateUsuario,
        stashLoginExtras,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook de conveniencia para poder hacer:
 * const { user, login, logout } = useAuth();
 */
export function useAuth() {
  return useContext(AuthContext);
}
