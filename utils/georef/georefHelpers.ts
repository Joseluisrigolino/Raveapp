// georefHelpers.ts

/**
 * Helper para obtener datos de la API "georef" (datos.gob.ar).
 * Documentación: https://datos.gob.ar/ayuda/api-guias
 *
 * Ejemplo de endpoints:
 * - Provincias:     GET https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre
 * - Municipios:     GET https://apis.datos.gob.ar/georef/api/municipios?provincia={idProv}&campos=id,nombre
 * - Localidades:    GET https://apis.datos.gob.ar/georef/api/localidades?municipio={idMun}&provincia={idProv}&campos=id,nombre
 */

/** Estructura simplificada de la respuesta */
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

/**
 * Devuelve la lista de provincias (id, nombre) desde la API oficial.
 * Si falla, lanza error para que el caller decida cómo manejarlo.
 */
export async function fetchProvinces(): Promise<Provincia[]> {
  const url =
    "https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre&max=100";

  // Fallback local para pruebas cuando la API está caída/lenta
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

  const fetchWithTimeout = (input: RequestInfo | URL, ms: number) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return fetch(input, { signal: controller.signal }).finally(() =>
      clearTimeout(id)
    );
  };

  try {
    // Intento principal con timeout de 5s
    const res = await fetchWithTimeout(url, 5000);
    if (!res.ok) {
      console.warn(
        `[fetchProvinces] respuesta no OK ${res.status}. Usando fallback local.`
      );
      return FALLBACK_PROVINCES;
    }
    const data = await res.json();
    const list = data?.provincias;
    if (!Array.isArray(list) || list.length === 0) {
      console.warn(
        "[fetchProvinces] respuesta sin provincias válidas. Usando fallback local."
      );
      return FALLBACK_PROVINCES;
    }
    return list as Provincia[];
  } catch (err: any) {
    const msg = (err && (err.name || err.message)) || String(err);
    console.warn(`[fetchProvinces] fallo: ${msg}. Usando fallback local.`);
    return FALLBACK_PROVINCES;
  }
}

/**
 * Dada la id de una provincia (p. ej. "06" para Buenos Aires),
 * retorna los municipios correspondientes.
 * @param provinceId string con el ID de la provincia (ej: "06")
 */
export async function fetchMunicipalities(
  provinceId: string
): Promise<Municipio[]> {
  const url = `https://apis.datos.gob.ar/georef/api/municipios?provincia=${provinceId}&campos=id,nombre&max=500`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error al obtener municipios: ${res.status}`);
  }
  const data = await res.json();
  // Devuelve { municipios: [{ id, nombre }, ...], ... }
  return data.municipios;
}

/**
 * Dada la id de la provincia y la id del municipio,
 * retorna las localidades correspondientes.
 * @param provinceId string con el ID de la provincia
 * @param municipalityId string con el ID del municipio
 */
export async function fetchLocalities(
  provinceId: string,
  municipalityId: string
): Promise<Localidad[]> {
  const url = `https://apis.datos.gob.ar/georef/api/localidades?provincia=${provinceId}&municipio=${municipalityId}&campos=id,nombre&max=500`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error al obtener localidades: ${res.status}`);
  }
  const data = await res.json();
  // Devuelve { localidades: [{ id, nombre }, ...], ... }
  return data.localidades;
}

/**
 * Obtiene localidades únicamente por provincia (sin filtrar por municipio).
 * Útil para Ciudad Autónoma de Buenos Aires donde se quiere listar todas las
 * localidades de la capital independientemente del municipio.
 */
export async function fetchLocalitiesByProvince(
  provinceId: string
): Promise<Localidad[]> {
  // No normalizamos el id: la API espera el formato tal como lo provee la fuente (ej. '02' para CABA).
  const prov = provinceId;

  const url = `https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(
    prov
  )}&campos=id,nombre&max=1000`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // loguear para ayudar al debugging (status y url)
      console.warn(`[fetchLocalitiesByProvince] respuesta no OK: ${res.status} ${res.statusText} - ${url}`);
      throw new Error(`Error al obtener localidades por provincia: ${res.status}`);
    }
    const data = await res.json();
    return data.localidades || [];
  } catch (err) {
    console.warn('[fetchLocalitiesByProvince] fallo fetch:', err, 'url:', url);
    throw err;
  }
}

/**
 * Busca localidades por nombre parcial (ej. "Corrien") en la API georef.
 * Ejemplo: GET https://apis.datos.gob.ar/georef/api/localidades?nombre=Corrien&max=10
 */
export async function fetchLocalitiesByName(
  name: string
): Promise<Localidad[]> {
  if (!name) return [];
  const url = `https://apis.datos.gob.ar/georef/api/localidades?nombre=${encodeURIComponent(
    name
  )}&max=10`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error al buscar localidades: ${res.status}`);
  }
  const data = await res.json();
  // Devuelve { localidades: [{ id, nombre }, ...], ... }
  return data.localidades || [];
}
