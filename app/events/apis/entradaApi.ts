import { apiClient, login } from "@/app/apis/apiConfig";

/** =========================================================================
 *                               TIPOS
 *  ======================================================================= */

export interface ApiTipoEntrada {
  cdTipo: number;
  dsTipo: string;
}

export interface ApiEstadoEntrada {
  cdEstado: number;
  dsEstado: string | null;
}

export interface ApiEntradaFechaRaw {
  idEntrada: string | null;
  mdQR?: string | null;
  fecha?:
    | {
        idFecha: string;
        inicio?: string | null;
        fin?: string | null;
        inicioVenta?: string | null;
        finVenta?: string | null;
        estado?: number | null;
      }
    | null;
  estado?:
    | {
        cdEstado: number;
        dsEstado: string | null;
      }
    | null;
  precio: number;
  cantidad: number;
  tipo?:
    | {
        cdTipo: number;
        dsTipo: string;
      }
    | null;
}

export interface ApiEntradaFecha {
  idEntrada: string;
  idFecha: string;
  cdTipo: number;
  precio: number;
  stock?: number;
  maxPorUsuario?: number;
}

export interface UiEntrada extends ApiEntradaFecha {
  nombreTipo: string;
  maxCompra: number;
}

export type CreateEntradaBody = {
  idFecha: string;
  tipo: number;
  estado: number;
  precio: number;
  cantidad: number;
};

export type UpdateEntradaBody = {
  idFecha: string;
  precio: number;
  tipo: number;
};

export type ReservarEntradasBody = {
  entradas: Array<{ tipoEntrada: number; cantidad: number }>;
  idUsuario: string;
  idFecha: string;
};

export type ReservarEntradasResponse = {
  idCompra?: string;
  body?: any;
  [k: string]: any;
};

export type ReservaActiva =
  | {
      idCompra: string;
      idUsuario: string;
      idFecha: string;
      vencimiento?: string;
      items: Array<{
        tipoEntrada: number;
        cantidad: number;
        precio?: number;
      }>;
    }
  | null;

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
 *                 ENTRADAS POR FECHA (RAW + FLATTEN)
 *  ======================================================================= */

export async function fetchEntradasFechaRaw(
  idFecha: string,
  estado?: number
): Promise<ApiEntradaFechaRaw[]> {
  const token = await login();
  const { data } = await apiClient.get<ApiEntradaFechaRaw[]>(
    "/v1/Entrada/GetEntradasFecha",
    {
      params: {
        IdFecha: idFecha, // ojo: acá el back usa PascalCase en query
        ...(typeof estado === "number" ? { Estado: estado } : {}),
      },
      headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
    }
  );
  return Array.isArray(data) ? data : [];
}

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
      stock: undefined,
      maxPorUsuario: undefined,
    } as ApiEntradaFecha;
  });
}

/** =========================================================================
 *              SINCRONIZACIÓN / “FECHA LISTA” (POLLING CON RETRY)
 *  ======================================================================= */

export async function ensureFechaListo(
  idFecha: string,
  { tries = 6, delayMs = 400 }: { tries?: number; delayMs?: number } = {}
): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      // si responde 200 (aunque sea []), consideramos que la fecha ya es “visible”
      await fetchEntradasFechaRaw(idFecha);
      if (i > 0) console.log(`[ensureFechaListo] OK en intento ${i + 1}`);
      return;
    } catch (e: any) {
      const st = e?.response?.status;
      console.log(
        `[ensureFechaListo] intento ${i + 1}/${tries} fallo (status=${st}). Esperando ${delayMs}ms…`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  console.log("[ensureFechaListo] seguimos igual; continuamos con creación.");
}

/** =========================================================================
 *                                CREACIÓN
 *  - intenta camelCase y si falla, reintenta PascalCase
 *  - reintenta con backoff si 5xx
 *  ======================================================================= */

async function postCrearEntradasCamel(body: CreateEntradaBody) {
  const token = await login();
  return apiClient.post("/v1/Entrada/CrearEntradas", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "*/*",
    },
  });
}

async function postCrearEntradasPascal(body: CreateEntradaBody) {
  const token = await login();
  const pascal = {
    IdFecha: body.idFecha,
    Tipo: body.tipo,
    Estado: body.estado,
    Precio: body.precio,
    Cantidad: body.cantidad,
  };
  return apiClient.post("/v1/Entrada/CrearEntradas", pascal, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "*/*",
    },
  });
}

export async function createEntrada(body: CreateEntradaBody): Promise<void> {
  let lastErr: any = null;

  // hasta 2 intentos por formato (camel -> pascal)
  try {
    console.debug("[CrearEntrada] camelCase =>", body);
    await postCrearEntradasCamel(body);
    return;
  } catch (e) {
    lastErr = e;
    console.debug("[CrearEntrada] camelCase falló, probando PascalCase…");
  }

  try {
    await postCrearEntradasPascal(body);
    return;
  } catch (e) {
    lastErr = e;
  }

  // si llegó acá, falló ambos formatos
  const status = lastErr?.response?.status;
  const msg =
    lastErr?.response?.data?.message ||
    lastErr?.response?.data?.Message ||
    lastErr?.message ||
    "Error creando entrada.";
  throw Object.assign(new Error(msg), { status, payload: body });
}

/** Bulk con retry/backoff si 5xx */
export async function createEntradasBulk(
  items: CreateEntradaBody[]
): Promise<void> {
  let lastErr: any = null;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];

    // retry x3 con backoff si 5xx
    let ok = false;
    let attempt = 0;
    while (!ok && attempt < 3) {
      attempt++;
      try {
        await createEntrada(it);
        ok = true;
      } catch (e: any) {
        lastErr = e;
        const st = e?.status || e?.response?.status;
        const is5xx = st >= 500 && st < 600;
        console.log(
          `[createEntradasBulk] item #${i + 1} intento ${attempt} falló (status=${st})`
        );
        if (is5xx && attempt < 3) {
          const wait = 300 * attempt;
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        break;
      }
    }

    if (!ok) {
      const st = lastErr?.status || lastErr?.response?.status;
      const msg =
        lastErr?.response?.data?.message ||
        lastErr?.response?.data?.Message ||
        lastErr?.message ||
        "No se pudo crear la entrada.";
      throw new Error(
        `Fallo al crear la entrada #${i + 1}.\nHTTP POST /v1/Entrada/CrearEntradas\nStatus: ${st}\nPayload: ${JSON.stringify(
          it
        )}\nMensaje: ${msg}`
      );
    }
  }
}

/** =========================================================================
 *                                  UPDATE
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

export async function reservarEntradas(
  body: ReservarEntradasBody
): Promise<ReservarEntradasResponse> {
  const token = await login();
  // Basic validation: ensure there's at least one entrada with cantidad > 0
  try {
    if (!Array.isArray(body.entradas) || body.entradas.every((it) => Number(it.cantidad) <= 0)) {
      const msg = "[reservarEntradas] Invalid payload: all 'cantidad' are zero or missing";
      try {
        console.warn(msg, JSON.stringify(body));
      } catch {}
      // Throw a structured error so callers can handle it
      throw Object.assign(new Error(msg), { status: 400, payload: body });
    }
  } catch (vErr) {
    // If validation itself fails for any reason, just continue and let the request run
  }
  // Log request payload for debugging
  try {
    console.debug("[reservarEntradas] payload:", JSON.stringify(body));
  } catch {}

  // Helper de normalización del idCompra (con soporte a body string)
  const normalizeIdCompra = (data: any) => {
    try {
      // Si la API devuelve texto plano, intentar extraer idCompra del texto
      if (typeof data === "string") {
        const text = data as string;
        let extracted: string | undefined = undefined;
        // 1) etiqueta id compra
        const m1 = text.match(/id\s*compra[^A-Za-z0-9]*([A-Za-z0-9-]+)/i);
        if (m1 && m1[1]) extracted = String(m1[1]);
        // 2) UUID
        if (!extracted) {
          const m2 = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
          if (m2 && m2[0]) extracted = String(m2[0]);
        }
        // 3) número largo (6+ dígitos)
        if (!extracted) {
          const m3 = text.match(/\b\d{6,}\b/);
          if (m3 && m3[0]) extracted = String(m3[0]);
        }
        const obj: any = { body: text };
        if (extracted) obj.idCompra = extracted;
        return obj as ReservarEntradasResponse;
      }
      let bodyObj = (data as any)?.body ?? (data as any)?.Body;
      if (typeof bodyObj === "string") {
        try {
          bodyObj = JSON.parse(bodyObj);
        } catch {}
      }
      const maybeId = (data as any)?.idCompra
        ?? (data as any)?.IdCompra
        ?? (data as any)?.IDCOMPRA
        ?? (bodyObj as any)?.idCompra
        ?? (bodyObj as any)?.IdCompra
        ?? (bodyObj as any)?.IDCOMPRA;
      if (maybeId && typeof (data as any) === "object") {
        (data as any).idCompra = String(maybeId);
      }
      return data;
    } catch {
      return data;
    }
  };

  // Intento camelCase
  try {
    const resp = await apiClient.put<ReservarEntradasResponse>(
      "/v1/Entrada/ReservarEntradas",
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    try {
      console.debug("[reservarEntradas] response status:", (resp as any)?.status);
      console.debug("[reservarEntradas] response headers:", (resp as any)?.headers);
      console.debug("[reservarEntradas] response data:", JSON.stringify((resp as any)?.data));
    } catch {}
    return normalizeIdCompra((resp as any)?.data ?? {});
  } catch (e: any) {
    const st = e?.response?.status;
    try {
      console.warn("[reservarEntradas] camelCase error status:", st);
      console.warn("[reservarEntradas] camelCase error body:", JSON.stringify(e?.response?.data));
    } catch {}
    // Fallback con PascalCase solo si falló (p.ej. 400/415/422)
    if (st && st >= 400 && st < 500) {
      const pascal = {
        IdUsuario: body.idUsuario,
        IdFecha: body.idFecha,
        Entradas: body.entradas.map((it) => ({
          TipoEntrada: it.tipoEntrada,
          Cantidad: it.cantidad,
        })),
      } as any;
      try {
        console.debug("[reservarEntradas] intentando fallback PascalCase payload:", JSON.stringify(pascal));
      } catch {}
      const resp2 = await apiClient.put<ReservarEntradasResponse>(
        "/v1/Entrada/ReservarEntradas",
        pascal,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      try {
        console.debug("[reservarEntradas] fallback response status:", (resp2 as any)?.status);
        console.debug("[reservarEntradas] fallback response data:", JSON.stringify((resp2 as any)?.data));
      } catch {}
      return normalizeIdCompra((resp2 as any)?.data ?? {});
    }
    throw e;
  }
}

export async function cancelarReserva(idCompra: string): Promise<void> {
  const token = await login();
  await apiClient.put("/v1/Entrada/CancelarReserva", null, {
    params: { idCompra },
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchReservaActiva(
  idUsuario: string,
  { attempts = 3, delayMs = 500 }: { attempts?: number; delayMs?: number } = {}
): Promise<ReservaActiva> {
  const token = await login();

  // Try multiple times in case the reservation is not immediately visible due to propagation
  for (let i = 0; i < attempts; i++) {
    try {
      try {
        console.debug("[fetchReservaActiva] intentando petición", { idUsuario, attempt: i + 1 });
      } catch {}
      const { data, status } = await apiClient.get<any>("/v1/Entrada/GetReservaActiva", {
        params: { idUsuario },
        headers: { Authorization: `Bearer ${token}` },
      });
      try {
        console.debug("[fetchReservaActiva] status:", status, "data:", JSON.stringify(data));
      } catch {}

      // Si la API responde 400/404, no retry
      if (status === 400 || status === 404) return null;

      // Si viene data válida (obj con idCompra o items), retornamos
      if (data && (data.idCompra || Array.isArray(data.items) || Object.keys(data).length > 0)) return data;

      // Si no vino nada, y quedan intentos, esperar y reintentar
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      return data ?? null;
    } catch (e: any) {
      const st = e?.response?.status;
      try {
        console.warn("[fetchReservaActiva] intento fallo status:", st, "body:", JSON.stringify(e?.response?.data));
      } catch {}
      if (st === 400 || st === 404) return null;
      // Si no es un error terminal, retry si quedan intentos
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw e;
    }
  }

  return null;
}

/** =========================================================================
 *                                  PAGOS
 *  ======================================================================= */

export type CrearPagoBody = {
  idCompra: string;
  subtotal: number;
  cargoServicio: number;
  backUrl: string;
};

export type CrearPagoResponse = {
  idPago?: string;
  initPoint?: string;
  [k: string]: any;
};

export async function createPago(body: CrearPagoBody): Promise<CrearPagoResponse> {
  const token = await login();
  const { data } = await apiClient.post<CrearPagoResponse>("/v1/Pago/CrearPago", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return data ?? {};
}

/** =========================================================================
 *                         CONFIRMAR PAGO (MERCADO PAGO)
 *  Endpoint: POST /v1/Pago/PagoMP?IdPagoMP=<id>
 *  - El backend actualizará el estado de entradas automáticamente
 *  ==========================================================================
 */
export async function confirmarPagoMP(idPagoMP: string): Promise<void> {
  const token = await login();
  await apiClient.post("/v1/Pago/PagoMP", null, {
    params: { idPagoMP },
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Los métodos manuales de actualización de estado por compra/entrada se eliminaron;
// ahora el backend realiza el cambio de estado al confirmar el pago mediante PagoMP.

/** =========================================================================
 *                 RESOLUCIÓN DE CÓDIGOS DE TIPOS
 *  ======================================================================= */

const norm = (s: string) =>
  (s || "")
    .normalize("NFD")
    // @ts-ignore
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export type TipoCodes = {
  general: number; // 0
  earlyGeneral: number; // 1
  vip: number; // 2
  earlyVip: number; // 3
};

export async function resolveTipoCodes(): Promise<TipoCodes> {
  const tipos = await fetchTiposEntrada().catch(() => []);
  let codes: TipoCodes = { general: 0, earlyGeneral: 1, vip: 2, earlyVip: 3 };

  if (!Array.isArray(tipos) || !tipos.length) return codes;

  const byName = new Map<number, string>();
  for (const t of tipos) byName.set(t.cdTipo, norm(t.dsTipo));

  for (const [cd, n] of byName) {
    if (n === "general") codes.general = cd;
    else if (n === "general early bird") codes.earlyGeneral = cd;
    else if (n === "vip") codes.vip = cd;
    else if (n === "vip early bird") codes.earlyVip = cd;
  }

  console.log("[resolveTipoCodes] mapeo final:", codes, " (desde: ", tipos, ")");
  return codes;
}

/** =========================================================================
 *                     REPORTE: VENTAS POR EVENTO (OWNER)
 *  Endpoint: GET /v1/Reporte/ReporteVentasEvento
 *  Query: IdEvento, IdUsuarioOrg (ambos string UUID)
 *  ======================================================================= */

// Estructura flexible porque el contrato exacto del back puede variar.
// Intentamos cubrir los campos más probables y dejamos `any` para extras.
export type ReporteVentasItem = {
  tipo: string; // p.ej. "General", "VIP", "General Early Bird"
  cantidadInicial?: number;
  cantidadVendida?: number;
  precioUnitario?: number;
  cargoServicioUnitario?: number;
  subtotal?: number; // precioUnitario * cantidadVendida
  cargoServicio?: number; // cargoServicioUnitario * cantidadVendida
  total?: number; // subtotal + cargoServicio
  stock?: number; // cantidadInicial - cantidadVendida
  [k: string]: any;
};

export type ReporteVentasDia = {
  fecha: string; // etiqueta para UI (puede ser dd/mm/yyyy o idFecha)
  idFecha?: string; // para machear con fechas del evento
  numFecha?: number | string; // índice de fecha si viene
  items: ReporteVentasItem[];
  totalEntradasVendidas?: number;
  totalRecaudado?: number; // solo entradas
  totalCargoServicio?: number;
  [k: string]: any;
};

export type ReporteVentasEvento = {
  evento?: {
    idEvento?: string;
    nombre?: string;
    creadoPor?: string;
  } | null;
  generado?: string | null; // timestamp de generación
  dias: ReporteVentasDia[];
  totales?: {
    totalEntradasVendidas?: number;
    totalRecaudado?: number;
    totalCargoServicio?: number;
  } | null;
  [k: string]: any;
};

/** Llama al endpoint y retorna el body crudo. */
export async function fetchReporteVentasEventoRaw(
  idEvento: string,
  idUsuarioOrg: string
): Promise<any> {
  const token = await login();
  const { data } = await apiClient.get<any>("/v1/Reporte/ReporteVentasEvento", {
    params: { IdEvento: idEvento, IdUsuarioOrg: idUsuarioOrg },
    headers: { Authorization: `Bearer ${token}` },
  });
  return data ?? {};
}

/**
 * Normaliza el response en una estructura usable por la UI.
 * Soporta dos formatos comunes: agrupado por día con `items`,
 * o lista plana con propiedades { fecha, tipo, ... }.
 */
export function normalizeReporteVentasEvento(data: any): ReporteVentasEvento {
  if (!data) return { dias: [] };

  // Caso 1: ya viene con dias: []
  if (Array.isArray(data.dias)) {
    return {
      evento: data.evento ?? null,
      generado: data.generado ?? null,
      dias: data.dias as ReporteVentasDia[],
      totales: data.totales ?? null,
      ...data,
    } as ReporteVentasEvento;
  }

  // Caso 2: viene plano como array de registros
  const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  const byDate = new Map<string, ReporteVentasDia>();

  for (const r of list) {
    // Key de agrupación: preferimos idFecha, luego numFecha, luego fecha plana
    const idFecha = r.idFecha ? String(r.idFecha) : undefined;
    const numFecha = r.numFecha ?? r.nroFecha ?? r.numeroFecha;
    const fechaRaw = String(r.fecha || r.dia || r.date || idFecha || numFecha || "");
    const tipo = String(r.tipo || r.entrada || r.nombreTipo || r.dsTipo || "");
    const item: ReporteVentasItem = {
      tipo,
      cantidadInicial: num(r.cantidadInicial ?? r.stockInicial ?? r.cantidad ?? 0),
      cantidadVendida: num(r.cantidadVendida ?? r.vendida ?? r.vendidas ?? 0),
      precioUnitario: num(r.precioUnitario ?? r.precio ?? r.precioEntrada ?? 0),
      cargoServicioUnitario: num(r.cargoServicioUnitario ?? r.cargoServicioU ?? undefined),
      subtotal: num(r.subtotal ?? r.montoSubTotal),
      cargoServicio: num(r.cargoServicio ?? r.montoCostoServicio),
      total: num(r.total ?? r.montoVenta),
      stock: num(r.stock ?? r.restante ?? r.stockActual ?? undefined),
      ...r,
    };
    const key = fechaRaw || "";
    if (!byDate.has(key)) byDate.set(key, { fecha: key, idFecha, numFecha, items: [] });
    const d = byDate.get(key)!;
    // actualizamos meta si no estaba
    if (!d.idFecha && idFecha) d.idFecha = idFecha;
    if (typeof d.numFecha === "undefined" && typeof numFecha !== "undefined") d.numFecha = numFecha;
    d.items.push(item);
  }

  const dias = Array.from(byDate.values());
  return { dias } as ReporteVentasEvento;
}

function num(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Helper de alto nivel para la UI */
export async function fetchReporteVentasEvento(
  idEvento: string,
  idUsuarioOrg: string
): Promise<ReporteVentasEvento> {
  const raw = await fetchReporteVentasEventoRaw(idEvento, idUsuarioOrg);
  return normalizeReporteVentasEvento(raw);
}
