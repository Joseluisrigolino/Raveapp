// utils/entradas/entradaApi.ts
import { apiClient, login } from "@/utils/apiConfig";

/** ---------- Tipos de entrada ---------- */
export interface ApiTipoEntrada {
  cdTipo: number;
  dsTipo: string;
}

let _tiposCache: ApiTipoEntrada[] | null = null;
let _tipoMapCache: Map<number, string> | null = null;

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
  if (_tipoMapCache) return _tipoMapCache!;
  await fetchTiposEntrada();
  return _tipoMapCache ?? new Map();
}

/** ---------- Entradas por fecha ---------- */
export interface ApiEntradaFecha {
  idEntrada: string;
  idFecha: string;
  cdTipo: number;
  precio: number;
  stock?: number; // disponible actual
  maxPorUsuario?: number; // tope por usuario si aplica
}

export async function fetchEntradasByFecha(
  idFecha: string
): Promise<ApiEntradaFecha[]> {
  const token = await login();
  const { data } = await apiClient.get<any[]>("/v1/Entrada/GetEntradasFecha", {
    params: { IdFecha: idFecha },
    headers: { Authorization: `Bearer ${token}` },
  });

  return (Array.isArray(data) ? data : []).map((e: any) => ({
    idEntrada: String(e.idEntrada ?? e.id ?? ""),
    idFecha: String(e.idFecha ?? idFecha),
    cdTipo: Number(e.cdTipo ?? e.tipo ?? 0),
    precio: Number(e.precio ?? e.importe ?? 0),
    stock:
      typeof e.stock === "number"
        ? e.stock
        : typeof e.disponible === "number"
        ? e.disponible
        : undefined,
    maxPorUsuario:
      typeof e.maxPorUsuario === "number" ? e.maxPorUsuario : undefined,
  }));
}

/** ---------- Merge UI ---------- */
export interface UiEntrada extends ApiEntradaFecha {
  nombreTipo: string; // dsTipo
  maxCompra: number; // cantidad máxima (stock / tope / default)
}

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
 *                               CREACIÓN
 *  POST /v1/Entrada/CrearEntradas
 *  body:
 *  {
 *    "idFecha": "string",   // en tu backend: va el id del EVENTO
 *    "tipo": 0,
 *    "estado": 0,
 *    "precio": 0,
 *    "cantidad": 0
 *  }
 *  ======================================================================= */

export type CreateEntradaBody = {
  idFecha: string;
  tipo: number; // cdTipo
  estado: number;
  precio: number;
  cantidad: number;
};

export async function createEntrada(body: CreateEntradaBody): Promise<void> {
  const token = await login();
  await apiClient.post("/v1/Entrada/CrearEntradas", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Crea en serie varias entradas. Si alguna falla, lanza error con detalle.
 */
export async function createEntradasBulk(
  items: CreateEntradaBody[]
): Promise<void> {
  let lastErr: any = null;
  for (const it of items) {
    try {
      await createEntrada(it);
    } catch (e: any) {
      lastErr = e;
      // seguimos intentando las demás para no dejar todo a medias
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

/** ---------- Resolución flexible de tipos por nombre ---------- */
/**
 * Intenta mapear nombres a cdTipo según `dsTipo` que devuelva el backend.
 * Busca matches por normalización:
 *  - "general"    -> cdTipoGeneral
 *  - "vip"        -> cdTipoVip
 *  - "early"/"anticipada"/"preventa" + "general"/"vip"
 * Si no encuentra, usa fallback 1..4.
 */
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

  // Fallback ordenado
  const fallback = (v: number, def: number) => (v > 0 ? v : def);

  return {
    general: fallback(general, 1),
    vip: fallback(vip, 2),
    earlyGeneral: fallback(earlyGeneral, 3),
    earlyVip: fallback(earlyVip, 4),
  };
}
