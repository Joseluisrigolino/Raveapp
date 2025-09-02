// utils/events/eventApi.ts
import { EventItem } from "@/interfaces/EventItem";
import { apiClient, login } from "@/utils/apiConfig";
import { mediaApi } from "@/utils/mediaApi";

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

/** ---------- media (tolerante) ---------- */
const PLACEHOLDER_IMAGE = "";
async function fetchEventMediaUrl(idEvento: string): Promise<string> {
  try {
    if (!idEvento) return PLACEHOLDER_IMAGE;
    const data: any = await mediaApi.getByEntidad(idEvento);
    const m = data?.media?.[0];
    let img = m?.url ?? m?.imagen ?? "";
    if (img && !/^https?:\/\//.test(img)) {
      const base = apiClient.defaults.baseURL ?? "";
      img = `${base}${img.startsWith("/") ? "" : "/"}${img}`;
    }
    return img || PLACEHOLDER_IMAGE;
  } catch {
    // si falla (404, etc.) no rompemos
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

/** Trae TODOS los estados disponibles desde la API */
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
};

async function normalizeEvento(e: RawEvento): Promise<EventItemWithExtras> {
  const genreMap = await getGenreMap();

  const inicioIso =
    e?.fechas?.[0]?.inicio ?? e?.inicioEvento ?? e?.inicio ?? null;
  const finIso = e?.fechas?.[0]?.fin ?? e?.finEvento ?? e?.fin ?? null;

  // imagen (tolerante)
  const imageUrl =
    (await fetchEventMediaUrl(String(e?.idEvento))) ||
    e?.media?.[0]?.imagen ||
    "";

  // la API suele mandar array de codigos de género → uso el primero
  const code = Number(
    Array.isArray(e?.genero) && e.genero.length ? e.genero[0] : NaN
  );
  const type =
    Number.isFinite(code) && genreMap.has(code)
      ? (genreMap.get(code) as string)
      : "Otros";

  const estadoCod =
    Number(e?.estado) ??
    Number(e?.fechas?.[0]?.estado) ??
    Number(e?.cdEstado);

  return {
    id: String(e?.idEvento ?? e?.id ?? ""),
    title: String(e?.nombre ?? e?.titulo ?? e?.dsNombre ?? ""),
    date: inicioIso ? formatDate(inicioIso) : "",
    timeRange: inicioIso && finIso ? formatTimeRange(inicioIso, finIso) : "",
    address: e?.domicilio?.direccion ?? "",
    description: e?.descripcion ?? "",
    imageUrl, // puede quedar "", tu Card lo maneja
    type, // nombre del género
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
  };
}

/** ---------- eventos por estado ---------- */
/**
 * Trae eventos filtrados por cdEstado (0..6) usando /v1/Evento/GetEventos?Estado={cd}
 * - Devuelve eventos normalizados y tolerantes a media faltante.
 */
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
 * Helper opcional para traer múltiples estados de una sola vez y mergear por id.
 * Ej: fetchEventsByEstados([0,1,2,3,4,5,6])
 */
export async function fetchEventsByEstados(
  estados: number[]
): Promise<EventItemWithExtras[]> {
  const batches = await Promise.all(estados.map((st) => fetchEventsByEstado(st)));
  const flat = ([] as EventItemWithExtras[]).concat(...batches);
  const map = new Map<string, EventItemWithExtras>();
  for (const e of flat) {
    map.set(String(e.id), e);
  }
  return Array.from(map.values());
}

/** ---------- compat (si ya usabas fetchEvents) ---------- */
// Mantengo un alias por compatibilidad con tu código previo.
export async function fetchEvents(
  estado: number = 2
): Promise<EventItemWithExtras[]> {
  return fetchEventsByEstado(estado);
}
