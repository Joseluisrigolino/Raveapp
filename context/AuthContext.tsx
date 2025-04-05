// context/AuthContext.tsx (ejemplo)

import React, { createContext, useContext, useState } from "react";
// Importa tu helper con la lógica de validación:
import { validateUser } from "@/utils/auth/authHelpers";

type Role = "admin" | "owner" | "user";

interface AuthUser {
  username: string;
  password: string;
  role: Role; // <-- “admin”, “owner” o “user”
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

// Creamos el contexto
const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => false,
  logout: () => {},
});

// Provider para envolver la app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  function login(username: string, password: string): boolean {
    // Llamamos a nuestro helper:
    const validatedUser = validateUser(username, password);
    if (validatedUser) {
      setUser(validatedUser); // <-- guardamos en el estado global
      return true;
    }
    return false;
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

// Hook para consumir el contexto
export function useAuth() {
  return useContext(AuthContext);
}
