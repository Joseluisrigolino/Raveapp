// src/utils/auth/userHelpers.ts
import { apiClient } from "../apiConfig";

// Shape de la API
export interface DomicilioApi {
  localidad: { nombre: string; codigo: string };
  municipio: { nombre: string; codigo: string };
  provincia: { nombre: string; codigo: string };
  direccion: string;
  latitud: number;
  longitud: number;
}
export interface ApiUserFull {
  idUsuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  dni: string;
  telefono: string;
  cbu: string;
  nombreFantasia: string;
  bio: string;
  dtNacimiento: string;
  domicilio: DomicilioApi;
  cdRoles: number[];
  socials: {
    idSocial: string;
    mdInstagram: string;
    mdSpotify: string;
    mdSoundcloud: string;
  };
}

// 1) Traer perfil
export async function getProfile(correo: string): Promise<ApiUserFull> {
  const { data } = await apiClient.get<{ usuarios: ApiUserFull[] }>(
    "/v1/Usuario/GetUsuario",
    { params: { Mail: correo, IsActivo: true } }
  );
  if (!data.usuarios.length) throw new Error("Perfil no encontrado");
  return data.usuarios[0];
}

// 2) Actualizar perfil
export async function updateUsuario(payload: ApiUserFull): Promise<void> {
  await apiClient.put("/v1/Usuario/UpdateUsuario", payload);
}

// 3) Crear usuario
export interface CreateUsuarioPayload {
  domicilio: DomicilioApi;
  nombre: string;
  apellido: string;
  correo: string;
  cbu: string;
  dni: string;
  telefono: string;
  nombreFantasia: string;
  bio: string;
  password: string;
  socials: {
    idSocial: string;
    mdInstagram: string;
    mdSpotify: string;
    mdSoundcloud: string;
  };
  dtNacimiento: string;
}

export async function createUsuario(
  payload: CreateUsuarioPayload
): Promise<void> {
  await apiClient.post("/v1/Usuario/CreateUsuario", payload);
}
