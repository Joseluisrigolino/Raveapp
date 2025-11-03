// src/context/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Constants from "expo-constants";
import { loginUser, AuthUser as ApiAuthUser } from "@/app/auth/authHelpers";
import { fbLoginWithGoogleIdToken, fbLogout, AuthUser as FbAuthUser, fbLoginWithGooglePopup } from "@/app/auth/firebaseAuthHelpers";
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AuthContext guarda el estado básico del usuario autenticado
 * y expone utilidades comunes para chequear permisos/roles.
 *
 * Contrato mínimo (inputs/outputs):
 * - user: AuthUser | null
 * - login(username, password) => Promise<AuthUser | null>
 * - logout() => void
 * - isAuthenticated: boolean
 * - hasRole(role) / hasAnyRole(roles)
 *
 * Esto permite no repetir checks como `user?.roles?.some(...)` en cada componente.
 */

type AuthUser = ApiAuthUser | FbAuthUser;

interface AuthContextValue {
  user: AuthUser | null;
  login: (u: string, p: string) => Promise<AuthUser | null>;
  loginWithGoogle: (idToken: string) => Promise<AuthUser | null>;
  loginWithGooglePopup?: () => Promise<AuthUser | null>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  updateUsuario: (payload: any) => Promise<void>;
  stashLoginExtras?: (extras: { nickname?: string; birthdate?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => null,
  loginWithGoogle: async () => null,
  loginWithGooglePopup: async () => null,
  logout: () => {},
  isAuthenticated: false,
  hasRole: () => false,
  hasAnyRole: () => false,
  updateUsuario: async () => {},
  stashLoginExtras: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const EX = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest2?.extra || {};
  const USE_FIREBASE = !!EX.EXPO_PUBLIC_USE_FIREBASE_AUTH;
  // Import updateUsuario from userHelpers
  const { updateUsuario } = require("@/app/auth/userHelpers");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario persistido al iniciar la app
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('raveapp_user');
        if (raw) {
          setUser(JSON.parse(raw));
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  // login delega al helper que maneja token + fetch del perfil
  async function login(username: string, password: string) {
    // Siempre usar el login de la API para el botón "Ingresar"
    const u = await loginUser(username, password).catch(() => null);
    setUser(u);
    if (u) {
      await AsyncStorage.setItem('raveapp_user', JSON.stringify(u));
    }
    return u;
  }

  async function logout() {
    try {
      if (USE_FIREBASE) await fbLogout();
    } finally {
      setUser(null);
      await AsyncStorage.removeItem('raveapp_user');
      await AsyncStorage.removeItem('raveapp_login_extras');
    }
  }

  async function loginWithGoogle(idToken: string) {
    try {
      const u = await fbLoginWithGoogleIdToken(idToken);
      setUser(u);
      await AsyncStorage.setItem('raveapp_user', JSON.stringify(u));
      return u;
    } catch (e) {
      return null;
    }
  }

  async function loginWithGooglePopup() {
    try {
      const u = await fbLoginWithGooglePopup();
      setUser(u);
      await AsyncStorage.setItem('raveapp_user', JSON.stringify(u));
      return u;
    } catch (e) {
      return null;
    }
  }

  // utilidades memoizadas para evitar recrearlas en cada render
  const isAuthenticated = useMemo(() => !!user, [user]);

  const hasRole = useCallback(
    (role: string) => {
      return !!user?.roles?.includes(role as any);
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: string[]) => {
      if (!user?.roles?.length) return false;
      return user.roles.some((r) => roles.includes(r));
    },
    [user]
  );

  if (loading) {
    // Opcional: puedes mostrar un loader global aquí
    return null;
  }

  async function stashLoginExtras(extras: { nickname?: string; birthdate?: string }) {
    try {
      await AsyncStorage.setItem('raveapp_login_extras', JSON.stringify(extras));
    } catch {}
  }

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithGoogle, loginWithGooglePopup, logout, isAuthenticated, hasRole, hasAnyRole, updateUsuario, stashLoginExtras }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para consumir el contexto de autenticación. */
export function useAuth() {
  return useContext(AuthContext);
}
