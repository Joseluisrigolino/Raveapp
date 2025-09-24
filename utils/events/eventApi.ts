import { EventItem } from "@/interfaces/EventItem";
import { apiClient, login } from "@/utils/apiConfig";
import { mediaApi } from "@/utils/mediaApi";

/** ---------- constantes de estados ---------- */
export const ESTADO_CODES = {
  POR_APROBAR: 0,
  APROBADO: 1,
  EN_VENTA: 2,
  FIN_VENTA: 3,
  FINALIZADO: 4,
  CANCELADO: 5,
  RECHAZADO: 6,
} as const;

/** ---------- util fechas ---------- */
function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function formatTimeRange(startIso?: string, endIso?: string): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (!startIso || !endIso) return "";
  const s = new Date(startIso);
  const e = new Date(endIso);
  return `${pad(s.getHours())}hs a ${pad(e.getHours())}hs`;
}

/** ---------- media (SIEMPRE imagen, nunca youtube) ---------- */
const PLACEHOLDER_IMAGE = "";

/**
 * Usa mediaApi.getFirstImage (filtra mdVideo y youtube) y normaliza a absoluta.
 */
async function fetchEventMediaUrl(idEvento: string): Promise<string> {
  try {
    if (!idEvento) return PLACEHOLDER_IMAGE;

    // pide SOLO imagen
    let img = await mediaApi.getFirstImage(idEvento);

    // extra defensa: por si backend metió youtube en url por error
    if (/youtube\.com|youtu\.be/i.test(img)) {
      img = "";
    }

    // normalizar absoluta si es relativa
    if (img && !/^https?:\/\//i.test(img)) {
      const base = apiClient.defaults.baseURL ?? "";
      img = `${base}${img.startsWith("/") ? "" : "/"}${img}`;
    }

    return img || PLACEHOLDER_IMAGE;
  } catch {
    return PLACEHOLDER_IMAGE;
  }
}

/** ---------- géneros (dinámicos + caché) ---------- */
export interface ApiGenero {
  cdGenero: number;
  dsGenero: string;
}
let _genresCache: ApiGenero[] | null = null;
let _genreMapCache: Map<number, string> | null = null;

export async function fetchGenres(): Promise<ApiGenero[]> {
  try {
    if (_genresCache) return _genresCache;
    const token = await login().catch(() => null);
    const resp = await apiClient.get<ApiGenero[]>("/v1/Evento/GetGeneros", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const list = Array.isArray(resp.data) ? resp.data : [];
    _genresCache = list;
    _genreMapCache = new Map(list.map((g) => [g.cdGenero, g.dsGenero]));
    return list;
  } catch (e) {
    console.warn("[eventApi] fetchGenres error:", e);
    _genresCache = [];
    _genreMapCache = new Map();
    return [];
  }
}
async function getGenreMap(): Promise<Map<number, string>> {
  if (_genreMapCache) return _genreMapCache;
  await fetchGenres();
  return _genreMapCache ?? new Map();
}

/** ---------- estados de evento ---------- */
export interface ApiEstadoEvento {
  cdEstado: number; // 0..6
  dsEstado: string; // "Por Aprobar", "Aprobado", etc.
}

export async function fetchEventStates(): Promise<ApiEstadoEvento[]> {
  try {
    const token = await login().catch(() => null);
    const resp = await apiClient.get<ApiEstadoEvento[]>(
      "/v1/Evento/GetEstadosEvento",
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    );
    return Array.isArray(resp.data) ? resp.data : [];
  } catch (e) {
    console.warn("[eventApi] fetchEventStates error:", e);
    return [];
  }
}

/** ---------- normalización de eventos ---------- */
type RawEvento = any;

export type EventItemWithExtras = EventItem & {
  estado?: number;
  fechas?: { idFecha: string; inicio: string; fin: string }[];
  ownerName?: string;
  ownerEmail?: string;
  genero?: number[];
  artistas?: any[];
  domicilio?: {
    provinciaId?: string;
    provincia?: string;
    municipioId?: string;
    municipio?: string;
    localidadId?: string;
    localidad?: string;
    direccion?: string;
  };
  video?: string;
  musica?: string;
  isAfter?: boolean;
  isLGBT?: boolean;
};

async function normalizeEvento(e: RawEvento): Promise<EventItemWithExtras> {
  const genreMap = await getGenreMap();

  const inicioIso =
    e?.fechas?.[0]?.inicio ?? e?.inicioEvento ?? e?.inicio ?? null;
  const finIso = e?.fechas?.[0]?.fin ?? e?.finEvento ?? e?.fin ?? null;

  // SOLO esta fuente de imagen (sin fallbacks a e.media legacy)
  const imageUrl = (await fetchEventMediaUrl(String(e?.idEvento))) || "";

  const code = Number(
    Array.isArray(e?.genero) && e.genero.length ? e.genero[0] : NaN
  );
  const type =
    Number.isFinite(code) && genreMap.has(code)
      ? (genreMap.get(code) as string)
      : "Otros";

  const estadoCod =
    Number(e?.estado) ?? Number(e?.fechas?.[0]?.estado) ?? Number(e?.cdEstado);

  const dom: EventItemWithExtras["domicilio"] = {
    provinciaId: e?.domicilio?.provinciaId ?? e?.provinciaId,
    provincia: e?.domicilio?.provincia ?? e?.provincia,
    municipioId: e?.domicilio?.municipioId ?? e?.municipioId,
    municipio: e?.domicilio?.municipio ?? e?.municipio,
    localidadId: e?.domicilio?.localidadId ?? e?.localidadId,
    localidad: e?.domicilio?.localidad ?? e?.localidad,
    direccion: e?.domicilio?.direccion ?? e?.direccion ?? "",
  };

  return {
    id: String(e?.idEvento ?? e?.id ?? ""),
    title: String(e?.nombre ?? e?.titulo ?? e?.dsNombre ?? ""),
    date: inicioIso ? formatDate(inicioIso) : "",
    timeRange: inicioIso && finIso ? formatTimeRange(inicioIso, finIso) : "",
    address: dom.direccion ?? "",
    description: e?.descripcion ?? "",
    imageUrl,
    type,
    estado: Number.isFinite(estadoCod) ? estadoCod : undefined,
    ownerName: e?.propietario?.nombre,
    ownerEmail: e?.propietario?.correo,
    fechas: Array.isArray(e?.fechas)
      ? e.fechas.map((f: any) => ({
          idFecha: String(f?.idFecha ?? ""),
          inicio: String(f?.inicio ?? ""),
          fin: String(f?.fin ?? ""),
        }))
      : [],
    genero: Array.isArray(e?.genero) ? e.genero : [],
    artistas: Array.isArray(e?.artistas) ? e.artistas : [],
    domicilio: dom,
    video: e?.video,
    musica: e?.musica,
    isAfter: Boolean(e?.isAfter),
    isLGBT: Boolean(e?.isLGBT),
  };
}

/** ---------- eventos por estado ---------- */
export async function fetchEventsByEstado(
  estado: number
): Promise<EventItemWithExtras[]> {
  const token = await login();
  const resp = await apiClient.get<{ eventos: any[] }>(
    "/v1/Evento/GetEventos",
    {
      params: { Estado: estado },
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const list: RawEvento[] = resp.data?.eventos ?? [];
  const normalized = await Promise.all(list.map(normalizeEvento));
  return normalized;
}

/**
 * Barrido por múltiples estados con tolerancia:
 * - Si un estado devuelve 404 (o cualquier error), se ignora ese lote.
 * - Se deduplica por id.
 */
export async function fetchEventsByEstados(
  estados: number[]
): Promise<EventItemWithExtras[]> {
  const acc: EventItemWithExtras[] = [];
  await Promise.all(
    estados.map(async (st) => {
      try {
        const arr = await fetchEventsByEstado(st);
        acc.push(...arr);
      } catch (e: any) {
        console.warn(
          `[fetchEventsByEstados] Estado=${st} ->`,
          e?.response?.status || e?.message
        );
      }
    })
  );
  const map = new Map<string, EventItemWithExtras>();
  for (const e of acc) map.set(String(e.id), e);
  return Array.from(map.values());
}

/** alias compat */
export async function fetchEvents(
  estado: number = ESTADO_CODES.EN_VENTA
): Promise<EventItemWithExtras[]> {
  return fetchEventsByEstado(estado);
}

/** ---------- DETALLE por ID (robusto con fallback) ---------- */
export async function fetchEventById(
  idEvento: string
): Promise<EventItemWithExtras> {
  const id = String(idEvento || "").trim();
  if (!id) {
    const err: any = new Error("ID de evento vacío.");
    err.code = "NOT_FOUND";
    throw err;
  }

  const token = await login().catch(() => null);
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const attempts: Array<() => Promise<any>> = [
    () =>
      apiClient.get("/v1/Evento/GetEvento", {
        params: { idEvento: id },
        headers,
      }),
    () => apiClient.get("/v1/Evento/GetEvento", { params: { id }, headers }),
    () =>
      apiClient.get(`/v1/Evento/GetEvento/${encodeURIComponent(id)}`, {
        headers,
      }),
  ];

  for (const fn of attempts) {
    try {
      const resp = await fn();
      const data = resp?.data?.evento ?? resp?.data;
      if (!data) continue;
      return await normalizeEvento(data);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status && status !== 404)
        console.warn("[fetchEventById] intento fallido:", status);
      continue;
    }
  }

  // Fallback: barrer estados, ignorando 404s
  try {
    const all = await fetchEventsByEstados([
      ESTADO_CODES.POR_APROBAR,
      ESTADO_CODES.APROBADO,
      ESTADO_CODES.EN_VENTA,
      ESTADO_CODES.FIN_VENTA,
      ESTADO_CODES.FINALIZADO,
      ESTADO_CODES.CANCELADO,
      ESTADO_CODES.RECHAZADO,
    ]);
    const found =
      all.find((e) => String(e.id) === id) ||
      all.find(
        (e: any) =>
          String(e?.idEvento ?? "").toLowerCase() === id.toLowerCase()
      );
    if (found) return found;
  } catch (e) {
    console.warn("[fetchEventById] fallback estados falló:", e);
  }

  const err: any = new Error("Evento no encontrado.");
  err.code = "NOT_FOUND";
  throw err;
}

/** ---------- CREATE (POST /v1/Evento/CrearEvento) ---------- */
export type CreateEventResponse =
  | {
      idEvento?: string;
      IdEvento?: string;
      evento?: { idEvento?: string; IdEvento?: string };
      [k: string]: any;
    }
  | string;

export async function createEvent(body: any): Promise<string> {
  const token = await login();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const resp = await apiClient.post<CreateEventResponse>(
    "/v1/Evento/CrearEvento",
    body,
    { headers }
  );

  const data = resp?.data;

  // La API puede devolver directamente el id como string
  if (typeof data === "string" && data.trim()) return String(data);

  // O un objeto con distintas claves posibles
  const id =
    (data as any)?.idEvento ??
    (data as any)?.IdEvento ??
    (data as any)?.evento?.idEvento ??
    (data as any)?.evento?.IdEvento ??
    "";

  if (!id) {
    console.warn("[createEvent] respuesta sin id, data:", data);
    throw new Error("La API no devolvió el id del evento.");
  }
  return String(id);
}

/** ---------- UPDATE (PUT/PATCH tolerante) ---------- */
export async function updateEvent(
  idEvento: string,
  payload: any
): Promise<void> {
  const id = String(idEvento || "").trim();
  if (!id) throw new Error("ID de evento vacío para actualizar.");

  const token = await login();
  const headers = { Authorization: `Bearer ${token}` };

  const attempts: Array<() => Promise<any>> = [
    () =>
      apiClient.put(
        "/v1/Evento/UpdateEvento",
        { idEvento: id, ...payload },
        { headers }
      ),
    () =>
      apiClient.put(
        "/v1/Evento/Update",
        { idEvento: id, ...payload },
        { headers }
      ),
    () =>
      apiClient.put(
        "/v1/Evento/PutEvento",
        { idEvento: id, ...payload },
        { headers }
      ),
    () =>
      apiClient.put(`/v1/Evento/${encodeURIComponent(id)}`, payload, {
        headers,
      }),
  ];

  let lastErr: any = null;
  for (const fn of attempts) {
    try {
      await fn();
      return;
    } catch (e: any) {
      lastErr = e;
      continue;
    }
  }
  const msg =
    lastErr?.response?.data?.message ||
    lastErr?.message ||
    "No se pudo actualizar el evento (endpoint desconocido).";
  throw new Error(msg);
}

/** ---------- Cambiar estado (helper genérico) ---------- */
export async function setEventStatus(
  idEvento: string,
  estado: number,
  extra?: Record<string, any>
): Promise<void> {
  const payload = {
    estado,
    cdEstado: estado,
    estadoEvento: estado,
    ...extra,
  };
  await updateEvent(idEvento, payload);
}

/** ---------- Cancelar/Eliminar evento (DELETE dedicado) ---------- */
export async function cancelEvent(idEvento: string): Promise<void> {
  const id = String(idEvento || "").trim();
  if (!id) throw new Error("Falta el id del evento.");
  const token = await login().catch(() => null);

  await apiClient.delete("/v1/Evento/DeleteEvento", {
    params: { id },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
