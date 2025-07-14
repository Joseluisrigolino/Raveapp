import { apiClient, login as apiLogin } from "../apiConfig";

// Tipos que devuelve tu API
interface ApiRole {
  cdRol: number;
  dsRol: string;
}

interface ApiUser {
  idUsuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  isActivo: number;
  roles: ApiRole[];
  // …otros campos que necesites
}

// Tus tipos públicos
export type Role = "admin" | "owner" | "user";

export interface AuthUser {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  role: Role;
}

/**
 * Hace todo el flujo de login:
 *  1) pide el token “root” a /v1/Security/Login
 *  2) valida las credenciales del usuario en /v1/Usuario/Login
 *  3) trae datos de perfil en /v1/Usuario/GetUsuario
 */
export async function loginUser(
  correo: string,
  password: string
): Promise<AuthUser> {
  // 1) Obtener token “root”
  const token = await apiLogin();
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;

  // 2) Validar credentials del usuario
  const { data: ok } = await apiClient.get<boolean>(
    "/v1/Usuario/Login",
    {
      params: { Correo: correo, Password: password },
    }
  );
  if (!ok) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  // 3) Traer el perfil filtrado por correo e isActivo=true
  const { data: resp } = await apiClient.get<{ usuarios: ApiUser[] }>(
    "/v1/Usuario/GetUsuario",
    {
      params: {
        Mail: correo,
        IsActivo: true,
      },
    }
  );
  if (!resp.usuarios.length) {
    throw new Error("No se encontró el perfil de usuario");
  }
  const u = resp.usuarios[0];

  // 4) Mapear dsRol de la API a tu Role
  let role: Role;
  switch (u.roles[0]?.dsRol) {
    case "Administrador":
      role = "admin";
      break;
    case "Organizador":
      role = "owner";
      break;
    default:
      role = "user";
  }

  return {
    id: u.idUsuario,
    username: u.correo,
    nombre: u.nombre,
    apellido: u.apellido,
    role,
  };
}
