// utils/authHelpers.ts
import { LoginUser } from "@/interfaces/LoginUser";

// Mock de usuarios (luego vendrá de una API real)
const mockUsers: LoginUser[] = [
  { username: "admin", password: "admin" },
  // Agrega más si deseas
];

/** Retorna true si el usuario/contraseña coinciden con el mock */
export function validateUser(username: string, password: string): boolean {
  return mockUsers.some(
    (user) => user.username === username && user.password === password
  );
}
