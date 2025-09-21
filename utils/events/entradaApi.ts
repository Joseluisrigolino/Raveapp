// utils/entradas/entradaApi.ts
import { apiClient, login } from "@/utils/apiConfig";

/** =========================================================================
 *                               TIPOS
 *  ======================================================================= */

/** ---------- Tipos de entrada ---------- */
export interface ApiTipoEntrada {
  cdTipo: number;
  dsTipo: string;
}

/** ---------- Estados de entrada ---------- */
export interface ApiEstadoEntrada {
  cdEstado: number;
  dsEstado: string | null;
}

/** ---------- Item crudo devuelto por GetEntradasFecha ---------- */
export interface ApiEntradaFechaRaw {
  idEntrada: string | null;
  mdQR?: string | null;
  fecha?: {
    idFecha: string;
    inicio?: string | null;
    fin?: string | null;
    inicioVenta?: string | null;
    finVenta?: string | null;
    estado?: number | null;
  } | null;
  estado?: {
    cdEstado: number;
    dsEstado: string | null;
  } | null;
  precio: number;
  cantidad: number;
  tipo?: {
    cdTipo: number;
    dsTipo: string;
  } | null;
}

/** ---------- Forma “flatten” usada por la UI ---------- */
export interface ApiEntradaFecha {
  idEntrada: string;
  idFecha: string;
  cdTipo: number;
  precio: number;
  /** disponible actual si tu API lo expone; si no, queda undefined */
  stock?: number;
  /** tope por usuario si aplica; si no, queda undefined */
  maxPorUsuario?: number;
}

/** ---------- Forma de merge para la UI ---------- */
export interface UiEntrada extends ApiEntradaFecha {
  nombreTipo: string; // dsTipo
  maxCompra: number; // cantidad máxima (stock / tope / default)
}

/** ---------- Crear entradas ---------- */
export type CreateEntradaBody = {
  idFecha: string; // en tu backend: id de la FECHA/EVENTO
  tipo: number; // cdTipo
  estado: number; // cdEstado
  precio: number;
  cantidad: number;
};

/** ---------- Update entrada ---------- */
export type UpdateEntradaBody = {
  idFecha: string;
  precio: number;
  tipo: number; // cdTipo
};

/** ---------- Reservar entradas ---------- */
export type ReservarEntradasBody = {
  entradas: Array<{ tipoEntrada: number; cantidad: number }>;
  idUsuario: string;
  idFecha: string;
};

export type ReservarEntradasResponse = {
  /** muchas APIs devuelven idCompra; si no, será unknown */
  idCompra?: string;
  [k: string]: any;
};

/** ---------- Reserva activa ---------- */
export type ReservaActiva = {
  idCompra: string;
  idUsuario: string;
  idFecha: string;
  vencimiento?: string;
  items: Array<{
    tipoEntrada: number;
    cantidad: number;
    precio?: number;
  }>;
} | null;

/** =========================================================================
 *                         CACHES EN MEMORIA
 *  ======================================================================= */

let _tiposCache: ApiTipoEntrada[] | null = null;
let _tipoMapCache: Map<number, string> | null = null;

let _estadosCache: ApiEstadoEntrada[] | null = null;
let _estadoMapCache: Map<number, string> | null = null;

/** =========================================================================
 *                           ENDPOINTS: TIPOS
 *  ======================================================================= */

export async function fetchTiposEntrada(): Promise<ApiTipoEntrada[]> {
  try {
    if (_tiposCache) return _tiposCache;
    const token = await login().catch(() => null);
    const { data } = await apiClient.get<ApiTipoEntrada[]>(
      "/v1/Entrada/GetTiposEntrada",
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    );
    _tiposCache = Array.isArray(data) ? data : [];
    _tipoMapCache = new Map(_tiposCache.map((t) => [t.cdTipo, t.dsTipo]));
    return _tiposCache;
  } catch {
    _tiposCache = [];
    _tipoMapCache = new Map();
    return [];
  }
}

export async function getTipoMap(): Promise<Map<number, string>> {
  if (_tipoMapCache) return _tipoMapCache;
  await fetchTiposEntrada();
  return _tipoMapCache ?? new Map();
}

/** =========================================================================
 *                         ENDPOINTS: ESTADOS
 *  ======================================================================= */

export async function fetchEstadosEntrada(): Promise<ApiEstadoEntrada[]> {
  try {
    if (_estadosCache) return _estadosCache;
    const token = await login().catch(() => null);
    const { data } = await apiClient.get<ApiEstadoEntrada[]>(
      "/v1/Entrada/GetEstadosEntrada",
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    );
    _estadosCache = Array.isArray(data) ? data : [];
    _estadoMapCache = new Map(
      _estadosCache.map((e) => [
        e.cdEstado,
        e.dsEstado ?? `Estado ${e.cdEstado}`,
      ])
    );
    return _estadosCache;
  } catch {
    _estadosCache = [];
    _estadoMapCache = new Map();
    return [];
  }
}

export async function getEstadoMap(): Promise<Map<number, string>> {
  if (_estadoMapCache) return _estadoMapCache;
  await fetchEstadosEntrada();
  return _estadoMapCache ?? new Map();
}

/** =========================================================================
 *                 ENDPOINTS: ENTRADAS POR FECHA (RAW + FLATTEN)
 *  ======================================================================= */

/**
 * RAW: devuelve exactamente la forma del backend.
 * GET /v1/Entrada/GetEntradasFecha?IdFecha=...&Estado=...
 */
export async function fetchEntradasFechaRaw(
  idFecha: string,
  estado?: number
): Promise<ApiEntradaFechaRaw[]> {
  const token = await login();
  const { data } = await apiClient.get<ApiEntradaFechaRaw[]>(
    "/v1/Entrada/GetEntradasFecha",
    {
      params: {
        IdFecha: idFecha,
        ...(typeof estado === "number" ? { Estado: estado } : {}),
      },
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return Array.isArray(data) ? data : [];
}

/**
 * FLATTEN para la UI actual (compatible con el código existente).
 * Toma el RAW y lo mappea a una forma más simple.
 */
export async function fetchEntradasByFecha(
  idFecha: string,
  estado?: number
): Promise<ApiEntradaFecha[]> {
  const raw = await fetchEntradasFechaRaw(idFecha, estado);

  return raw.map((e) => {
    const f = e.fecha ?? null;
    const t = e.tipo ?? null;

    return {
      idEntrada: String(e.idEntrada ?? ""),
      idFecha: String(f?.idFecha ?? idFecha),
      cdTipo: Number(t?.cdTipo ?? 0),
      precio: Number(e.precio ?? 0),

      // Estos campos no están explícitos en el swagger; los dejo por si tu API
      // los llega a enviar a futuro (o los agregás).
      stock: undefined,
      maxPorUsuario: undefined,
    } as ApiEntradaFecha;
  });
}

/** =========================================================================
 *                    HELPERS DE MERGE PARA LA UI
 *  ======================================================================= */

export function mergeEntradasConTipos(
  entradas: ApiEntradaFecha[],
  tipoMap: Map<number, string>,
  defaultMax: number = 10
): UiEntrada[] {
  return entradas.map((e) => {
    const nombreTipo = tipoMap.get(e.cdTipo) ?? `Tipo ${e.cdTipo}`;
    const maxCompra =
      typeof e.maxPorUsuario === "number" && e.maxPorUsuario > 0
        ? e.maxPorUsuario
        : typeof e.stock === "number" && e.stock > 0
        ? e.stock
        : defaultMax;

    return { ...e, nombreTipo, maxCompra };
  });
}

/** =========================================================================
 *                                CREACIÓN
 *  POST /v1/Entrada/CrearEntradas
 *  body:
 *  {
 *    "idFecha": "string",
 *    "tipo": 0,
 *    "estado": 0,
 *    "precio": 0,
 *    "cantidad": 0
 *  }
 *  ======================================================================= */

export async function createEntrada(body: CreateEntradaBody): Promise<void> {
  const token = await login();
  await apiClient.post("/v1/Entrada/CrearEntradas", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

/** Crea en serie varias entradas. Si alguna falla, continúa y reporta el último error. */
export async function createEntradasBulk(
  items: CreateEntradaBody[]
): Promise<void> {
  let lastErr: any = null;
  for (const it of items) {
    try {
      await createEntrada(it);
    } catch (e: any) {
      lastErr = e;
      // seguimos con las demás
    }
  }
  if (lastErr) {
    const msg =
      lastErr?.response?.data?.message ||
      lastErr?.message ||
      "No se pudieron crear todas las entradas.";
    throw new Error(msg);
  }
}

/** =========================================================================
 *                                  UPDATE
 *  PUT /v1/Entrada/UpdateEntrada
 *  body:
 *  {
 *    "idFecha": "string",
 *    "precio": 0,
 *    "tipo": 0
 *  }
 *  ======================================================================= */

export async function updateEntrada(body: UpdateEntradaBody): Promise<void> {
  const token = await login();
  await apiClient.put("/v1/Entrada/UpdateEntrada", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

/** =========================================================================
 *                               RESERVAS
 *  ======================================================================= */

/**
 * PUT /v1/Entrada/ReservarEntradas
 * body:
 * {
 *   "entradas": [{ "tipoEntrada": 0, "cantidad": 0 }],
 *   "idUsuario": "string",
 *   "idFecha": "string"
 * }
 */
export async function reservarEntradas(
  body: ReservarEntradasBody
): Promise<ReservarEntradasResponse> {
  const token = await login();
  const { data } = await apiClient.put<ReservarEntradasResponse>(
    "/v1/Entrada/ReservarEntradas",
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return data ?? {};
}

/**
 * PUT /v1/Entrada/CancelarReserva?idCompra=...
 */
export async function cancelarReserva(idCompra: string): Promise<void> {
  const token = await login();
  await apiClient.put("/v1/Entrada/CancelarReserva", null, {
    params: { idCompra },
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * GET /v1/Entrada/GetReservaActiva?idUsuario=...
 * Devuelve la reserva activa del usuario (si existe).
 */
export async function fetchReservaActiva(
  idUsuario: string
): Promise<ReservaActiva> {
  const token = await login();
  try {
    const { data } = await apiClient.get<any>("/v1/Entrada/GetReservaActiva", {
      params: { idUsuario },
      headers: { Authorization: `Bearer ${token}` },
    });
    return data ?? null;
  } catch (e: any) {
    // si devuelve 400 cuando no hay reserva, lo normalizamos a null
    if (e?.response?.status === 400 || e?.response?.status === 404) return null;
    throw e;
  }
}

/** =========================================================================
 *                 RESOLUCIÓN FLEXIBLE DE TIPOS POR NOMBRE
 *  ======================================================================= */

const norm = (s: string) =>
  (s || "")
    .normalize("NFD")
    // @ts-ignore - unicode property
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export type TipoCodes = {
  general: number;
  vip: number;
  earlyGeneral: number;
  earlyVip: number;
};

/**
 * Dado el listado de tipos, retorna los codes más probables.
 * Si tu backend usa otros nombres/códigos, pasámelos y lo dejo fijo.
 */
export async function resolveTipoCodes(): Promise<TipoCodes> {
  const tipos = await fetchTiposEntrada().catch(() => []);
  // Fallback por si GetTiposEntrada no existe
  if (!tipos.length) {
    return { general: 1, vip: 2, earlyGeneral: 3, earlyVip: 4 };
  }

  let general = 0,
    vip = 0,
    earlyGeneral = 0,
    earlyVip = 0;

  for (const t of tipos) {
    const n = norm(t.dsTipo);
    const isGeneral = /(^|\s)(general|comun|común)(\s|$)/.test(n);
    const isVip = /(^|\s)(vip|preferencial|premium)(\s|$)/.test(n);
    const isEarly = /early|anticipad|preventa|promo|promocional|tempran/.test(
      n
    );

    if (isEarly && isGeneral && !earlyGeneral) earlyGeneral = t.cdTipo;
    else if (isEarly && isVip && !earlyVip) earlyVip = t.cdTipo;
    else if (isGeneral && !general) general = t.cdTipo;
    else if (isVip && !vip) vip = t.cdTipo;
  }

  const fallback = (v: number, def: number) => (v > 0 ? v : def);

  return {
    general: fallback(general, 1),
    vip: fallback(vip, 2),
    earlyGeneral: fallback(earlyGeneral, 3),
    earlyVip: fallback(earlyVip, 4),
  };
}
