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
    _tipoMapCache = new Map(_tiposCache.map(t => [t.cdTipo, t.dsTipo]));
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
  stock?: number;         // disponible actual
  maxPorUsuario?: number; // tope por usuario si aplica
}

export async function fetchEntradasByFecha(idFecha: string): Promise<ApiEntradaFecha[]> {
  const token = await login();
  const { data } = await apiClient.get<any[]>(
    "/v1/Entrada/GetEntradasFecha",
    {
      params: { IdFecha: idFecha },
      headers: { Authorization: `Bearer ${token}` },
    }
  );

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
  nombreTipo: string;   // dsTipo
  maxCompra: number;    // cantidad máxima que se puede seleccionar (stock / tope / default)
}

export function mergeEntradasConTipos(
  entradas: ApiEntradaFecha[],
  tipoMap: Map<number, string>,
  defaultMax: number = 10
): UiEntrada[] {
  return entradas.map(e => {
    const nombreTipo = tipoMap.get(e.cdTipo) ?? `Tipo ${e.cdTipo}`;
    const maxCompra =
      (typeof e.maxPorUsuario === "number" && e.maxPorUsuario > 0)
        ? e.maxPorUsuario
        : (typeof e.stock === "number" && e.stock > 0)
          ? e.stock
          : defaultMax;

    return { ...e, nombreTipo, maxCompra };
  });
}
