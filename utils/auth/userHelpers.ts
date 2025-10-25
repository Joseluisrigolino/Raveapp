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
  dtNacimiento: string; // ISO string
  domicilio: DomicilioApi;
  cdRoles: number[];
  socials: {
    idSocial: string;
    mdInstagram: string;
    mdSpotify: string;
    mdSoundcloud: string;
  };
}

// Interfaz para actualización (incluyendo cdRoles que es obligatorio)
export interface UpdateUsuarioPayload {
  idUsuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  dni: string;
  telefono: string;
  cbu: string;
  nombreFantasia: string;
  bio: string;
  dtNacimiento: string; // ISO string
  domicilio: DomicilioApi;
  cdRoles: number[]; // Requerido por la API
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

// 1.1) Traer perfil por ID de usuario (robusto con varios intentos)
export async function getUsuarioById(idUsuario: string): Promise<ApiUserFull> {
  const id = String(idUsuario || "").trim();
  if (!id) throw new Error("ID de usuario vacío");

  // Intentos tolerantes: distintos parámetros/formatos que podría aceptar la API
  const attempts: Array<() => Promise<any>> = [
    () =>
      apiClient.get<{ usuarios: ApiUserFull[] }>(
        "/v1/Usuario/GetUsuario",
        { params: { IdUsuario: id, IsActivo: true } }
      ),
    () =>
      apiClient.get<{ usuarios: ApiUserFull[] }>(
        "/v1/Usuario/GetUsuario",
        { params: { idUsuario: id, IsActivo: true } }
      ),
    () => apiClient.get<ApiUserFull>(`/v1/Usuario/GetUsuario/${encodeURIComponent(id)}`),
  ];

  let lastErr: any = null;
  for (const fn of attempts) {
    try {
      const resp = await fn();
      // La API puede devolver { usuarios: [...] } o un objeto directo
      const data = resp?.data;
      if (Array.isArray(data?.usuarios) && data.usuarios.length) return data.usuarios[0];
      if (data && typeof data === "object" && (data as any).idUsuario) return data as ApiUserFull;
    } catch (e: any) {
      // Si es 404, probamos el siguiente intento; guardamos último error
      lastErr = e;
    }
  }
  const status = lastErr?.response?.status;
  if (status === 404) throw Object.assign(new Error("Usuario no encontrado"), { code: 404 });
  throw lastErr ?? new Error("No se pudo obtener el usuario por id");
}

// 2) Actualizar perfil
export async function updateUsuario(payload: UpdateUsuarioPayload): Promise<void> {
  // Normalizar payload para evitar nulls que la API valida como campos faltantes
  const safeSocials = {
    idSocial: String((payload as any)?.socials?.idSocial ?? "") || "",
    mdInstagram: String((payload as any)?.socials?.mdInstagram ?? "") || "",
    mdSpotify: String((payload as any)?.socials?.mdSpotify ?? "") || "",
    mdSoundcloud: String((payload as any)?.socials?.mdSoundcloud ?? "") || "",
  };

  const safeDomicilio = {
    direccion: payload.domicilio?.direccion ?? "",
    localidad: {
      nombre: payload.domicilio?.localidad?.nombre ?? "",
      codigo: payload.domicilio?.localidad?.codigo ?? "",
    },
    municipio: {
      nombre: payload.domicilio?.municipio?.nombre ?? "",
      codigo: payload.domicilio?.municipio?.codigo ?? "",
    },
    provincia: {
      nombre: payload.domicilio?.provincia?.nombre ?? "",
      codigo: payload.domicilio?.provincia?.codigo ?? "",
    },
    latitud: typeof payload.domicilio?.latitud === 'number' ? payload.domicilio.latitud : 0,
    longitud: typeof payload.domicilio?.longitud === 'number' ? payload.domicilio.longitud : 0,
  };

  const finalPayload: UpdateUsuarioPayload = {
    ...payload,
    domicilio: safeDomicilio as any,
    cdRoles: Array.isArray(payload.cdRoles) ? payload.cdRoles : [],
    socials: safeSocials as any,
  };

  console.log("updateUsuario - Payload recibido:", JSON.stringify(finalPayload, null, 2));

  try {
    const response = await apiClient.put("/v1/Usuario/UpdateUsuario", finalPayload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("updateUsuario - Respuesta exitosa:", response.status);
  } catch (error: any) {
    console.error("updateUsuario - Error:", error);
    console.error("updateUsuario - Response data:", error?.response?.data);
    console.error("updateUsuario - Response status:", error?.response?.status);
    throw error;
  }
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
  dtNacimiento: string; // ISO string
}

export async function createUsuario(
  payload: CreateUsuarioPayload
): Promise<void> {
  const finalPayload: CreateUsuarioPayload = {
    ...payload,
    bio: (payload.bio ?? "0") as string,
  };
  await apiClient.post("/v1/Usuario/CreateUsuario", finalPayload);
}

/**
 * 4) Marcar/Desmarcar evento como favorito
 * Body: { idUsuario, idEvento }
 */
export async function putEventoFavorito(params: {
  idUsuario: string;
  idEvento: string;
}): Promise<void> {
  await apiClient.put("/v1/Usuario/EventoFavorito", {
    idUsuario: params.idUsuario,
    idEvento: params.idEvento,
  });
}

/**
 * 5) Listar IDs de eventos favoritos del usuario
 * GET /v1/Usuario/GetEventosFavoritos?idUsuario={...}
 * Respuesta esperada:
 * { "eventos": ["uuid-1","uuid-2", ...] }
 */
export async function getEventosFavoritos(
  idUsuario: string
): Promise<string[]> {
  try {
    const { data } = await apiClient.get<{ eventos: string[] }>(
      "/v1/Usuario/GetEventosFavoritos",
      { params: { idUsuario } }
    );
    return Array.isArray(data?.eventos) ? data.eventos : [];
  } catch (err: any) {
    // Si la API responde 404, devolvemos array vacío
    if (err?.response?.status === 404) return [];
    throw err;
  }
}

/**
 * 6) Listar entradas compradas por un usuario
 * GET /v1/Usuario/GetEntradas?idUsuario={...}
 * Respuestas posibles observadas:
 *  - { entradas: [...] }
 *  - [ ... ]
 *  - { items: [...] }
 * Devuelve siempre un array.
 */
export async function getEntradasUsuario(
  idUsuario: string
): Promise<any[]> {
  const id = String(idUsuario || "").trim();
  if (!id) return [];
  try {
    const { data } = await apiClient.get(
      "/v1/Usuario/GetEntradas",
      { params: { idUsuario: id } }
    );

    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any)?.entradas)) return (data as any).entradas;
    if (Array.isArray((data as any)?.items)) return (data as any).items;
    // En algunos casos la API puede envolver en { data: [...] }
    if (Array.isArray((data as any)?.data)) return (data as any).data;
    return [];
  } catch (err: any) {
    // Si la API responde 404, devolvemos array vacío
    if (err?.response?.status === 404) return [];
    throw err;
  }
}
