// utils/authHelpers.ts
import { LoginUser } from "@/interfaces/LoginUser";

type Role = "admin" | "owner" | "user";

interface ExtendedLoginUser extends LoginUser {
  role: Role;
}

// Mock de usuarios con 3 roles distintos
const mockUsers: ExtendedLoginUser[] = [
  { username: "admin", password: "admin", role: "admin" },
  { username: "owner", password: "owner", role: "owner" },
  { username: "user",  password: "user",  role: "user" },
];

/**
 * Retorna el usuario (con su rol) si coincide username+password,
 * o null si no coincide.
 */
export function validateUser(username: string, password: string): ExtendedLoginUser | null {
  const found = mockUsers.find(
    (user) => user.username === username && user.password === password
  );
  return found ?? null;
}
