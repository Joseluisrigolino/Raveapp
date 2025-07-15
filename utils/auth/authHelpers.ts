// src/utils/auth/authHelpers.ts
import { apiClient, login as apiLogin } from "../apiConfig";

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
