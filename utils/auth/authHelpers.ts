// src/utils/auth/authHelpers.ts
import { apiClient, login as apiLogin } from "../apiConfig";
import { jwtDecode } from "jwt-decode";

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
export async function loginOrRegisterWithGoogleIdToken(idToken: string): Promise<AuthUser> {
  if (!idToken) throw new Error("Falta id_token de Google");

  const decoded = jwtDecode<GoogleIdTokenPayload>(idToken);
  const email = (decoded.email || "").trim();
  const given_name = decoded.given_name || "";
  const family_name = decoded.family_name || "";
  if (!email) throw new Error("El id_token de Google no contiene email");

  const token = await apiLogin();
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;

  // 1) Intentar obtener el usuario por correo
  let usuario: ApiUser | null = null;
  try {
    const res = await apiClient.get<{ usuarios: ApiUser[] }>("/v1/Usuario/GetUsuario", { params: { Mail: email } });
    if (Array.isArray(res.data?.usuarios) && res.data.usuarios.length > 0) {
      usuario = res.data.usuarios[0];
    }
  } catch (err: any) {
    // Si 404, lo creamos. Otros errores se re-lanzan
    if (err?.response?.status !== 404) throw err;
  }

  // 2) Si no existe, crearlo y volver a buscar
  if (!usuario) {
    const payload = {
      domicilio: {
        localidad: { nombre: "", codigo: "" },
        municipio: { nombre: "", codigo: "" },
        provincia: { nombre: "", codigo: "" },
        direccion: "",
        latitud: 0,
        longitud: 0,
      },
      nombre: given_name,
      apellido: family_name,
      correo: email,
      cbu: "",
      dni: "",
      telefono: "",
      nombreFantasia: "",
      bio: "",
      password: generateRandomPassword(),
      socials: { idSocial: "", mdInstagram: "", mdSpotify: "", mdSoundcloud: "" },
      // La API puede aceptar null o ISO string; si falla con null, probar con nueva fecha o quitar el campo
      dtNacimiento: null as any,
    };

    try {
      await apiClient.post("/v1/Usuario/CreateUsuario", payload, { headers: { "Content-Type": "application/json" } });
      const buscarRes = await apiClient.get<{ usuarios: ApiUser[] }>("/v1/Usuario/GetUsuario", { params: { Mail: email } });
      const encontrados = buscarRes.data?.usuarios || [];
      if (!encontrados.length) throw new Error("Usuario creado pero no encontrado");
      usuario = encontrados[0];
    } catch (createErr) {
      console.error("Error al crear usuario con Google:", createErr);
      throw createErr;
    }
  }

  return mapApiUserToAuthUser(usuario);
}
