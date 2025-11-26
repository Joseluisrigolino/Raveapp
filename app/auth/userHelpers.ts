// src/utils/auth/userHelpers.ts
import { apiClient } from "@/app/apis/apiConfig";

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

  // Part 1: intentar completar campos faltantes con el perfil actual (merge),
  // ya que el backend requiere payload completo.
  const needsString = (v: any) => typeof v !== "string" || v.trim() === "";
  const needsArray = (v: any) => !Array.isArray(v) || v.length === 0;
  let base: Partial<ApiUserFull> | null = null;
  try {
    const missingCritical =
      needsString((payload as any).nombre) ||
      needsString((payload as any).apellido) ||
      needsString((payload as any).correo) ||
      needsString((payload as any).dni) ||
      needsString((payload as any).telefono) ||
      needsString((payload as any).cbu) ||
      needsString((payload as any).bio) ||
      needsString((payload as any).dtNacimiento) ||
      !payload.domicilio ||
      needsArray(payload.cdRoles);
    if (missingCritical) {
      base = await getUsuarioById(String((payload as any).idUsuario));
    }
  } catch (e) {
    // Si falla el GET no abortamos; seguimos con lo que tenemos
  }

  const merged: UpdateUsuarioPayload = {
    idUsuario: String((payload as any).idUsuario ?? (base as any)?.idUsuario ?? ""),
    nombre: !needsString(payload.nombre) ? payload.nombre : String((base as any)?.nombre ?? ""),
    apellido: !needsString(payload.apellido) ? payload.apellido : String((base as any)?.apellido ?? ""),
    correo: !needsString(payload.correo) ? payload.correo : String((base as any)?.correo ?? ""),
    dni: !needsString(payload.dni) ? payload.dni : String((base as any)?.dni ?? ""),
    telefono: !needsString(payload.telefono) ? payload.telefono : String((base as any)?.telefono ?? ""),
    cbu: !needsString(payload.cbu) ? payload.cbu : String((base as any)?.cbu ?? ""),
    nombreFantasia: !needsString(payload.nombreFantasia)
      ? payload.nombreFantasia
      : String((base as any)?.nombreFantasia ?? ""),
    bio: !needsString(payload.bio) ? payload.bio : String((base as any)?.bio ?? ""),
    dtNacimiento: !needsString(payload.dtNacimiento)
      ? payload.dtNacimiento
      : String((base as any)?.dtNacimiento ?? ""),
    domicilio: {
      direccion: safeDomicilio.direccion || (base as any)?.domicilio?.direccion || "",
      localidad: {
        nombre: safeDomicilio.localidad.nombre || (base as any)?.domicilio?.localidad?.nombre || "",
        codigo: safeDomicilio.localidad.codigo || (base as any)?.domicilio?.localidad?.codigo || "",
      },
      municipio: {
        nombre: safeDomicilio.municipio.nombre || (base as any)?.domicilio?.municipio?.nombre || "",
        codigo: safeDomicilio.municipio.codigo || (base as any)?.domicilio?.municipio?.codigo || "",
      },
      provincia: {
        nombre: safeDomicilio.provincia.nombre || (base as any)?.domicilio?.provincia?.nombre || "",
        codigo: safeDomicilio.provincia.codigo || (base as any)?.domicilio?.provincia?.codigo || "",
      },
      latitud:
        typeof safeDomicilio.latitud === "number"
          ? safeDomicilio.latitud
          : (base as any)?.domicilio?.latitud ?? 0,
      longitud:
        typeof safeDomicilio.longitud === "number"
          ? safeDomicilio.longitud
          : (base as any)?.domicilio?.longitud ?? 0,
    } as DomicilioApi,
    // cdRoles: fusionar roles existentes con los nuevos
    cdRoles: (() => {
      const incoming = Array.isArray(payload.cdRoles) ? payload.cdRoles : [];
      const existing = Array.isArray((base as any)?.cdRoles)
        ? ((base as any)?.cdRoles as number[])
        : [];
      const mergedSet = new Set<number>();
      for (const v of [...incoming, ...existing]) {
        const n = Number(v);
        if (Number.isFinite(n)) mergedSet.add(n);
      }
      return Array.from(mergedSet);
    })(),
    socials: {
      idSocial:
        safeSocials.idSocial || (base as any)?.socials?.idSocial || "",
      mdInstagram:
        safeSocials.mdInstagram || (base as any)?.socials?.mdInstagram || "",
      mdSpotify:
        safeSocials.mdSpotify || (base as any)?.socials?.mdSpotify || "",
      mdSoundcloud:
        safeSocials.mdSoundcloud || (base as any)?.socials?.mdSoundcloud || "",
    },
    isVerificado: typeof (payload as any).isVerificado === 'number' ? (payload as any).isVerificado : (base as any)?.isVerificado ?? 0,
  };
  // Si la provincia es Ciudad Autónoma de Buenos Aires, asegurar que
  // tanto municipio como localidad se completen con ese nombre
  try {
    const removeAccents = (s: string | undefined) =>
      String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");

    const provName = merged?.domicilio?.provincia?.nombre || "";
    const provNorm = removeAccents(provName);
    if (provNorm.includes("autonoma") && provNorm.includes("buenos")) {
      const fillName = "Ciudad Autonoma de Buenos Aires";
      if (!merged.domicilio.localidad?.nombre || merged.domicilio.localidad.nombre.trim() === "") {
        merged.domicilio.localidad.nombre = fillName;
      }
      if (!merged.domicilio.municipio?.nombre || merged.domicilio.municipio.nombre.trim() === "") {
        merged.domicilio.municipio.nombre = fillName;
      }
    }
  } catch (e) {
    // no bloquear si hay problema con normalización
  }

  // Asegurar cdRoles numérico/único por si base aportó valores no numéricos
  const finalPayload: UpdateUsuarioPayload = {
    ...merged,
    cdRoles: Array.from(
      new Set(
        (merged.cdRoles as any[])
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n)) as number[]
      )
    ),
  };

  console.log("updateUsuario - Payload final (merge):", JSON.stringify(finalPayload, null, 2));

  // Construir el objeto en el formato que el backend valida para el wrapper
  // Antes de mapear, traemos el perfil actual por idUsuario y lo fusionamos
  // con `finalPayload` para garantizar que todos los campos requeridos estén presentes.
  const ensureString = (v: any) => (v == null ? "" : String(v));
  const ensureNumberArray = (arr: any) =>
    Array.isArray(arr) ? arr.map((x) => Number(x)).filter((n) => Number.isFinite(n)) : [];

  let baseProfile: Partial<ApiUserFull> | null = null;
  try {
    const uid = String(finalPayload.idUsuario || (payload as any)?.idUsuario || "");
    if (uid) {
      baseProfile = await getUsuarioById(uid).catch(() => null);
    }
  } catch (e) {
    baseProfile = null;
  }

  const mergedSource: any = {
    // preferir valores del payload; caer en baseProfile si falta
    nombre: finalPayload.nombre || (baseProfile as any)?.nombre || "",
    apellido: finalPayload.apellido || (baseProfile as any)?.apellido || "",
    correo: finalPayload.correo || (baseProfile as any)?.correo || "",
    dni: finalPayload.dni || (baseProfile as any)?.dni || "",
    telefono: finalPayload.telefono || (baseProfile as any)?.telefono || "",
    cbu: (finalPayload as any).cbu || (baseProfile as any)?.cbu || "",
    nombreFantasia: (finalPayload as any).nombreFantasia || (baseProfile as any)?.nombreFantasia || "",
    bio: (finalPayload as any).bio || (baseProfile as any)?.bio || "",
    dtNacimiento: (finalPayload as any).dtNacimiento || (baseProfile as any)?.dtNacimiento || "",
    cdRoles: Array.isArray(finalPayload.cdRoles) && finalPayload.cdRoles.length ? finalPayload.cdRoles : (Array.isArray((baseProfile as any)?.cdRoles) ? (baseProfile as any).cdRoles : []),
    isVerificado: typeof (finalPayload as any).isVerificado !== 'undefined' ? (finalPayload as any).isVerificado : (baseProfile as any)?.isVerificado ?? 0,
    domicilio: {
      direccion: finalPayload.domicilio?.direccion || (baseProfile as any)?.domicilio?.direccion || "",
      localidad: {
        nombre: finalPayload.domicilio?.localidad?.nombre || (baseProfile as any)?.domicilio?.localidad?.nombre || "",
        codigo: finalPayload.domicilio?.localidad?.codigo || (baseProfile as any)?.domicilio?.localidad?.codigo || "",
      },
      municipio: {
        nombre: finalPayload.domicilio?.municipio?.nombre || (baseProfile as any)?.domicilio?.municipio?.nombre || "",
        codigo: finalPayload.domicilio?.municipio?.codigo || (baseProfile as any)?.domicilio?.municipio?.codigo || "",
      },
      provincia: {
        nombre: finalPayload.domicilio?.provincia?.nombre || (baseProfile as any)?.domicilio?.provincia?.nombre || "",
        codigo: finalPayload.domicilio?.provincia?.codigo || (baseProfile as any)?.domicilio?.provincia?.codigo || "",
      },
      latitud: typeof finalPayload.domicilio?.latitud === "number" ? finalPayload.domicilio.latitud : (baseProfile as any)?.domicilio?.latitud ?? 0,
      longitud: typeof finalPayload.domicilio?.longitud === "number" ? finalPayload.domicilio.longitud : (baseProfile as any)?.domicilio?.longitud ?? 0,
    },
    idUsuario: finalPayload.idUsuario || (baseProfile as any)?.idUsuario || "",
  };

  // Use camelCase keys inside the wrapper because the API accepted the plain camelCase object.
  // Asegurar `cdRoles` no venga vacío: usar [0] por defecto
  let cdRolesArr = ensureNumberArray(mergedSource.cdRoles);
  if (!cdRolesArr || cdRolesArr.length === 0) cdRolesArr = [0];

  const requestPayload: any = {
    nombre: ensureString(mergedSource.nombre),
    apellido: ensureString(mergedSource.apellido),
    correo: ensureString(mergedSource.correo),
    dni: ensureString(mergedSource.dni),
    telefono: ensureString(mergedSource.telefono),
    cbu: ensureString(mergedSource.cbu || ""),
    nombreFantasia: ensureString(mergedSource.nombreFantasia || ""),
    bio: ensureString(mergedSource.bio || ""),
    dtNacimiento: ensureString(mergedSource.dtNacimiento || ""),
    cdRoles: cdRolesArr,
    // Enviar booleano para isVerificado (backend acepta boolean)
    isVerificado: Boolean(mergedSource.isVerificado),
    // Garantizar objeto socials con las claves esperadas
    socials: {
      idSocial: ensureString(mergedSource.socials?.idSocial || ""),
      mdInstagram: ensureString(mergedSource.socials?.mdInstagram || ""),
      mdSpotify: ensureString(mergedSource.socials?.mdSpotify || ""),
      mdSoundcloud: ensureString(mergedSource.socials?.mdSoundcloud || ""),
    },
    domicilio: {
      direccion: ensureString(mergedSource.domicilio?.direccion),
      localidad: {
        nombre: ensureString(mergedSource.domicilio?.localidad?.nombre),
        codigo: ensureString(mergedSource.domicilio?.localidad?.codigo),
      },
      municipio: {
        nombre: ensureString(mergedSource.domicilio?.municipio?.nombre),
        codigo: ensureString(mergedSource.domicilio?.municipio?.codigo),
      },
      provincia: {
        nombre: ensureString(mergedSource.domicilio?.provincia?.nombre),
        codigo: ensureString(mergedSource.domicilio?.provincia?.codigo),
      },
      latitud: typeof mergedSource.domicilio?.latitud === "number" ? mergedSource.domicilio.latitud : 0,
      longitud: typeof mergedSource.domicilio?.longitud === "number" ? mergedSource.domicilio.longitud : 0,
    },
    idUsuario: ensureString(mergedSource.idUsuario),
  };

  // Para máxima compatibilidad con el backend, incluir también las claves en PascalCase
  // dentro del mismo objeto `request`. De este modo, si el binding espera Nombre/Apellido/etc
  // los encontrará; si espera camelCase también están presentes.
  const pascalPayload: any = {
    Nombre: requestPayload.nombre,
    Apellido: requestPayload.apellido,
    Correo: requestPayload.correo,
    Dni: requestPayload.dni,
    Telefono: requestPayload.telefono,
    CBU: requestPayload.cbu,
    NombreFantasia: requestPayload.nombreFantasia,
    Bio: requestPayload.bio,
    DtNacimiento: requestPayload.dtNacimiento,
    CdRoles: requestPayload.cdRoles,
    IsVerificado: requestPayload.isVerificado,
    Domicilio: {
      Direccion: requestPayload.domicilio.direccion,
      Localidad: { Nombre: requestPayload.domicilio.localidad.nombre, Codigo: requestPayload.domicilio.localidad.codigo },
      Municipio: { Nombre: requestPayload.domicilio.municipio.nombre, Codigo: requestPayload.domicilio.municipio.codigo },
      Provincia: { Nombre: requestPayload.domicilio.provincia.nombre, Codigo: requestPayload.domicilio.provincia.codigo },
      Latitud: requestPayload.domicilio.latitud,
      Longitud: requestPayload.domicilio.longitud,
    },
    IdUsuario: requestPayload.idUsuario,
  };

  // Enviar siempre el objeto plano en camelCase: el backend acepta este formato.
  try {
    console.log(
      "updateUsuario - Enviando objeto plano camelCase (requestPayload):",
      JSON.stringify(requestPayload)
    );
    const response = await apiClient.put("/v1/Usuario/UpdateUsuario", requestPayload, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("updateUsuario - OK", response.status);
    return;
  } catch (error: any) {
    console.error("updateUsuario - error al enviar objeto plano:", error?.response?.status, error?.response?.data);
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
    bio: (payload.bio ?? "") as string,
    // Note: bio is client-editable text; do not use it as verification flag.
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
