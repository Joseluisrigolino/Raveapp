// utils/events/eventApi.ts
import { EventItem } from "@/interfaces/EventItem";
import { apiClient, login } from "@/utils/apiConfig";
import { mediaApi } from "@/utils/mediaApi";
import { fetchArtistsFromApi } from "@/utils/artists/artistApi";

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

  const imageUrl =
    (await fetchEventMediaUrl(String(e?.idEvento))) ||
    e?.media?.[0]?.imagen ||
    "";

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

export async function fetchEventsByEstados(
  estados: number[]
): Promise<EventItemWithExtras[]> {
  const batches = await Promise.all(estados.map((st) => fetchEventsByEstado(st)));
  const flat = ([] as EventItemWithExtras[]).concat(...batches);
  const map = new Map<string, EventItemWithExtras>();
  for (const e of flat) map.set(String(e.id), e);
  return Array.from(map.values());
}

/** alias compat */
export async function fetchEvents(
  estado: number = 2
): Promise<EventItemWithExtras[]> {
  return fetchEventsByEstado(estado);
}

/** ---------- DETALLE por ID (robusto con fallback) ---------- */
export async function fetchEventById(idEvento: string): Promise<EventItemWithExtras> {
  const id = String(idEvento || "").trim();
  if (!id) {
    const err: any = new Error("ID de evento vacío.");
    err.code = "NOT_FOUND";
    throw err;
  }

  const token = await login().catch(() => null);
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const attempts: Array<() => Promise<any>> = [
    () => apiClient.get("/v1/Evento/GetEvento", { params: { idEvento: id }, headers }),
    () => apiClient.get("/v1/Evento/GetEvento", { params: { id }, headers }),
    () => apiClient.get(`/v1/Evento/GetEvento/${encodeURIComponent(id)}`, { headers }),
  ];

  for (const fn of attempts) {
    try {
      const resp = await fn();
      const data = resp?.data?.evento ?? resp?.data;
      if (!data) continue;
      return await normalizeEvento(data);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status && status !== 404) {
        console.warn("[fetchEventById] intento fallido:", status);
      }
    }
  }

  try {
    const all = await fetchEventsByEstados([0, 1, 2, 3, 4, 5, 6]);
    const found = all.find((e) => String(e.id) === id);
    if (found) return found;
  } catch (e) {
    console.warn("[fetchEventById] fallback estados falló:", e);
  }

  const err: any = new Error("Evento no encontrado.");
  err.code = "NOT_FOUND";
  throw err;
}

/** ---------- UPDATE (PUT/PATCH tolerante) ---------- */
export async function updateEvent(idEvento: string, payload: any): Promise<void> {
  const id = String(idEvento || "").trim();
  if (!id) throw new Error("ID de evento vacío para actualizar.");

  const token = await login();
  const headers = { Authorization: `Bearer ${token}` };

  const attempts: Array<() => Promise<any>> = [
    () => apiClient.put("/v1/Evento/UpdateEvento", { idEvento: id, ...payload }, { headers }),
    () => apiClient.put("/v1/Evento/Update", { idEvento: id, ...payload }, { headers }),
    () => apiClient.put("/v1/Evento/PutEvento", { idEvento: id, ...payload }, { headers }),
    () => apiClient.put(`/v1/Evento/${encodeURIComponent(id)}`, payload, { headers }),
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

/* =========================================================================================
 *                                      CREATE
 * =========================================================================================
 */

export type CreateEventUI = {
  // Datos base
  idUsuario: string;
  nombre: string;
  descripcion: string;
  genero: number[]; // ids
  isAfter: boolean;
  isLgbt: boolean;

  // Artistas (nombres elegidos en UI)
  selectedArtistNames: string[];

  // Fiesta recurrente
  idFiesta?: string | null;

  // Ubicación
  provinciaId?: string;
  provinciaNombre?: string;
  municipioId?: string;
  municipioNombre?: string;
  localidadId?: string;
  localidadNombre?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;

  // Fechas por día
  daySchedules: { start: Date; end: Date }[];
  daySaleConfigs: { saleStart: Date; sellUntil: Date }[];

  // Multimedia (opcional, se sube luego de crear el evento)
  photoFileUri?: string | null;
  musicLink?: string; // soundCloud
};

function toIso(d?: Date | string | null): string | undefined {
  if (!d) return undefined;
  try {
    const x = typeof d === "string" ? new Date(d) : d;
    return x.toISOString();
  } catch {
    return undefined;
  }
}

async function resolveArtistIdsByName(names: string[]): Promise<string[]> {
  if (!names?.length) return [];
  const list = await fetchArtistsFromApi().catch(() => []);
  const norm = (s: string) =>
    (s || "")
      .normalize("NFD")
      // @ts-ignore
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  const byName = new Map(list.map((a: any) => [norm(a.name), a]));
  const ids: string[] = [];
  for (const n of names) {
    const a = byName.get(norm(n));
    if (a?.idArtista) ids.push(String(a.idArtista));
  }
  return ids;
}

/**
 * Crea el evento en /v1/Evento/CrearEvento
 * Devuelve el idEvento creado (si el backend lo retorna) y el body usado.
 */
export async function createEvent(ui: CreateEventUI): Promise<{ idEvento?: string; usedBody: any }> {
  if (!ui?.idUsuario) throw new Error("Falta idUsuario");
  if (!ui?.nombre?.trim()) throw new Error("Falta nombre del evento");
  if (!ui?.daySchedules?.length) throw new Error("Falta al menos 1 fecha de evento");

  // Fechas agregadas (inicio/fin globales y ventas globales)
  const startList = ui.daySchedules.map(d => d.start).filter(Boolean) as Date[];
  const endList = ui.daySchedules.map(d => d.end).filter(Boolean) as Date[];
  const ventaStartList = ui.daySaleConfigs.map(d => d.saleStart).filter(Boolean) as Date[];
  const ventaEndList = ui.daySaleConfigs.map(d => d.sellUntil).filter(Boolean) as Date[];

  const minDate = (arr: Date[]) => new Date(Math.min(...arr.map(x => x.getTime())));
  const maxDate = (arr: Date[]) => new Date(Math.max(...arr.map(x => x.getTime())));

  const inicioEvento = startList.length ? toIso(minDate(startList)) : undefined;
  const finEvento = endList.length ? toIso(maxDate(endList)) : undefined;
  const inicioVenta = ventaStartList.length ? toIso(minDate(ventaStartList)) : undefined;
  const finVenta = ventaEndList.length ? toIso(maxDate(ventaEndList)) : undefined;

  // Fechas detalle (respetando la clave con y sin typo, por compatibilidad)
  const fechas = ui.daySchedules.map((sch, i) => {
    const venta = ui.daySaleConfigs[i];
    const fechaInicio = toIso(sch.start);
    const fechaFin = toIso(sch.end);
    const fechaInicioVenta = toIso(venta?.saleStart);
    const fechaFinVenta = toIso(venta?.sellUntil);
    return {
      fechaInicio,
      fechaFin,
      // dos claves por si el backend espera la tipiada "fechaIncioVenta"
      fechaInicioVenta,
      fechaIncioVenta: fechaInicioVenta,
      fechaFinVenta,
      estado: 0,
    };
  });

  // Domicilio
  const domicilio = {
    localidad: ui.localidadNombre
      ? { nombre: ui.localidadNombre, codigo: ui.localidadId ?? "" }
      : undefined,
    municipio: ui.municipioNombre
      ? { nombre: ui.municipioNombre, codigo: ui.municipioId ?? "" }
      : undefined,
    provincia: ui.provinciaNombre
      ? { nombre: ui.provinciaNombre, codigo: ui.provinciaId ?? "" }
      : undefined,
    direccion: ui.direccion ?? "",
    latitud: typeof ui.latitud === "number" ? ui.latitud : 0,
    longitud: typeof ui.longitud === "number" ? ui.longitud : 0,
  };

  // Artistas → IDs
  const idArtistas = await resolveArtistIdsByName(ui.selectedArtistNames);

  const body = {
    idUsuario: String(ui.idUsuario),
    idArtistas,
    domicilio,
    nombre: ui.nombre,
    descripcion: ui.descripcion ?? "",
    genero: Array.isArray(ui.genero) ? ui.genero : [],
    isAfter: !!ui.isAfter,
    isLgbt: !!ui.isLgbt,
    inicioVenta,
    finVenta,
    inicioEvento,
    finEvento,
    estado: 0, // por defecto "Por aprobar"
    fechas,
    idFiesta: ui.idFiesta || undefined,
    soundCloud: ui.musicLink || "",
  };

  const token = await login();
  const { data } = await apiClient.post("/v1/Evento/CrearEvento", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "*/*",
    },
  });

  // Intentamos extraer el idEvento devuelto por distintas formas comunes
  const idEvento =
    data?.idEvento ??
    data?.evento?.idEvento ??
    data?.IdEvento ??
    data?.Evento?.IdEvento ??
    data?.id ??
    undefined;

  return { idEvento: idEvento ? String(idEvento) : undefined, usedBody: body };
}
