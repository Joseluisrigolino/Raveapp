// georefHelpers.ts

/**
 * Helpers para obtener datos de la API "georef" (datos.gob.ar).
 * Documentación: https://datos.gob.ar/ayuda/api-guias
 */

// --- Tipos básicos de dominio que usamos en la app ---

// Representa una provincia
interface Provincia {
  id: string;
  nombre: string;
}

// Representa un municipio
interface Municipio {
  id: string;
  nombre: string;
}

// Representa una localidad
interface Localidad {
  id: string;
  nombre: string;
}

// --- Tipos de la respuesta de la API georef ---
// Estos modelos siguen la estructura que devuelve la API oficial.

interface ProvinciasResponse {
  provincias: Provincia[]; // La API devuelve un array de provincias
}

// georefHelpers.ts

/**
 * Helpers para obtener datos de la API "georef" (datos.gob.ar).
 * Mantiene la misma API pública: fetchProvinces, fetchMunicipalities,
 * fetchLocalities, fetchLocalitiesByProvince, fetchLocalitiesByName.
 */

// --- Tipos básicos (internos) ---
interface Provincia {
  id: string;
  nombre: string;
}

interface Municipio {
  id: string;
  nombre: string;
}

interface Localidad {
  id: string;
  nombre: string;
}

interface ProvinciasResponse {
  provincias: Provincia[];
}

interface MunicipiosResponse {
  municipios: Municipio[];
}

interface LocalidadesResponse {
  localidades: Localidad[];
}

const GEOREF_BASE = "https://apis.datos.gob.ar/georef/api";

function buildUrl(path: string, params?: Record<string, string | number>) {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && String(v) !== "") {
        qs.append(k, String(v));
      }
    }
  }
  const qstr = qs.toString();
  return `${GEOREF_BASE}/${path}${qstr ? `?${qstr}` : ""}`;
}

export async function fetchProvinces(): Promise<Provincia[]> {
  const url = buildUrl("provincias", { campos: "id,nombre", max: 100 });

  const FALLBACK_PROVINCES: Provincia[] = [
    { id: "02", nombre: "Ciudad Autónoma de Buenos Aires" },
    { id: "06", nombre: "Buenos Aires" },
    { id: "10", nombre: "Catamarca" },
    { id: "14", nombre: "Córdoba" },
    { id: "18", nombre: "Corrientes" },
    { id: "22", nombre: "Chaco" },
    { id: "26", nombre: "Chubut" },
    { id: "30", nombre: "Entre Ríos" },
    { id: "34", nombre: "Formosa" },
    { id: "38", nombre: "Jujuy" },
    { id: "42", nombre: "La Pampa" },
    { id: "46", nombre: "La Rioja" },
    { id: "50", nombre: "Mendoza" },
    { id: "54", nombre: "Misiones" },
    { id: "58", nombre: "Neuquén" },
    { id: "62", nombre: "Río Negro" },
    { id: "66", nombre: "Salta" },
    { id: "70", nombre: "San Juan" },
    { id: "74", nombre: "San Luis" },
    { id: "78", nombre: "Santa Cruz" },
    { id: "82", nombre: "Santa Fe" },
    { id: "86", nombre: "Santiago del Estero" },
    { id: "90", nombre: "Tucumán" },
    {
      id: "94",
      nombre: "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
    },
  ];

  // Usamos AbortController aquí solo para esta llamada específica
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      console.warn(`[fetchProvinces] respuesta no OK ${res.status}. Usando fallback.`);
      return FALLBACK_PROVINCES;
    }

    const data: ProvinciasResponse = await res.json();
    const list = data?.provincias;
    if (!Array.isArray(list) || list.length === 0) {
      console.warn("[fetchProvinces] respuesta sin provincias válidas. Usando fallback.");
      return FALLBACK_PROVINCES;
    }

    return list;
  } catch (err: any) {
    const msg = (err && (err.name || err.message)) || String(err);
    console.warn(`[fetchProvinces] fallo: ${msg}. Usando fallback local.`);
    return FALLBACK_PROVINCES;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchMunicipalities(provinceId: string): Promise<Municipio[]> {
  const url = buildUrl("municipios", { provincia: provinceId, campos: "id,nombre", max: 500 });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al obtener municipios: ${res.status}`);
  const data: MunicipiosResponse = await res.json();
  return data.municipios || [];
}

export async function fetchLocalities(provinceId: string, municipalityId: string): Promise<Localidad[]> {
  const url = buildUrl("localidades", { provincia: provinceId, municipio: municipalityId, campos: "id,nombre", max: 500 });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al obtener localidades: ${res.status}`);
  const data: LocalidadesResponse = await res.json();
  return data.localidades || [];
}

export async function fetchLocalitiesByProvince(provinceId: string): Promise<Localidad[]> {
  const url = buildUrl("localidades", { provincia: provinceId, campos: "id,nombre", max: 1000 });

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[fetchLocalitiesByProvince] respuesta no OK: ${res.status} ${res.statusText} - ${url}`);
    throw new Error(`Error al obtener localidades por provincia: ${res.status}`);
  }
  const data: LocalidadesResponse = await res.json();
  return data.localidades || [];
}

export async function fetchLocalitiesByName(name: string): Promise<Localidad[]> {
  if (!name) return [];
  const url = buildUrl("localidades", { nombre: name, max: 10 });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al buscar localidades: ${res.status}`);
  const data: LocalidadesResponse = await res.json();
  return data.localidades || [];
}

function ExpoRouterNoRoute() {
  return null;
}

export default ExpoRouterNoRoute;

