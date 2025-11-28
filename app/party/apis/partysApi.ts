// app/party/apis/partysApi.ts
import { apiClient, login } from "@/app/apis/apiConfig";

export type Party = {
  idFiesta: string;
  nombre: string;
  isActivo: boolean;
  ratingAvg?: number | null;
  reviewsCount?: number | null;
};

// Mapea un item crudo de la API al modelo Party que usamos en el front
function mapParty(raw: any): Party {
  const id = raw.idFiesta ?? raw.id ?? "";

  const nameSource =
    raw.nombre ??
    raw.dsNombre ??
    raw.ds_nombre ??
    raw.titulo ??
    raw.descripcion ??
    raw.dsfiesta ??
    "";

  const nombre =
    typeof nameSource === "string"
      ? nameSource.trim()
      : nameSource != null
      ? String(nameSource)
      : "";

  const isActivo =
    raw.isActivo === true ||
    raw.isActivo === 1 ||
    raw.activo === true ||
    raw.activo === 1 ||
    false;

  const ratingAvg =
    raw.ratingAvg != null
      ? Number(raw.ratingAvg)
      : raw.promedio != null
      ? Number(raw.promedio)
      : null;

  const reviewsCount =
    raw.reviewsCount != null
      ? Number(raw.reviewsCount)
      : raw.cantidad != null
      ? Number(raw.cantidad)
      : null;

  return {
    idFiesta: String(id),
    nombre,
    isActivo,
    ratingAvg,
    reviewsCount,
  };
}

// Obtiene el array de fiestas desde el shape de la API
function getPartyArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data.fiestas)) return data.fiestas;
  if (Array.isArray(data.Fiestas)) return data.Fiestas;
  if (Array.isArray(data)) return data;
  return [];
}

/* ========= API ========= */

export async function getPartiesByUser(idUsuario: string): Promise<Party[]> {
  const token = await login();

  try {
    const resp = await apiClient.get("/v1/Fiesta/GetFiestas", {
      headers: { Authorization: `Bearer ${token}` },
      params: { IdUsuario: idUsuario },
    });

    const rawList = getPartyArray(resp.data);
    return rawList.map(mapParty).filter((p) => p.idFiesta);
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

    const rawList = getPartyArray(resp.data);
    const mapped = rawList.map(mapParty);
    return mapped[0] ?? null;
  } catch (e) {
    console.warn("[getPartyById] error -> null", e);
    return null;
  }
}

export async function createParty(args: {
  idUsuario: string;
  nombre: string;
  isActivo?: boolean;
}): Promise<string | null> {
  const token = await login();

  try {
    const resp = await apiClient.post(
      "/v1/Fiesta/CrearFiesta",
      {
        idUsuario: args.idUsuario,
        nombre: args.nombre,
        isActivo: args.isActivo ?? true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = resp?.data ?? {};

    // Prefer the common simple shapes
    if (data && (data.idFiesta || data.IdFiesta)) return String(data.idFiesta ?? data.IdFiesta);
    if (data && (data.id || data.Id)) return String(data.id ?? data.Id);
    // Sometimes nested under data
    if (data?.data && (data.data.idFiesta || data.data.IdFiesta)) return String(data.data.idFiesta ?? data.data.IdFiesta);
    if (data?.data && (data.data.id || data.data.Id)) return String(data.data.id ?? data.data.Id);

    // If the API returned an array/object with the created party, map and return its id
    try {
      const arr = getPartyArray(data);
      if (arr && arr.length) {
        const mapped = mapParty(arr[0]);
        if (mapped && mapped.idFiesta) return mapped.idFiesta;
      }
    } catch {}

    return null;
  } catch (e) {
    console.warn("[createParty] error", e);
    return null;
  }
}

export async function updateParty(args: {
  idFiesta: string;
  nombre?: string;
  isActivo?: boolean;
}): Promise<void> {
  const token = await login();

  await apiClient.put(
    "/v1/Fiesta/UpdateFiesta",
    {
      idFiesta: args.idFiesta,
      nombre: args.nombre,
      isActivo: args.isActivo,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function deleteParty(idFiesta: string): Promise<void> {
  const token = await login();

  await apiClient.delete("/v1/Fiesta/DeleteFiesta", {
    headers: { Authorization: `Bearer ${token}` },
    params: { id: idFiesta },
  });
}
