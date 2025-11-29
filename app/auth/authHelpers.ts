// src/utils/auth/authHelpers.ts
import { apiClient, login as apiLogin } from "@/app/apis/apiClient";

interface ApiRole { cdRol: number; dsRol: string }
interface ApiUser {
  idUsuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  isActivo: number;
  roles: ApiRole[];
}

export type Role = "admin" | "owner" | "user";

export interface AuthUser {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  roles: Role[];          // <- ahora es un array
}

export async function loginUser(correo: string, password: string): Promise<AuthUser> {
  const token = await apiLogin();
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;

  const { data: ok } = await apiClient.get<boolean>(
    "/v1/Usuario/Login",
    { params: { Correo: correo, Password: password } }
  );
  if (!ok) throw new Error("Usuario o contraseña incorrectos");

  const { data: resp } = await apiClient.get<{ usuarios: ApiUser[] }>(
    "/v1/Usuario/GetUsuario",
    { params: { Mail: correo, IsActivo: true } }
  );
  const u = resp.usuarios[0];
  if (!u) throw new Error("No se encontró el perfil");

  // Mapear **todos** los dsRol de la API
  const roles: Role[] = u.roles.map(r => {
    if (r.dsRol === "Administrador") return "admin";
    if (r.dsRol === "Organizador")   return "owner";
    return "user";
  });

  return {
    id: u.idUsuario,
    username: u.correo,
    nombre: u.nombre,
    apellido: u.apellido,
    roles,                  // <- guardamos el array completo
  };
}

// Utilidad para mapear un ApiUser a AuthUser
function mapApiUserToAuthUser(u: ApiUser): AuthUser {
  const roles: Role[] = (u.roles || []).map((r) => {
    if (r.dsRol === "Administrador") return "admin";
    if (r.dsRol === "Organizador") return "owner";
    return "user";
  });
  return {
    id: u.idUsuario,
    username: u.correo,
    nombre: u.nombre,
    apellido: u.apellido,
    roles: roles.length ? roles : ["user"],
  };
}

// Genera una contraseña aleatoria (para usuarios creados vía Google cuando la API exige password)
function generateRandomPassword(length = 16) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
  let password = "";
  for (let i = 0; i < length; i++) password += charset[Math.floor(Math.random() * charset.length)];
  return password;
}

// Tipos mínimos del id_token de Google (lo decodificamos localmente)
interface GoogleIdTokenPayload {
  email?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Login/Registro con Google a partir de un id_token devuelto por Google.
 * - Decodifica el token para obtener email y nombres.
 * - Busca al usuario por correo en la API; si no existe, lo crea.
 * - Devuelve el AuthUser mapeado (mismo contrato que loginUser)
 */
// Google Cloud login removed; Firebase handles Google sign-in when enabled.
