// app/auth/authHelpers.ts

// Cliente HTTP y helper de login técnico contra la API
import { apiClient, login as apiLogin } from "@/app/apis/apiClient";

/**
 * Representa un rol tal como viene desde la API.
 * Ejemplo: { cdRol: 1, dsRol: "Administrador" }
 */
interface ApiRole {
  cdRol: number;
  dsRol: string;
}

/**
 * Representa al usuario tal como viene desde la API.
 * Importante: este modelo depende del backend.
 */
interface ApiUser {
  idUsuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  isActivo: number;
  roles: ApiRole[];
}

/**
 * Roles normalizados que usamos dentro de la app.
 * Esto nos permite desacoplar los nombres de la API de la lógica del frontend.
 */
export type Role = "admin" | "owner" | "user";

/**
 * Usuario autenticado tal como lo maneja el frontend.
 * Es el tipo que usan el AuthContext y el resto de la app.
 */
export interface AuthUser {
  id: string;
  username: string;
  nombre: string;
  apellido: string;
  roles: Role[]; // array de roles ya normalizados
}

/**
 * Mapeo entre descripciones de rol que vienen de la API
 * y los roles internos que usamos en la app.
 */
const API_ROLE_MAP: Record<string, Role> = {
  Administrador: "admin",
  Organizador: "owner",
  // Cualquier otro rol se mapea más abajo como "user" por defecto
};

/**
 * Dado un rol de la API, lo convierte a Role interno.
 */
function mapApiRoleToRole(apiRole: ApiRole): Role {
  // Si el texto del rol existe en el mapa, usamos ese.
  // Si no, lo mandamos como "user" (rol genérico).
  return API_ROLE_MAP[apiRole.dsRol] ?? "user";
}

/**
 * Helper para mapear un ApiUser (modelo de backend)
 * a AuthUser (modelo interno de la app).
 */
function mapApiUserToAuthUser(apiUser: ApiUser): AuthUser {
  // Nos aseguramos de manejar el caso donde apiUser.roles pueda venir vacío o undefined
  const apiRoles = apiUser.roles ?? [];

  // Convertimos cada rol de API a nuestro Role interno
  const roles: Role[] = apiRoles.map(mapApiRoleToRole);

  return {
    id: apiUser.idUsuario,
    username: apiUser.correo,
    nombre: apiUser.nombre,
    apellido: apiUser.apellido,
    // Dejamos el array tal cual (aunque sea vacío),
    // y el resto de la app decide cómo interpretar "sin roles".
    roles,
  };
}

/**
 * Login de usuario con correo y contraseña contra la API.
 *
 * Flujo:
 * 1) Hace un login técnico (apiLogin) para obtener un token de la API.
 * 2) Con ese token, llama al endpoint de login de usuario final (/v1/Usuario/Login).
 * 3) Si las credenciales son correctas, busca el perfil completo del usuario
 *    en /v1/Usuario/GetUsuario.
 * 4) Mapea el ApiUser al AuthUser interno y lo devuelve.
 */
export async function loginUser(
  correo: string,
  password: string
): Promise<AuthUser> {
  // 1) Primero obtenemos un token para poder llamar a los endpoints protegidos.
  //    Este suele ser un "login técnico" o de servicio.
  const token = await apiLogin();

  // 2) Configuramos el header Authorization del apiClient
  //    para que todas las llamadas siguientes usen ese token.
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;

  // 3) Validamos las credenciales del usuario final.
  //    Este endpoint devuelve un booleano indicando si son correctas o no.
  const { data: ok } = await apiClient.get<boolean>("/v1/Usuario/Login", {
    params: {
      Correo: correo,
      Password: password,
    },
  });

  // Si la API dice que no son válidas, frenamos acá con un error.
  if (!ok) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  // 4) Si el login fue correcto, buscamos el perfil completo en el endpoint de usuario.
  const { data: resp } = await apiClient.get<{ usuarios: ApiUser[] }>(
    "/v1/Usuario/GetUsuario",
    {
      params: {
        Mail: correo,
        IsActivo: true,
      },
    }
  );

  // Tomamos el primer usuario de la respuesta.
  const apiUser = resp.usuarios[0];

  // Si no vino nada, algo está mal en el backend o en los datos.
  if (!apiUser) {
    throw new Error("No se encontró el perfil de usuario");
  }

  // 5) Mapeamos del modelo de backend (ApiUser) al modelo interno (AuthUser)
  const authUser = mapApiUserToAuthUser(apiUser);

  // 6) Devolvemos el usuario ya normalizado.
  return authUser;
}
