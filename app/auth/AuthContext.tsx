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
// small jwt decoder (no external dependency) — decodes payload from a JWT
function decodeJwt(token: string): any | null {
  try {
    const parts = String(token || "").split('.');
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // pad
    base64 += '='.repeat((4 - (base64.length % 4)) % 4);

    let binary = '';
    if (typeof atob === 'function') {
      binary = atob(base64);
    } else {
      // try Buffer (should work in many RN setups)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Buffer } = require('buffer');
      binary = Buffer.from(base64, 'base64').toString('binary');
    }

    // percent-encode the binary string then decode as UTF-8
    const decoded = decodeURIComponent(
      Array.prototype.map
        .call(binary, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}
// Cliente HTTP y helper para hacer login “técnico” contra la API (sin usuario final)
import { apiClient, login as apiLogin } from "@/app/apis/apiClient";
// Helpers de usuario (perfil + creación)
import { getProfile, createUsuario, getUsuarioById } from "@/app/auth/userApi";
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

  // Helper local para extraer/normalizar roles desde distintas formas
  // Mapeo de roles igual al que usa `loginUser` en authApi
  const API_ROLE_MAP: Record<string, string> = {
    Administrador: "admin",
    Organizador: "owner",
  };

  const computeRolesFromBackend = (obj: any): string[] => {
    const raw = obj?.roles ?? obj?.cdRoles;
    if (!Array.isArray(raw)) return [];
    // Si vienen objetos {cdRol, dsRol}
    if (raw.length && typeof raw[0] === "object") {
      return (raw as any[]).map((r) => API_ROLE_MAP[r?.dsRol] ?? "user");
    }
    // Si vienen strings (ej: ["Organizador"])
    if (raw.length && typeof raw[0] === "string") {
      return (raw as string[]).map((s) => API_ROLE_MAP[s] ?? "user");
    }
    // Si vienen números, no podemos mapear al nombre; devolvemos "user" por defecto
    return (raw as any[]).map(() => "user");
  };

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
          const mappedRoles = computeRolesFromBackend(logged);
          const mapped: any = {
            id: (logged as any).idUsuario || (logged as any).id || "",
            username: (logged as any).correo || "",
            nombre: (logged as any).nombre || "",
            apellido: (logged as any).apellido || "",
            roles: mappedRoles,
            // Guardamos el objeto raw por debug/consistencia si queremos inspeccionarlo
            rawBackend: logged,
          };

          if (__DEV__) console.debug("[Auth] mapped user from google login:", { mapped });

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
    if (__DEV__) console.debug("[Auth] loginOrCreateWithGoogleProfile incoming profile:", profile);
    const email = String(profile?.email || "")
      .trim()
      .toLowerCase();
    if (!email) return null;

    try {
      // 1) Intentamos ver si ya existe un usuario con ese correo
      let existing: any = null;
      try {
        existing = await getProfile(email);
      } catch (e: any) {
        if (__DEV__) console.debug("[Auth] getProfile initial check failed:", e?.response?.status, e?.response?.data || e?.message || e);
        existing = null;
      }

      if (existing) {
        // Si el usuario ya existe, NO vamos a modificarlo desde Google.
        // Solo logueamos y lo usamos tal cual viene del backend.
        try {
          if (__DEV__) console.debug("[Auth] user already exists - skipping updateUsuario. Using existing (initial):", existing);
          // Intentar obtener el perfil completo por idUsuario para asegurarnos de
          // traer todos los campos (roles, media, etc.) tal como están en la BD.
          let full: any = existing;
          try {
            if (existing.idUsuario) {
              const fetched = await getUsuarioById(existing.idUsuario);
              if (fetched) full = fetched;
            }
          } catch (fetchErr) {
            if (__DEV__) console.debug("[Auth] getUsuarioById fetch failed, using existing as-is:", fetchErr);
          }

          const mappedRoles = computeRolesFromBackend(full);
          const mapped = {
            id: full.idUsuario || full.id || "",
            username: full.correo || "",
            nombre: full.nombre || "",
            apellido: full.apellido || "",
            roles: mappedRoles,
            rawBackend: full,
          } as any;

          // Guardamos exactamente lo que venga del backend (mapeado mínimamente)
          if (__DEV__) console.debug("[Auth] mapped user from existing profile:", { mapped });
          setUser(mapped as any);
          await saveUserToStorage(mapped as any);
          return full as any;
        } catch (e) {
          // En caso de cualquier error de mapeo/persistencia, devolvemos el objeto existente
          return existing as any;
        }
      }

      // 2) Si no existe, creamos un usuario nuevo en el backend

      // No descargamos la imagen antes de crear el usuario: seguiremos
      // el flujo solicitado por la app: crear usuario primero, luego
      // descargar la imagen y subirla asociada al idUsuario creado.
      let fileObj: any = null;

      // Primero hacemos un login “técnico” para poder llamar al endpoint de creación
      const token = await apiLogin().catch((e) => {
        if (__DEV__) console.warn("apiLogin() failed:", e);
        return null;
      });
      if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      // Antes de crear, comprobamos con el token técnico si ya existe
      // un usuario con ese correo (GetUsuario ? Mail). Si existe, evitamos
      // crear y usamos el existente para la rama de update.
      let preexisting: any = null;
      if (token) {
        try {
          const respCheck = await apiClient.get(`/v1/Usuario/GetUsuario`, {
            params: { Mail: email },
          });
          const d = respCheck?.data;
          if (Array.isArray(d?.usuarios) && d.usuarios.length) {
            preexisting = d.usuarios[0];
          } else if (d && d.idUsuario) {
            preexisting = d;
          }
          if (__DEV__) console.debug("[Auth] preexisting check result:", preexisting);
        } catch (checkErr: any) {
          if (__DEV__) console.debug("[Auth] preexisting check failed:", checkErr?.response?.status, checkErr?.response?.data || checkErr?.message || checkErr);
        }
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
      } as any;

      if (__DEV__) {
        console.debug("[Auth] createUsuario token present:", !!token);
        console.debug("[Auth] createUsuario payload:", createPayload);
      }

      // Intentamos crear SOLO si no encontramos un usuario preexistente
      let createResult: any = null;
      // Flag para saber si en este flujo acabamos de crear el usuario ahora mismo
      let didCreate = false;
      if (preexisting) {
        if (__DEV__) console.debug("[Auth] user already exists, skipping create. Using preexisting:", preexisting);
        createResult = preexisting;
      } else {
        try {
          createResult = await createUsuario(createPayload);
          // Si la llamada a createUsuario no lanzó error, consideramos que creamos al usuario
          didCreate = true;
          if (__DEV__) console.debug("[Auth] createUsuario response:", createResult);
        } catch (err: any) {
          if (__DEV__) {
            console.error("[Auth] createUsuario failed:", err?.response?.status, err?.response?.data || err?.message || err);
          }
          // Fallback: si create falla, intentamos recuperar usuario por Mail
          try {
            const respCheck2 = await apiClient.get(`/v1/Usuario/GetUsuario`, { params: { Mail: email } });
            const d2 = respCheck2?.data;
            if (Array.isArray(d2?.usuarios) && d2.usuarios.length) {
              createResult = d2.usuarios[0];
            } else if (d2 && d2.idUsuario) {
              createResult = d2;
            }
            if (__DEV__) console.debug("[Auth] create fallback preexisting result:", createResult);
          } catch (checkErr2: any) {
            if (__DEV__) console.error("[Auth] fallback GetUsuario after create failed:", checkErr2?.response?.status, checkErr2?.response?.data || checkErr2?.message || checkErr2);
            throw err; // rethrow original create error
          }
        }
      }

      // Una vez creado, intentamos usar la respuesta de createUsuario
      // como fuente preferida si contiene el idUsuario; si no, pedimos
      // el perfil mediante GetUsuario (filtro IsActivo=true y fallback).
      let created: any = null;

      // createResult podría contener el usuario creado directamente
      if (createResult) {
        // Intentos de extracción comunes según distintas responses
        if (createResult.idUsuario) {
          created = createResult;
        } else if (createResult.usuario) {
          created = createResult.usuario;
        } else if (Array.isArray((createResult as any).usuarios) && (createResult as any).usuarios.length) {
          created = (createResult as any).usuarios[0];
        } else if (createResult.data && createResult.data.idUsuario) {
          created = createResult.data;
        }

        if (__DEV__) console.debug("[Auth] createResult-derived created:", created);
      }

      if (!created) {
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
            // No lanzamos aquí: continuamos sin created y haremos checks previos antes del upload
          }
        }
      }

      // No actualizamos el usuario en el backend desde el cliente después de crear.
      // Dejamos que el backend gestione roles y verificación; solo registramos en DEV.
      if (__DEV__) console.debug("[Auth] skipping updateUsuario after create (per policy)");

      // Ahora: si existe pictureUrl en el profile y tenemos created.idUsuario,
      // descargamos la imagen y la subimos a mediaApi asociada al idUsuario.
      // IMPORTANTE: solo hacemos esto si realmente acabamos de crear el usuario
      // en este flujo (no cuando el usuario ya existía y está solo logueando).
      try {
        const pictureUrl = (profile as any)?.pictureUrl || (profile as any)?.photo;
        if (pictureUrl) {
          if (!didCreate) {
            if (__DEV__) console.debug("[Auth] skipping photo download/upload because user was not created now (login-only)");
          } else if (!created || !created.idUsuario) {
            console.warn("[Auth] Skipping photo download/upload: created user missing or no idUsuario", { created });
          } else {
              try {
              const FileSystem = await import("expo-file-system/legacy");
              const tmpDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
              const filename = `google_profile_${created.idUsuario}.jpg`;
              const dest = `${tmpDir}${filename}`;
              if (__DEV__) console.debug("[Auth] will download pictureUrl after create:", pictureUrl, "to:", dest);
              const dl = await FileSystem.downloadAsync(pictureUrl, dest);
              if (__DEV__) console.debug("[Auth] downloadAsync result after create:", dl);
              fileObj = { uri: dl.uri, name: filename, type: "image/jpeg" } as any;

              if (__DEV__) console.debug("[Auth] calling mediaApi.upload with:", { idEntidad: created.idUsuario, file: fileObj });
              try {
                const uploadResult = await mediaApi.upload(created.idUsuario, fileObj, undefined, { compress: false });
                if (__DEV__) console.debug("[Auth] mediaApi.upload result:", uploadResult);
                // Después de subir, pedimos la lista de media asociada
                try {
                  const mediaList = await mediaApi.getByEntidad(created.idUsuario);
                  if (__DEV__) console.debug("[Auth] mediaApi.getByEntidad after upload:", mediaList);
                } catch (mlErr) {
                  if (__DEV__) console.warn("[Auth] mediaApi.getByEntidad failed after upload:", mlErr?.response?.data || mlErr?.message || mlErr);
                }

                // Refrescar perfil para que la UI pueda reconsultar media si corresponde
                try {
                  const refreshedProfile = await getProfile(email).catch(() => null);
                  if (refreshedProfile) {
                    created = refreshedProfile;
                    if (__DEV__) console.debug("[Auth] refreshed profile after upload:", refreshedProfile);
                  }
                } catch (rpErr) {
                  if (__DEV__) console.warn("[Auth] getProfile after upload failed:", rpErr?.response?.data || rpErr?.message || rpErr);
                }
              } catch (uploadErr: any) {
                console.error("[Auth] mediaApi.upload failed:", uploadErr?.response?.status, uploadErr?.response?.data || uploadErr?.message || uploadErr);
              }
            } catch (dlErr) {
              console.error("[Auth] downloadAsync failed after create:", dlErr?.message || dlErr);
            }
          }
        }
      } catch (e) {
        console.warn("processing google profile photo failed after create:", e);
      }
      // Mapear el perfil creado a AuthUser interno y asegurarnos de roles
      // Mapear el perfil creado a AuthUser interno y normalizar roles desde backend
      const createdRoles = computeRolesFromBackend(created);

      const mappedCreated = {
        id: (created as any).idUsuario || (created as any).id || "",
        username: (created as any).correo || "",
        nombre: (created as any).nombre || "",
        apellido: (created as any).apellido || "",
        roles: createdRoles,
        rawBackend: created,
      } as any;

      if (__DEV__) console.debug("[Auth] mapped user from create path:", { mappedCreated });

      setUser(mappedCreated as any);
      await saveUserToStorage(mappedCreated as any);

      return created as any;
    } catch (e: any) {
      if (__DEV__) console.error("[Auth] loginOrCreateWithGoogleProfile error:", e?.response?.status, e?.response?.data || e?.message || e);
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
      if (__DEV__) console.debug("[Auth] loginOrCreateWithGoogleIdToken idToken length:", idToken ? idToken.length : 0, "profile:", profile);

      // Preferimos el profile pasado por el cliente si existe y tiene email
      if (profile && profile.email) {
        return await loginOrCreateWithGoogleProfile(profile as GoogleProfile);
      }

      // Decodificamos el id_token con nuestro helper local
      const payload = decodeJwt(idToken);

      const email = payload?.email || payload?.upn || profile?.email || "";
      const givenName = payload?.given_name || payload?.givenName || profile?.givenName || "";
      const familyName = payload?.family_name || payload?.familyName || profile?.familyName || "";
      const pictureUrl = payload?.picture || profile?.picture || profile?.photo || "";

      return await loginOrCreateWithGoogleProfile({
        email,
        givenName,
        familyName,
        pictureUrl,
      });
    } catch (e: any) {
      if (__DEV__) console.error("[Auth] loginOrCreateWithGoogleIdToken error:", e?.response?.status, e?.response?.data || e?.message || e);
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
      const userRoles: any[] = (user as any)?.roles ?? (user as any)?.cdRoles ?? [];
      if (!Array.isArray(userRoles) || !userRoles.length) return false;
      return userRoles.some((r) => {
        if (typeof r === "string") return r === role;
        if (typeof r === "number") return String(r) === role;
        if (typeof r === "object") return r?.dsRol === role || String(r?.cdRol) === role;
        return false;
      });
    },
    [user]
  );

  /**
   * Chequea si el usuario tiene al menos uno de los roles pasados.
   */
  const hasAnyRole = useCallback(
    (roles: string[]) => {
      const userRoles: any[] = (user as any)?.roles ?? (user as any)?.cdRoles ?? [];
      if (!Array.isArray(userRoles) || !userRoles.length) return false;
      return userRoles.some((r) => {
        if (typeof r === "string") return roles.includes(r);
        if (typeof r === "number") return roles.includes(String(r));
        if (typeof r === "object") return roles.includes(r?.dsRol) || roles.includes(String(r?.cdRol));
        return false;
      });
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
