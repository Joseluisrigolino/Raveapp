// utils/events/eventApi.ts
import { EventItem } from "@/interfaces/EventItem";
import { apiClient, login } from "@/utils/apiConfig";
import { mediaApi } from "@/utils/mediaApi";

/** ---------- util fechas ---------- */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function formatTimeRange(startIso: string, endIso: string): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const s = new Date(startIso);
  const e = new Date(endIso);
  return `${pad(s.getHours())}hs a ${pad(e.getHours())}hs`;
}

/** ---------- media ---------- */
const PLACEHOLDER_IMAGE = "";
async function fetchEventMediaUrl(idEvento: string): Promise<string> {
  try {
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

/** ---------- géneros dinámicos ---------- */
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

/** ---------- eventos ---------- */
export async function fetchEvents(estado: number = 2): Promise<
  (EventItem & {
    estado?: number;
    fechas?: { idFecha: string; inicio: string; fin: string }[];
  })[]
> {
  const token = await login();
  const resp = await apiClient.get<{ eventos: any[] }>(
    "/v1/Evento/GetEventos",
    {
      params: { Estado: estado },
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const list = resp.data?.eventos ?? [];
  const genreMap = await getGenreMap();

  const enriched = await Promise.all(
    list.map(async (e) => {
      const inicioIso = e.fechas?.[0]?.inicio ?? e.inicioEvento;
      const finIso = e.fechas?.[0]?.fin ?? e.finEvento;

      const imageUrl =
        (await fetchEventMediaUrl(e.idEvento)) || e.media?.[0]?.imagen || "";

      // la API manda array de códigos de género → uso el primero
      const code = Number(
        Array.isArray(e.genero) && e.genero.length ? e.genero[0] : NaN
      );
      const type =
        Number.isFinite(code) && genreMap.has(code)
          ? (genreMap.get(code) as string)
          : "Otros";

      return {
        id: e.idEvento,
        title: e.nombre,
        date: formatDate(inicioIso),
        timeRange: formatTimeRange(inicioIso, finIso),
        address: e.domicilio?.direccion ?? "",
        description: e.descripcion,
        imageUrl,
        type, // nombre del género
        estado: e.fechas?.[0]?.estado,
        ownerName: e.propietario?.nombre,
        ownerEmail: e.propietario?.correo,
        fechas: (e.fechas ?? []).map((f: any) => ({
          idFecha: String(f.idFecha),
          inicio: String(f.inicio),
          fin: String(f.fin),
        })),
      } as EventItem & {
        estado?: number;
        fechas?: { idFecha: string; inicio: string; fin: string }[];
      };
    })
  );

  return enriched;
}
