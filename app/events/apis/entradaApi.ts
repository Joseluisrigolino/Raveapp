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

// Caches simples en memoria (nombres en inglés)
let typesCache: ApiTipoEntrada[] | null = null;
let typeMapCache: Map<number, string> | null = null;

let statesCache: ApiEstadoEntrada[] | null = null;
let stateMapCache: Map<number, string> | null = null;

/** =========================================================================
 *                           ENDPOINTS: TIPOS
 *  ======================================================================= */

export async function fetchTiposEntrada(): Promise<ApiTipoEntrada[]> {
  try {
    if (typesCache) return typesCache;
    const token = await login().catch(() => null);
    const { data } = await apiClient.get<ApiTipoEntrada[]>(
      "/v1/Entrada/GetTiposEntrada",
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    );
    typesCache = Array.isArray(data) ? data : [];
    typeMapCache = new Map(typesCache.map((t) => [t.cdTipo, t.dsTipo]));
    return typesCache;
  } catch {
    typesCache = [];
    typeMapCache = new Map();
    return [];
  }
}

export async function getTipoMap(): Promise<Map<number, string>> {
  if (typeMapCache) return typeMapCache;
  await fetchTiposEntrada();
  return typeMapCache ?? new Map();
}

/** =========================================================================
 *                         ENDPOINTS: ESTADOS
 *  ======================================================================= */

export async function fetchEstadosEntrada(): Promise<ApiEstadoEntrada[]> {
  try {
    if (statesCache) return statesCache;
    const token = await login().catch(() => null);
    const { data } = await apiClient.get<ApiEstadoEntrada[]>(
      "/v1/Entrada/GetEstadosEntrada",
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    );
    statesCache = Array.isArray(data) ? data : [];
    stateMapCache = new Map(
      statesCache.map((e) => [
        e.cdEstado,
        e.dsEstado ?? `Estado ${e.cdEstado}`,
      ])
    );
    return statesCache;
  } catch {
    statesCache = [];
    stateMapCache = new Map();
    return [];
  }
}

export async function getEstadoMap(): Promise<Map<number, string>> {
  if (stateMapCache) return stateMapCache;
  await fetchEstadosEntrada();
  return stateMapCache ?? new Map();
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
      return;
    } catch (e: any) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
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
    await postCrearEntradasCamel(body);
    return;
  } catch (e) {
    lastErr = e;
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
  // Validación simple: al menos una entrada con cantidad > 0
  if (!Array.isArray(body.entradas) || body.entradas.every((it) => Number(it.cantidad) <= 0)) {
    const msg = "Payload inválido: 'cantidad' es cero o falta en todas las entradas";
    throw Object.assign(new Error(msg), { status: 400, payload: body });
  }

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
    return normalizeIdCompra((resp as any)?.data ?? {});
  } catch (e: any) {
    const st = e?.response?.status;
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
      const { data, status } = await apiClient.get<any>("/v1/Entrada/GetReservaActiva", {
        params: { idUsuario },
        headers: { Authorization: `Bearer ${token}` },
      });

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
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } as const;

  // Algunos backends esperan el parámetro en PascalCase (IdPagoMP) o como payment_id.
  const queryVariants: Array<Record<string, any>> = [
    { IdPagoMP: idPagoMP },
    { idPagoMP },
    { payment_id: idPagoMP },
  ];
  const bodyVariants: Array<Record<string, any> | null> = [
    null,
    { IdPagoMP: idPagoMP },
    { idPagoMP },
    { payment_id: idPagoMP },
  ];

  const attempts: Array<() => Promise<any>> = [];

  const pushPost = (url: string) => {
    for (const body of bodyVariants) {
      attempts.push(() => apiClient.post(url, body, { headers, params: undefined }));
    }
    for (const params of queryVariants) {
      attempts.push(() => apiClient.post(url, null, { headers, params }));
    }
  };
  const pushGet = (url: string) => {
    for (const params of queryVariants) {
      attempts.push(() => apiClient.get(url, { headers, params }));
    }
  };

  // Endpoint principal y variantes comunes
  pushPost("/v1/Pago/PagoMP");
  pushGet("/v1/Pago/PagoMP");
  pushPost("/v1/Pago/ConfirmarPagoMP");
  pushGet("/v1/Pago/ConfirmarPagoMP");
  pushPost("/v1/Pago/ConfirmarMP");
  pushGet("/v1/Pago/ConfirmarMP");
  pushPost("/v1/Pago/Confirmar");
  pushGet("/v1/Pago/Confirmar");
  // Algunos back usan Callback/Notificación
  pushPost("/v1/Pago/CallbackMP");
  pushGet("/v1/Pago/CallbackMP");

  let lastErr: any = null;
  for (const fn of attempts) {
    try {
      const resp = await fn();
      // Consideramos 2xx como éxito; el backend debería actualizar estados
      const status = (resp as any)?.status ?? 200;
      if (status >= 200 && status < 300) return;
    } catch (err: any) {
      lastErr = err;
      continue;
    }
  }
  throw lastErr || new Error("No se pudo confirmar el pago con Mercado Pago.");
}

// Los métodos manuales de actualización de estado por compra/entrada se eliminaron;
// ahora el backend realiza el cambio de estado al confirmar el pago mediante PagoMP.

/** =========================================================================
 *                               REEMBOLSOS
 *  - POST /v1/Pago/Reembolso?idCompra=<id>
 *  - POST /v1/Pago/ReembolsoMasivo?idEvento=<id>
 *  Tolerante a variantes de casing y método (POST/GET) según backend.
 *  ======================================================================= */

export type ReembolsoResponse = { ok: boolean; data?: any; mensaje?: string };

/** Solicita reembolso por una compra específica. */
export async function solicitarReembolso(idCompra: string): Promise<ReembolsoResponse> {
  const token = await login();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } as const;

  const queryVariants: Array<Record<string, any>> = [
    { idCompra },
    { IdCompra: idCompra },
    { id_compra: idCompra },
    { IDCOMPRA: idCompra },
    { compraId: idCompra },
  ];
  const bodyVariants: Array<Record<string, any> | null> = [
    null,
    { idCompra },
    { IdCompra: idCompra },
    { compraId: idCompra },
    { IDCOMPRA: idCompra },
  ];

  const attempts: Array<() => Promise<any>> = [];

  const pushPost = (url: string) => {
    for (const q of queryVariants) {
      attempts.push(() => apiClient.post(url, null, { params: q, headers }));
      for (const b of bodyVariants) {
        attempts.push(() => apiClient.post(url, b, { params: q, headers }));
      }
    }
  };
  const pushGet = (url: string) => {
    for (const q of queryVariants) {
      attempts.push(() => apiClient.get(url, { params: q, headers }));
    }
  };
  const pushPut = (url: string) => {
    for (const q of queryVariants) {
      for (const b of bodyVariants) {
        attempts.push(() => apiClient.put(url, b, { params: q, headers }));
      }
    }
  };
  const pushPathVariants = (base: string) => {
    // /v1/Pago/Reembolso/{id}
    attempts.push(() => apiClient.post(`${base}/${encodeURIComponent(idCompra)}`, null, { headers }));
    attempts.push(() => apiClient.get(`${base}/${encodeURIComponent(idCompra)}`, { headers }));
    attempts.push(() => apiClient.put(`${base}/${encodeURIComponent(idCompra)}`, { idCompra }, { headers }));
  };

  pushPost("/v1/Pago/Reembolso");
  pushGet("/v1/Pago/Reembolso");
  pushPut("/v1/Pago/Reembolso");

  // variantes adicionales observadas en implementaciones de backend
  pushPost("/v1/Pago/SolicitarReembolso");
  pushGet("/v1/Pago/SolicitarReembolso");
  pushPut("/v1/Pago/SolicitarReembolso");
  pushPost("/v1/Pago/ReembolsoCompra");
  pushGet("/v1/Pago/ReembolsoCompra");
  pushPut("/v1/Pago/ReembolsoCompra");
  pushPathVariants("/v1/Pago/Reembolso");
  pushPathVariants("/v1/Pago/SolicitarReembolso");

  // Variantes adicionales comunes en APIs similares
  pushPost("/v1/Compra/Reembolso");
  pushGet("/v1/Compra/Reembolso");
  pushPut("/v1/Compra/Reembolso");
  pushPathVariants("/v1/Compra/Reembolso");

  pushPost("/v1/Compra/CancelarCompra");
  pushGet("/v1/Compra/CancelarCompra");
  pushPut("/v1/Compra/CancelarCompra");
  pushPathVariants("/v1/Compra/CancelarCompra");

  pushPost("/v1/Entrada/CancelarCompra");
  pushGet("/v1/Entrada/CancelarCompra");
  pushPut("/v1/Entrada/CancelarCompra");
  pushPathVariants("/v1/Entrada/CancelarCompra");

  pushPost("/v1/Pago/Refund");
  pushGet("/v1/Pago/Refund");
  pushPut("/v1/Pago/Refund");
  pushPathVariants("/v1/Pago/Refund");

  pushPost("/v1/Pago/Devolucion");
  pushGet("/v1/Pago/Devolucion");
  pushPut("/v1/Pago/Devolucion");
  pushPathVariants("/v1/Pago/Devolucion");

  pushPost("/v1/Pago/Reembolsar");
  pushGet("/v1/Pago/Reembolsar");
  pushPut("/v1/Pago/Reembolsar");
  pushPathVariants("/v1/Pago/Reembolsar");

  let lastErr: any = null;
  for (const fn of attempts) {
    try {
      const { data } = await fn();
      return { ok: true, data };
    } catch (e: any) {
      lastErr = e;
      continue;
    }
  }
  const mensajeBase =
    lastErr?.response?.data?.message ||
    lastErr?.response?.data?.Message ||
    lastErr?.message ||
    "No se pudo solicitar el reembolso.";
  const status = lastErr?.response?.status;
  const mensajeDetallado = `${mensajeBase}`;
  // Afinar explicación en 404: puede ser compra inexistente o endpoint no implementado
  if ((status ?? 0) === 404) {
    return {
      ok: false,
      mensaje:
        `No se pudo solicitar el reembolso. El servidor respondió 404.
Posibles causas:
• La compra ${idCompra} no existe o no está paga.
• El endpoint de reembolso no está disponible en este entorno.
• La compra pertenece a otro entorno/tenant.
Detalle: ${mensajeDetallado}`,
    };
  }
  return { ok: false, mensaje: mensajeDetallado };
}

/** Solicita reembolso masivo por evento. */
export async function solicitarReembolsoMasivo(idEvento: string): Promise<ReembolsoResponse> {
  const token = await login();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } as const;

  const queryVariants: Array<Record<string, any>> = [
    { idEvento },
    { IdEvento: idEvento },
    { id_evento: idEvento },
  ];
  const bodyVariants: Array<Record<string, any> | null> = [
    null,
    { idEvento },
    { IdEvento: idEvento },
  ];

  const attempts: Array<() => Promise<any>> = [];
  const pushPost = (url: string) => {
    for (const q of queryVariants) {
      attempts.push(() => apiClient.post(url, null, { params: q, headers }));
      for (const b of bodyVariants) {
        attempts.push(() => apiClient.post(url, b, { params: q, headers }));
      }
    }
  };
  const pushGet = (url: string) => {
    for (const q of queryVariants) {
      attempts.push(() => apiClient.get(url, { params: q, headers }));
    }
  };

  pushPost("/v1/Pago/ReembolsoMasivo");
  pushGet("/v1/Pago/ReembolsoMasivo");

  let lastErr: any = null;
  for (const fn of attempts) {
    try {
      const { data } = await fn();
      return { ok: true, data };
    } catch (e: any) {
      lastErr = e;
      continue;
    }
  }
  const mensaje =
    lastErr?.response?.data?.message ||
    lastErr?.response?.data?.Message ||
    lastErr?.message ||
    "No se pudo solicitar el reembolso masivo.";
  return { ok: false, mensaje };
}

/** =========================================================================
 *                 RESOLUCIÓN DE CÓDIGOS DE TIPOS
 *  ======================================================================= */

// Normaliza texto para comparar sin acentos y en minúsculas
const norm = (text: string) =>
  (text || "")
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
