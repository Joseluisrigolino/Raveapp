// src/context/AuthContext.tsx
import React, { createContext, useContext, useState } from "react";
import { loginUser, AuthUser } from "@/utils/auth/authHelpers";

interface AuthContextValue {
  user: AuthUser | null;
  login: (u: string, p: string) => Promise<AuthUser | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  async function login(username: string, password: string) {
    const u = await loginUser(username, password).catch(() => null);
    setUser(u);
    return u;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
