import { apiClient, login } from "@/utils/apiConfig";

export type Party = {
  idFiesta: string;
  nombre: string;
  isActivo: boolean;
};

/* -------- helpers -------- */
function lowerize(obj: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (!obj || typeof obj !== "object") return out;
  for (const k of Object.keys(obj)) out[k.toLowerCase()] = (obj as any)[k];
  return out;
}

function extractArray(data: any): any[] {
  if (!data) return [];
  // Lo que devuelve tu swagger:
  if (Array.isArray((data as any).fiestas)) return (data as any).fiestas;
  if (Array.isArray((data as any).Fiestas)) return (data as any).Fiestas;

  // fallback
  for (const k of Object.keys(data)) {
    const v = (data as any)[k];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(data) ? data : [];
}

function normalizeParty(raw: any): Party {
  const base = lowerize(raw);
  // soporta anidado tipo { Fiesta: {...} }
  const nested =
    base.fiesta && typeof base.fiesta === "object"
      ? lowerize(base.fiesta)
      : {};
  const m = { ...base, ...nested };

  const id =
    m.idfiesta ?? m.id ?? m.fiestaid ?? m.id_evento ?? m.idevento ?? "";

  // ⚠️ acá agregamos dsnombre
  const nameRaw =
    m.nombre ??
    m.dsnombre ?? // <-- dsNombre
    m.ds_nombre ??
    m.titulo ??
    m.descripcion ??
    m.dsfiesta ??
    m.name ??
    "";

  const nombre =
    typeof nameRaw === "string"
      ? nameRaw.trim()
      : nameRaw != null
      ? String(nameRaw)
      : "";

  const isActivo =
    m.isactivo === true ||
    m.isactivo === 1 ||
    m.activo === true ||
    m.activo === 1 ||
    false;

  return {
    idFiesta: String(id),
    nombre,
    isActivo,
  };
}

/* -------- API -------- */
export async function getPartiesByUser(idUsuario: string): Promise<Party[]> {
  const token = await login();
  try {
    const resp = await apiClient.get("/v1/Fiesta/GetFiestas", {
      headers: { Authorization: `Bearer ${token}` },
      params: { IdUsuario: idUsuario },
    });
    const list = extractArray(resp.data).map(normalizeParty);
    return list.filter((x) => x.idFiesta);
  } catch (e) {
    console.warn("[getPartiesByUser] error -> []", e);
    return [];
  }
}

export async function getPartyById(idFiesta: string): Promise<Party | null> {
  const token = await login();
  try {
    const resp = await apiClient.get("/v1/Fiesta/GetFiestas", {
      headers: { Authorization: `Bearer ${token}` },
      params: { IdFiesta: idFiesta },
    });
    const arr = extractArray(resp.data).map(normalizeParty);
    return arr[0] ?? null;
  } catch (e) {
    console.warn("[getPartyById] error -> null", e);
    return null;
  }
}

export async function createParty(args: {
  idUsuario: string;
  nombre: string;
  isActivo?: boolean;
}): Promise<void> {
  const token = await login();
  const body = {
    idUsuario: args.idUsuario,
    nombre: args.nombre,
    isActivo: args.isActivo ?? true,
  };
  await apiClient.post("/v1/Fiesta/CrearFiesta", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function updateParty(args: {
  idFiesta: string;
  nombre: string;
}): Promise<void> {
  const token = await login();
  const body = { idFiesta: args.idFiesta, nombre: args.nombre };
  await apiClient.put("/v1/Fiesta/UpdateFiesta", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function deleteParty(idFiesta: string): Promise<void> {
  const token = await login();
  await apiClient.delete("/v1/Fiesta/DeleteFiesta", {
    headers: { Authorization: `Bearer ${token}` },
    params: { id: idFiesta },
  });
}
