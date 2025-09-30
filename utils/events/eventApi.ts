/**
 * Devuelve los flags isAfter y isLGBT de un evento dado (EventItemWithExtras)
 */
export function getEventFlags(event: EventItemWithExtras): { isAfter: boolean; isLGBT: boolean } {
  return {
    isAfter: Boolean(event.isAfter),
    isLGBT: Boolean(event.isLGBT)
  };
}
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
  cdEstado?: number;
  fechas?: { idFecha: string; inicio: string; fin: string }[];
  ownerName?: string;
  ownerId?: string;
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
  __raw?: any;
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

  // detectar URLs multimedia en varios posibles campos/formatos
  const mediaCandidates: string[] = [];
  const pushIf = (val: any) => {
    if (typeof val === "string" && val.trim()) mediaCandidates.push(val.trim());
  };

  // campos directos
  pushIf(e?.video);
  pushIf(e?.Video);
  pushIf(e?.videoUrl);
  pushIf(e?.urlVideo);
  pushIf(e?.url_video);
  pushIf(e?.musica);
  pushIf(e?.soundCloud);
  pushIf(e?.soundcloud);
  pushIf(e?.sound_cloud);
  pushIf(e?.musicaUrl);
  pushIf(e?.musicaURL);
  pushIf(e?.music);
  pushIf(e?.musicUrl);

  // campos legacy mdVideo / mdAudio o url dentro de media[]
  if (Array.isArray(e?.media)) {
    for (const m of e.media) {
      if (!m) continue;
      pushIf(m.mdVideo ?? m.MDVideo ?? m.mdvideo);
      pushIf(m.mdAudio ?? m.MDAudio ?? m.mdaudio);
      pushIf(m.url ?? m.Url ?? m.path ?? m.uri);
      pushIf(m.video ?? m.Video);
      pushIf(m.audio ?? m.Audio);
    }
  }

  // normalizar: preferir YouTube para `video` y SoundCloud para `musica`
  const findFirst = (re: RegExp) => mediaCandidates.find((u) => re.test(u));
  const youTubeCandidate = findFirst(/youtube\.com|youtu\.be/i) ?? null;
  const soundCloudCandidate = findFirst(/soundcloud\.com/i) ?? null;

  const normalizedVideo = youTubeCandidate ?? (typeof e?.video === "string" ? e.video : undefined);
  const normalizedMusica = soundCloudCandidate ?? (typeof e?.musica === "string" ? e.musica : undefined);

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
    // Exponer el cdEstado original (raw) que usa la API para identificar el estado
    cdEstado: Number.isFinite(Number(e?.cdEstado ?? e?.cd_estado ?? e?.cdestado))
      ? Number(e?.cdEstado ?? e?.cd_estado ?? e?.cdestado)
      : undefined,
    // el backend puede devolver datos del propietario en distintos campos
    ownerName: e?.propietario?.nombre ?? e?.usuario?.nombre ?? e?.ownerName,
    ownerId:
      e?.propietario?.idUsuario ?? e?.usuario?.idUsuario ?? e?.ownerId ?? e?.idUsuarioPropietario ?? undefined,
    ownerEmail: e?.propietario?.correo ?? e?.usuario?.correo ?? e?.ownerEmail,
    __raw: e,
    fechas: Array.isArray(e?.fechas)
      ? e.fechas.map((f: any) => ({
          idFecha: String(f?.idFecha ?? ""),
          inicio: String(f?.inicio ?? ""),
          fin: String(f?.fin ?? ""),
          estado: Number.isFinite(Number(f?.estado)) ? Number(f?.estado) : undefined,
        }))
      : [],
    genero: Array.isArray(e?.genero) ? e.genero : [],
    artistas: Array.isArray(e?.artistas) ? e.artistas : [],
    domicilio: dom,
  video: normalizedVideo ?? e?.video,
  musica: normalizedMusica ?? e?.musica,
    isAfter: Boolean(e?.isAfter),
    // La API puede devolver distintas variantes de la propiedad (isLgbt, isLGBT, isLgtb, etc.)
    isLGBT: Boolean(
      e?.isLgbt ?? e?.isLGBT ?? e?.isLgtb ?? e?.isLGTB ?? e?.isLGBt ?? e?.is_lgbt ?? false
    ),
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

  // Only log the created idEvento to avoid noisy output in production-like logs
  try {
    const anyData: any = resp?.data;
    const id =
      (anyData && (anyData.idEvento ?? anyData.IdEvento ?? anyData.evento?.idEvento ?? anyData.evento?.IdEvento)) ||
      (typeof anyData === "string" && anyData)
      || null;
    if (id) {
      try { console.info('[createEvent] idEvento:', String(id)); } catch {}
    }
  } catch {}

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

  // If the payload only contains status fields, many backends expect a full event object
  // for UpdateEvento. Try constructing the full body and calling UpdateEvento directly
  // before attempting other endpoints. This reduces 404s when backend requires full body.
  try {
    const keys = Object.keys(payload || {});
    const statusOnly = keys.length > 0 && keys.every((k) => ["estado", "cdEstado", "estadoEvento"].includes(k));
    if (statusOnly) {
      try {
        let raw: any = null;
        try {
          const evt = await fetchEventById(id);
          raw = (evt as any).__raw ?? null;
        } catch {
          raw = null;
        }

        const buildBodyFromRaw = (r: any) => {
          if (!r) return { idEvento: id };
          return {
            idEvento: r?.idEvento ?? r?.id ?? id,
            idArtistas: Array.isArray(r?.artistas) ? r.artistas.map((a: any) => a?.idArtista ?? a?.id) : [],
            domicilio: r?.domicilio ?? r?.direccion ? {
              localidad: r?.domicilio?.localidad ?? r?.localidad ?? null,
              municipio: r?.domicilio?.municipio ?? r?.municipio ?? null,
              provincia: r?.domicilio?.provincia ?? r?.provincia ?? null,
              direccion: r?.domicilio?.direccion ?? r?.direccion ?? "",
              latitud: r?.domicilio?.latitud ?? r?.latitud ?? 0,
              longitud: r?.domicilio?.longitud ?? r?.longitud ?? 0,
            } : undefined,
            nombre: r?.nombre ?? r?.titulo ?? r?.dsNombre,
            descripcion: r?.descripcion,
            genero: Array.isArray(r?.genero) ? r.genero : (r?.genero ? [r.genero] : []),
            isAfter: Boolean(r?.isAfter),
            isLgbt: Boolean(r?.isLgbt ?? r?.isLGBT),
            inicioEvento: r?.fechas?.[0]?.inicio ?? r?.inicioEvento ?? r?.inicio,
            finEvento: r?.fechas?.[0]?.fin ?? r?.finEvento ?? r?.fin,
            estado: payload?.estado ?? r?.estado ?? undefined,
            fechas: Array.isArray(r?.fechas)
              ? r.fechas.map((f: any) => ({
                  idFecha: f?.idFecha ?? f?.id,
                  inicio: f?.inicio,
                  fin: f?.fin,
                  inicioVenta: f?.inicioVenta,
                  finVenta: f?.finVenta,
                  estado: f?.estado,
                }))
              : [],
            idFiesta: r?.idFiesta ?? null,
            soundCloud: r?.soundCloud ?? r?.musica ?? r?.soundcloud ?? null,
          };
        };

        const fullBody = buildBodyFromRaw(raw);
        // merge any provided fields
        Object.assign(fullBody, payload || {});
        await apiClient.put("/v1/Evento/UpdateEvento", fullBody, { headers });
        return;
      } catch (err) {
        console.warn('[updateEvent] intento directo UpdateEvento con body completo falló, continuando intentos:', String((err as any)?.message || err));
        // continue to generic attempts
      }
    }
  } catch {
    // no-op: fall back to generic attempts below
  }

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
    // posibles endpoints alternativos para cambiar estado
    () =>
      apiClient.post(
        "/v1/Evento/CambiarEstado",
        { idEvento: id, ...payload },
        { headers }
      ),
    () =>
      apiClient.post(
        "/v1/Evento/SetEstado",
        { idEvento: id, ...payload },
        { headers }
      ),
  ];

  let lastErr: any = null;
  // for debugging: list the human-friendly attempted endpoints (in same order)
  const base = apiClient.defaults.baseURL ?? "";
  // for debugging: list the human-friendly attempted endpoints (in same order)
  const attemptedEndpoints = [
    { method: "PUT", url: "/v1/Evento/UpdateEvento", fullUrl: `${base}/v1/Evento/UpdateEvento`, body: { idEvento: id, ...payload } },
    { method: "PUT", url: "/v1/Evento/Update", fullUrl: `${base}/v1/Evento/Update`, body: { idEvento: id, ...payload } },
    { method: "PUT", url: "/v1/Evento/PutEvento", fullUrl: `${base}/v1/Evento/PutEvento`, body: { idEvento: id, ...payload } },
    { method: "PUT", url: `/v1/Evento/${encodeURIComponent(id)}`, fullUrl: `${base}/v1/Evento/${encodeURIComponent(id)}`, body: payload },
    { method: "POST", url: "/v1/Evento/CambiarEstado", fullUrl: `${base}/v1/Evento/CambiarEstado`, body: { idEvento: id, ...payload } },
    { method: "POST", url: "/v1/Evento/SetEstado", fullUrl: `${base}/v1/Evento/SetEstado`, body: { idEvento: id, ...payload } },
  ];
  for (const fn of attempts) {
    try {
      await fn();
      return;
    } catch (e: any) {
      lastErr = e;
      continue;
    }
  }
  // build a diagnostic message including HTTP status / body if available
  const status = lastErr?.response?.status ?? lastErr?.status;
  const respData = lastErr?.response?.data ?? lastErr?.response?.data?.toString?.() ?? lastErr?.toString?.();
  const baseMsg = (lastErr?.response?.data && (lastErr?.response?.data?.message || lastErr?.response?.data)) || lastErr?.message || "No se pudo actualizar el evento (endpoint desconocido).";
  const diag = {
    attemptedEndpoints,
    lastStatus: status,
    lastResponseData: respData,
    lastErrorMessage: String(lastErr?.message || lastErr),
  };
  try {
    console.warn("[updateEvent] todos los endpoints intentados fallaron:", JSON.stringify(diag, null, 2));
  } catch {
    console.warn("[updateEvent] todos los endpoints intentados fallaron: (no se pudo stringify diag)", diag);
  }
  const msg = `${String(baseMsg)} | diagnostics: ${JSON.stringify(diag)}`;
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
  try {
    await updateEvent(idEvento, payload);
    return;
  } catch (e: any) {
    console.warn("[setEventStatus] updateEvent falló, intentando UpdateEvento con body completo:", e?.message || e);
    // intentar fallback: armar body completo usando el evento tal cual viene (fetchEventById -> __raw)
    try {
      const token = await login().catch(() => null);
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // intentar obtener el raw del evento para construir el body completo
      let raw: any = null;
      try {
        const evt = await fetchEventById(idEvento);
        raw = (evt as any).__raw ?? null;
      } catch (err) {
        // no crítico: si no se puede recuperar, seguiremos intentando con campos mínimos
        raw = null;
      }

      const buildBodyFromRaw = (r: any) => {
        if (!r) {
          return { idEvento };
        }
        return {
          idEvento: r?.idEvento ?? r?.id ?? idEvento,
          idArtistas: Array.isArray(r?.artistas) ? r.artistas.map((a: any) => a?.idArtista ?? a?.id) : [],
          domicilio: r?.domicilio ?? r?.direccion ? {
            localidad: r?.domicilio?.localidad ?? r?.localidad ?? null,
            municipio: r?.domicilio?.municipio ?? r?.municipio ?? null,
            provincia: r?.domicilio?.provincia ?? r?.provincia ?? null,
            direccion: r?.domicilio?.direccion ?? r?.direccion ?? "",
            latitud: r?.domicilio?.latitud ?? r?.latitud ?? 0,
            longitud: r?.domicilio?.longitud ?? r?.longitud ?? 0,
          } : undefined,
          nombre: r?.nombre ?? r?.titulo ?? r?.dsNombre,
          descripcion: r?.descripcion,
          genero: Array.isArray(r?.genero) ? r.genero : (r?.genero ? [r.genero] : []),
          isAfter: Boolean(r?.isAfter),
          isLgbt: Boolean(r?.isLgbt ?? r?.isLGBT),
          inicioEvento: r?.fechas?.[0]?.inicio ?? r?.inicioEvento ?? r?.inicio,
          finEvento: r?.fechas?.[0]?.fin ?? r?.finEvento ?? r?.fin,
          estado: estado,
          fechas: Array.isArray(r?.fechas)
            ? r.fechas.map((f: any) => ({
                idFecha: f?.idFecha ?? f?.id,
                inicio: f?.inicio,
                fin: f?.fin,
                inicioVenta: f?.inicioVenta,
                finVenta: f?.finVenta,
                estado: f?.estado,
              }))
            : [],
          idFiesta: r?.idFiesta ?? null,
          soundCloud: r?.soundCloud ?? r?.musica ?? r?.soundcloud ?? null,
        };
      };

      const fullBody = buildBodyFromRaw(raw);
      // merge any extra fields provided explicitly
      Object.assign(fullBody, extra || {});

      // Enviar al endpoint UpdateEvento (que según tu doc espera un objeto completo)
      await apiClient.put("/v1/Evento/UpdateEvento", fullBody, { headers });
      return;
    } catch (err2: any) {
      console.error("[setEventStatus] fallback UpdateEvento falló:", err2);
      throw err2;
    }
  }
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
