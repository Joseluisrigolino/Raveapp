// app/auth/userApi.ts

// Cliente HTTP centralizado para hablar con la API
import { apiClient } from "@/app/apis/apiClient";
import { AxiosResponse } from "axios";

/**
 * Modelos tal como los maneja el backend (shape de la API)
 */

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
  isVerificado?: number;
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

/**
 * Payload esperado por el backend para actualizar un usuario.
 * La idea es que sea "payload completo", no parcial.
 */
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
  isVerificado?: number;
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

/**
 * Helper genérico para asegurarnos de que algo sea string.
 * Si viene null/undefined, lo convertimos a "".
 */
const ensureString = (value: any): string =>
  value == null ? "" : String(value);

/**
 * Helper para asegurarnos de que algo sea un array de números finitos.
 */
const ensureNumberArray = (arr: any): number[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
};

/**
 * Helper para normalizar el objeto socials:
 * - evita nulls/undefined
 * - se asegura de que todas las keys existan como string
 */
const normalizeSocials = (
  socials?: Partial<ApiUserFull["socials"]>
): ApiUserFull["socials"] => ({
  idSocial: ensureString(socials?.idSocial),
  mdInstagram: ensureString(socials?.mdInstagram),
  mdSpotify: ensureString(socials?.mdSpotify),
  mdSoundcloud: ensureString(socials?.mdSoundcloud),
});

/**
 * Helper para normalizar domicilio:
 * - evita nulls
 * - asegura strings y números válidos
 */
const normalizeDomicilio = (
  domicilio?: Partial<DomicilioApi>
): DomicilioApi => ({
  direccion: ensureString(domicilio?.direccion),
  localidad: {
    nombre: ensureString(domicilio?.localidad?.nombre),
    codigo: ensureString(domicilio?.localidad?.codigo),
  },
  municipio: {
    nombre: ensureString(domicilio?.municipio?.nombre),
    codigo: ensureString(domicilio?.municipio?.codigo),
  },
  provincia: {
    nombre: ensureString(domicilio?.provincia?.nombre),
    codigo: ensureString(domicilio?.provincia?.codigo),
  },
  latitud:
    typeof domicilio?.latitud === "number" ? domicilio.latitud : 0,
  longitud:
    typeof domicilio?.longitud === "number" ? domicilio.longitud : 0,
});

/**
 * 1) Traer perfil de usuario por correo.
 * Usa el endpoint GetUsuario filtrando por Mail + IsActivo = true.
 */
export async function getProfile(
  correo: string
): Promise<ApiUserFull> {
  const { data } = await apiClient.get<{ usuarios: ApiUserFull[] }>(
    "/v1/Usuario/GetUsuario",
    {
      params: { Mail: correo, IsActivo: true },
    }
  );

  if (!Array.isArray(data.usuarios) || !data.usuarios.length) {
    const err: any = new Error("Perfil no encontrado");
    // agregar forma similar a error de axios para que los handlers puedan
    // inspeccionar `err.response.status` y mostrar mensajes adecuados
    err.response = { status: 500, data: { message: "Correo no registrado" } };
    throw err;
  }

  return data.usuarios[0];
}

/**
 * 1.1) Traer perfil por ID de usuario.
 * Intenta varios formatos de request porque la API no siempre es consistente.
 */
export async function getUsuarioById(
  idUsuario: string
): Promise<ApiUserFull> {
  const id = String(idUsuario || "").trim();
  if (!id) {
    throw new Error("ID de usuario vacío");
  }

  // Distintas variantes de cómo la API podría aceptar el parámetro
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
    () =>
      apiClient.get<ApiUserFull>(
        `/v1/Usuario/GetUsuario/${encodeURIComponent(id)}`
      ),
  ];

  let lastErr: any = null;

  // Probamos cada variante hasta que una responda bien
  for (const fn of attempts) {
    try {
      const resp = await fn();
      const data = resp?.data;

      // Caso típico: { usuarios: [...] }
      if (Array.isArray((data as any)?.usuarios)) {
        const usuarios = (data as any).usuarios as ApiUserFull[];
        if (usuarios.length) return usuarios[0];
      }

      // Caso donde viene un objeto plano directo
      if (data && typeof data === "object" && (data as any).idUsuario) {
        return data as ApiUserFull;
      }
    } catch (e: any) {
      // Guardamos el error y probamos la siguiente variante
      lastErr = e;
    }
  }

  const status = lastErr?.response?.status;
  if (status === 404) {
    const err = new Error("Usuario no encontrado") as any;
    err.code = 404;
    throw err;
  }

  // Si llegamos acá, no tuvimos éxito con ninguna variante
  throw lastErr ?? new Error("No se pudo obtener el usuario por id");
}

/**
 * 2) Actualizar perfil de usuario.
 *
 * Idea principal:
 * - El backend espera un payload "completo" (no parcial).
 * - Acá mergeamos el payload que nos llega con el perfil actual
 *   para rellenar campos que falten y evitar nulls.
 */
export async function updateUsuario(
  payload: UpdateUsuarioPayload
): Promise<void> {
  // Normalizamos y validamos el idUsuario
  const id = String(payload.idUsuario || "").trim();
  if (!id) {
    throw new Error("idUsuario es requerido para actualizar el perfil");
  }

  // Traemos el perfil actual para usarlo como base de merge
  let base: ApiUserFull | null = null;
  try {
    base = await getUsuarioById(id);
  } catch {
    // Si no pudimos obtener el perfil, seguimos pero sin base
    base = null;
  }

  // Roles: usar los del payload si vienen, sino los del perfil base
  const mergedRoles = (() => {
    const incoming = ensureNumberArray(payload.cdRoles);
    const existing = ensureNumberArray(base?.cdRoles ?? []);
    const all = [...incoming, ...existing];
    return Array.from(new Set(all)); // únicos
  })();

  // Si después del merge sigue vacío, ponemos un rol neutro (ej: 0)
  const finalCdRoles = mergedRoles.length ? mergedRoles : [0];

  // Socials: preferimos payload, pero si viene vacío usamos base
  const mergedSocials = normalizeSocials({
    idSocial: payload.socials?.idSocial ?? base?.socials?.idSocial,
    mdInstagram:
      payload.socials?.mdInstagram ?? base?.socials?.mdInstagram,
    mdSpotify: payload.socials?.mdSpotify ?? base?.socials?.mdSpotify,
    mdSoundcloud:
      payload.socials?.mdSoundcloud ?? base?.socials?.mdSoundcloud,
  });

  // Domicilio: merge entre payload y base, y luego normalización
  const mergedDomicilio = normalizeDomicilio({
    direccion: payload.domicilio?.direccion ?? base?.domicilio?.direccion,
    localidad: {
      nombre:
        payload.domicilio?.localidad?.nombre ??
        base?.domicilio?.localidad?.nombre,
      codigo:
        payload.domicilio?.localidad?.codigo ??
        base?.domicilio?.localidad?.codigo,
    },
    municipio: {
      nombre:
        payload.domicilio?.municipio?.nombre ??
        base?.domicilio?.municipio?.nombre,
      codigo:
        payload.domicilio?.municipio?.codigo ??
        base?.domicilio?.municipio?.codigo,
    },
    provincia: {
      nombre:
        payload.domicilio?.provincia?.nombre ??
        base?.domicilio?.provincia?.nombre,
      codigo:
        payload.domicilio?.provincia?.codigo ??
        base?.domicilio?.provincia?.codigo,
    },
    latitud:
      payload.domicilio?.latitud ?? base?.domicilio?.latitud ?? 0,
    longitud:
      payload.domicilio?.longitud ?? base?.domicilio?.longitud ?? 0,
  });

  // isVerificado: number en la API, pero lo mandamos como boolean
  const mergedIsVerificado =
    typeof payload.isVerificado === "number"
      ? payload.isVerificado
      : base?.isVerificado ?? 0;

  // Construimos el payload final que se va a enviar a la API (camelCase)
  const requestPayload = {
    idUsuario: id,
    nombre: ensureString(payload.nombre || base?.nombre),
    apellido: ensureString(payload.apellido || base?.apellido),
    correo: ensureString(payload.correo || base?.correo),
    dni: ensureString(payload.dni || base?.dni),
    telefono: ensureString(payload.telefono || base?.telefono),
    cbu: ensureString(payload.cbu || base?.cbu),
    nombreFantasia: ensureString(
      payload.nombreFantasia || base?.nombreFantasia
    ),
    bio: ensureString(payload.bio || base?.bio),
    dtNacimiento: ensureString(
      payload.dtNacimiento || base?.dtNacimiento
    ),
    cdRoles: finalCdRoles,
    isVerificado: Boolean(mergedIsVerificado), // lo mandamos como boolean
    socials: mergedSocials,
    domicilio: mergedDomicilio,
  };

  // Hacemos el PUT directo con el objeto plano camelCase.
  // En las pruebas, el backend aceptó este formato sin problemas.
  await apiClient.put("/v1/Usuario/UpdateUsuario", requestPayload, {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * 3) Crear usuario nuevo.
 * Usado, por ejemplo, cuando se registra alguien desde Google
 * y la API exige que exista un usuario "formal".
 */
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
  isVerificado?: boolean | number;
  cdRoles?: number[];
}

export async function createUsuario(
  payload: CreateUsuarioPayload
): Promise<any> {
  const finalPayload: CreateUsuarioPayload = {
    ...payload,
    // Nos aseguramos de que bio sea string, aunque venga undefined/null
    bio: ensureString(payload.bio),
  };
  // El endpoint CreateUsuario espera un JSON en camelCase sin wrapper
  // (ejemplo provisto por backend). Enviamos el payload tal cual,
  // asegurándonos de normalizar algunos tipos.
  const requestBody = {
    ...finalPayload,
    isVerificado: Boolean(finalPayload.isVerificado),
    cdRoles: Array.isArray(finalPayload.cdRoles)
      ? finalPayload.cdRoles.map((n) => Number(n))
      : finalPayload.cdRoles || [],
    domicilio: {
      direccion: ensureString(finalPayload.domicilio?.direccion),
      latitud:
        typeof finalPayload.domicilio?.latitud === "number"
          ? finalPayload.domicilio!.latitud
          : 0,
      longitud:
        typeof finalPayload.domicilio?.longitud === "number"
          ? finalPayload.domicilio!.longitud
          : 0,
      localidad: {
        nombre: ensureString(finalPayload.domicilio?.localidad?.nombre),
        codigo: ensureString(finalPayload.domicilio?.localidad?.codigo),
      },
      municipio: {
        nombre: ensureString(finalPayload.domicilio?.municipio?.nombre),
        codigo: ensureString(finalPayload.domicilio?.municipio?.codigo),
      },
      provincia: {
        nombre: ensureString(finalPayload.domicilio?.provincia?.nombre),
        codigo: ensureString(finalPayload.domicilio?.provincia?.codigo),
      },
    },
    socials: {
      idSocial: ensureString(finalPayload.socials?.idSocial),
      mdInstagram: ensureString(finalPayload.socials?.mdInstagram),
      mdSpotify: ensureString(finalPayload.socials?.mdSpotify),
      mdSoundcloud: ensureString(finalPayload.socials?.mdSoundcloud),
    },
  };

  if (process.env.NODE_ENV !== 'production') {
    try {
      console.debug('[userApi] CreateUsuario requestBody:', JSON.stringify(requestBody));
    } catch {
      console.debug('[userApi] CreateUsuario requestBody (unserializable)');
    }
  }

  try {
    const resp: AxiosResponse<any> = await apiClient.post(
      "/v1/Usuario/CreateUsuario",
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );
    return resp.data;
  } catch (err: any) {
    // Loggeamos detalles útiles para depuración: status, body, y config
    try {
      console.error('[userApi] CreateUsuario axios error status:', err?.response?.status);
      console.error('[userApi] CreateUsuario axios error response.data:', err?.response?.data);
      console.error('[userApi] CreateUsuario axios request config:', err?.config ? { url: err.config.url, method: err.config.method, headers: err.config.headers, data: err.config.data } : undefined);
    } catch (e) {
      console.error('[userApi] CreateUsuario error while logging error:', e);
    }

    throw err;
  }
}

/**
 * 4) Marcar/Desmarcar evento como favorito para un usuario.
 * Body simple: { idUsuario, idEvento }
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
 * 5) Obtener IDs de eventos favoritos de un usuario.
 *
 * GET /v1/Usuario/GetEventosFavoritos?idUsuario={...}
 * Respuesta esperada: { eventos: ["uuid-1", "uuid-2", ...] }
 *
 * Si la API responde 404, devolvemos array vacío.
 */
export async function getEventosFavoritos(
  idUsuario: string
): Promise<string[]> {
  const id = String(idUsuario || "").trim();
  if (!id) return [];

  try {
    const { data } = await apiClient.get<{ eventos: string[] }>(
      "/v1/Usuario/GetEventosFavoritos",
      {
        params: { idUsuario: id },
      }
    );

    return Array.isArray(data?.eventos) ? data.eventos : [];
  } catch (err: any) {
    if (err?.response?.status === 404) return [];
    throw err;
  }
}

/**
 * 6) Listar entradas compradas por un usuario.
 *
 * GET /v1/Usuario/GetEntradas?idUsuario={...}
 *
 * La API no es muy consistente con el formato de respuesta, así que acá
 * normalizamos a "siempre devuelvo un array":
 *  - [ ... ]
 *  - { entradas: [...] }
 *  - { items: [...] }
 *  - { data: [...] }
 */
export async function getEntradasUsuario(
  idUsuario: string
): Promise<any[]> {
  const id = String(idUsuario || "").trim();
  if (!id) return [];

  try {
    const { data } = await apiClient.get(
      "/v1/Usuario/GetEntradas",
      {
        params: { idUsuario: id },
      }
    );

    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any)?.entradas))
      return (data as any).entradas;
    if (Array.isArray((data as any)?.items))
      return (data as any).items;
    if (Array.isArray((data as any)?.data))
      return (data as any).data;

    return [];
  } catch (err: any) {
    if (err?.response?.status === 404) return [];
    throw err;
  }
}
