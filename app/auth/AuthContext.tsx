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
// Para decodificar el id_token de Google y extraer email/nombre
import jwtDecode from "jwt-decode";
// Cliente HTTP y helper para hacer login “técnico” contra la API (sin usuario final)
import { apiClient, login as apiLogin } from "@/app/apis/apiClient";
// Helpers de usuario (perfil + creación)
import { getProfile, createUsuario } from "@/app/auth/userApi";
import { mediaApi } from "@/app/apis/mediaApi";
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
 * Tipo unificado de usuario autenticado:
 * puede venir de la API propia (ApiAuthUser) o de Firebase (FbAuthUser).
 */
type AuthUser = ApiAuthUser;

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
}

const AuthContext = createContext<AuthContextValue | any>({} as any);

// Helpers simples de persistencia local usados por el provider
async function saveUserToStorage(user: any) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {
    // ignore
  }
}

async function loadUserFromStorage(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function clearAuthStorage() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_EXTRAS);
  } catch {
    // ignore
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
    // No Firebase logout: our backend/session is handled via API tokens.
    setUser(null);
    await clearAuthStorage();
  }

  /**
   * Login con Google usando un idToken obtenido desde el cliente,
   * delegando todo en Firebase.
   */
  // Legacy-compatible wrappers for Google login flows. We delegate to
  // loginOrCreateWithGoogleIdToken which handles backend creation/lookup.
  async function loginWithGoogle(idToken: string): Promise<AuthUser | null> {
    try {
      const logged = await loginOrCreateWithGoogleIdToken(idToken as any);
        if (logged) {
          // Si la función devolvió el perfil del backend, mapeamos al shape interno
          const mapped: any = {
            id: (logged as any).idUsuario || (logged as any).id || "",
            username: (logged as any).correo || "",
            nombre: (logged as any).nombre || "",
            apellido: (logged as any).apellido || "",
            roles: Array.isArray((logged as any).roles) ? (logged as any).roles : ["user"],
          };

          setUser(mapped as any);
          await saveUserToStorage(mapped as any);
          return mapped as any;
        }
      return null;
    } catch {
      return null;
    }
  }

  async function loginWithGooglePopup(): Promise<AuthUser | null> {
    console.warn("loginWithGooglePopup is deprecated; use expo-auth-session flow.");
    return null;
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
        // Si existe, actualizamos su información a partir del profile de Google
        try {
          const updatePayload: any = {
            idUsuario: (existing as any).idUsuario || (existing as any).id,
            nombre: (profile as any)?.givenName?.trim() || (existing as any).nombre || "",
            apellido: (profile as any)?.familyName?.trim() || (existing as any).apellido || "",
            correo: email || (existing as any).correo || "",
            dni: (existing as any).dni || "",
            telefono: (existing as any).telefono || "",
            cbu: (existing as any).cbu || "",
            nombreFantasia: (existing as any).nombreFantasia || "",
            bio: (existing as any).bio || "",
            isVerificado: (existing as any).isVerificado ?? 0,
            dtNacimiento: (existing as any).dtNacimiento || new Date("2000-01-01").toISOString(),
            domicilio: (existing as any).domicilio || {
              localidad: { nombre: "", codigo: "" },
              municipio: { nombre: "", codigo: "" },
              provincia: { nombre: "", codigo: "" },
              direccion: "",
              latitud: 0,
              longitud: 0,
            },
            cdRoles: (existing as any).cdRoles || (existing as any).roles || [],
            socials: (existing as any).socials || { idSocial: "", mdInstagram: "", mdSpotify: "", mdSoundcloud: "" },
          };

          // updateUsuario hace merge internamente, así que podemos pasar un payload parcial
          try {
            await updateUsuario(updatePayload);
          } catch (err: any) {
            if (__DEV__) console.error("[Auth] updateUsuario failed:", err?.response?.status, err?.response?.data || err?.message || err);
          }

          // Refrescamos el perfil para asegurarnos de tener los datos actualizados
          const refreshed = await getProfile(email).catch(() => existing as any);

          const maybeRoles = (refreshed as any).roles;
          const roles = Array.isArray(maybeRoles) && typeof maybeRoles[0] === 'string'
            ? maybeRoles
            : ["user"];

          const mapped = {
            id: (refreshed as any).idUsuario || (refreshed as any).id || "",
            username: (refreshed as any).correo || "",
            nombre: (refreshed as any).nombre || "",
            apellido: (refreshed as any).apellido || "",
            roles,
          } as any;

          setUser(mapped as any);
          await saveUserToStorage(mapped as any);
          return refreshed as any;
        } catch (e) {
          // Si algo falla, caemos de vuelta a devolver el existing sin bloquear el flujo
          setUser(existing as any);
          await saveUserToStorage(existing as any);
          return existing as any;
        }
      }

      // 2) Si no existe, creamos un usuario nuevo en el backend

      // Primero hacemos un login “técnico” para poder llamar al endpoint de creación
      const token = await apiLogin().catch((e) => {
        if (__DEV__) console.warn("apiLogin() failed:", e);
        return null;
      });
      if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      // Generamos una contraseña aleatoria (no se usa a nivel frontend)
      const randomPass =
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2);

      // Creamos el usuario en el backend con datos mínimos de Google
      const createPayload = {
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
          idSocial: (profile as any)?.id ?? "",
          mdInstagram: "",
          mdSpotify: "",
          mdSoundcloud: "",
        },
        dtNacimiento: new Date("2000-01-01").toISOString(),
        isVerificado: 1,
        cdRoles: [0],
      } as any;

      if (__DEV__) {
        console.debug("[Auth] createUsuario token present:", !!token);
        console.debug("[Auth] createUsuario payload:", createPayload);
      }

      // Intentamos crear y si hay error lo logueamos con detalle
      let createResult: any = null;
      try {
        createResult = await createUsuario(createPayload);
        if (__DEV__) console.debug("[Auth] createUsuario response:", createResult);
      } catch (err: any) {
        if (__DEV__) {
          console.error("[Auth] createUsuario failed:", err?.response?.status, err?.response?.data || err?.message || err);
        }
        throw err;
      }

      // Una vez creado, volvemos a pedir el perfil para obtener
      // la versión “real” que maneja el backend. Algunos backends
      // crean el usuario con IsActivo=false inicialmente, por lo
      // que la búsqueda con filtro IsActivo=true puede fallar.
      let created: any = null;
      try {
        created = await getProfile(email);
      } catch (err) {
        if (__DEV__) console.warn("[Auth] getProfile(email) with IsActivo=true failed, trying without IsActivo:", err);
        try {
          // Intentamos el endpoint directamente sin el filtro IsActivo
          const resp = await apiClient.get(`/v1/Usuario/GetUsuario`, {
            params: { Mail: email },
          });
          const data = resp?.data;
          if (Array.isArray(data?.usuarios) && data.usuarios.length) {
            created = data.usuarios[0];
          } else if (data && data.idUsuario) {
            created = data;
          }
        } catch (err2) {
          if (__DEV__) console.error("[Auth] fallback GetUsuario failed:", err2);
          throw err; // rethrow original
        }
      }

      // Asegurarnos de que el usuario tenga isVerificado y rol 0: llamar updateUsuario
      try {
        const updatePayload: any = {
          idUsuario: created.idUsuario,
          nombre: created.nombre || (profile as any)?.givenName || "",
          apellido: created.apellido || (profile as any)?.familyName || "",
          correo: created.correo || email,
          dni: created.dni || "",
          telefono: created.telefono || "",
          cbu: created.cbu || "",
          nombreFantasia: created.nombreFantasia || "",
          bio: created.bio || "",
          isVerificado: 1,
          dtNacimiento: created.dtNacimiento || new Date("2000-01-01").toISOString(),
          domicilio: created.domicilio || {
            localidad: { nombre: "", codigo: "" },
            municipio: { nombre: "", codigo: "" },
            provincia: { nombre: "", codigo: "" },
            direccion: "",
            latitud: 0,
            longitud: 0,
          },
          cdRoles: [0],
          socials: created.socials || { idSocial: "", mdInstagram: "", mdSpotify: "", mdSoundcloud: "" },
        };

          try {
            await updateUsuario(updatePayload);
          } catch (err: any) {
            if (__DEV__) {
              console.error("[Auth] updateUsuario failed:", err?.response?.status, err?.response?.data || err?.message || err);
            }
          }
      } catch (e) {
        // no rompemos el flujo si el update falla
      }

      // Si tenemos URL de foto en el profile de Google, intentamos
      // descargarla y subirla como media asociada al usuario creado.
      try {
        const pictureUrl = (profile as any)?.pictureUrl || (profile as any)?.photo;
        if (pictureUrl) {
          // Descargamos la imagen al cache local
          const FileSystem = await import("expo-file-system");
          const tmpDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
          const filename = `google_profile_${created.idUsuario}.jpg`;
          const dest = `${tmpDir}${filename}`;

          try {
            const dl = await FileSystem.downloadAsync(pictureUrl, dest);
            const fileObj = { uri: dl.uri, name: filename } as any;
            // Subimos la foto asociada al usuario (idUsuario como entidad)
            await mediaApi.upload(created.idUsuario, fileObj, undefined, { compress: false });
          } catch (e) {
            console.warn("upload Google profile photo failed:", e);
          }
        }
      } catch (e) {
        console.warn("processing google profile photo failed:", e);
      }
      // Mapear el perfil creado a AuthUser interno y asegurarnos de roles
      const maybeCreatedRoles = (created as any).roles;
      const createdRoles = Array.isArray(maybeCreatedRoles) && typeof maybeCreatedRoles[0] === 'string'
        ? maybeCreatedRoles
        : ["user"];

      const mappedCreated = {
        id: (created as any).idUsuario || (created as any).id || "",
        username: (created as any).correo || "",
        nombre: (created as any).nombre || "",
        apellido: (created as any).apellido || "",
        roles: createdRoles,
      } as any;

      setUser(mappedCreated as any);
      await saveUserToStorage(mappedCreated as any);

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
    idToken: string,
    profile?: any
  ): Promise<ApiAuthUser | null> {
    try {
      // Preferimos el profile pasado por el cliente si existe
      if (profile && profile.email) {
        return await loginOrCreateWithGoogleProfile(profile as GoogleProfile);
      }

      // Decodificamos el id_token si no se pasó profile
      const payload: any = (jwtDecode as any)(idToken);

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
