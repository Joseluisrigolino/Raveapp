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
 * Devuelve la lista de provincias (id, nombre).
 */
export async function fetchProvinces(): Promise<Provincia[]> {
  const url =
    "https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre&max=100";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error al obtener provincias: ${res.status}`);
  }
  const data = await res.json();
  // La API devuelve algo como { provincias: [{ id, nombre }, ...], ... }
  return data.provincias;
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
