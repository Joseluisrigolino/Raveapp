// georefHelpers.ts

/**
 * Helpers para obtener datos de la API "georef" (datos.gob.ar).
 * Documentación: https://datos.gob.ar/ayuda/api-guias
 *
 * Ejemplos de endpoints usados:
 * - Provincias:
 *   GET https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre
 * - Municipios:
 *   GET https://apis.datos.gob.ar/georef/api/municipios?provincia={idProv}&campos=id,nombre
 * - Localidades:
 *   GET https://apis.datos.gob.ar/georef/api/localidades?municipio={idMun}&provincia={idProv}&campos=id,nombre
 */

// --- Tipos básicos de dominio que usamos en la app ---

// Representa una provincia (versión simplificada: solo id y nombre)
interface Provincia {
  id: string;
  nombre: string;
}

// Representa un municipio (id y nombre)
interface Municipio {
  id: string;
  nombre: string;
}

// Representa una localidad (id y nombre)
interface Localidad {
  id: string;
  nombre: string;
}

// --- Tipos de la respuesta de la API georef ---
// Estos modelos siguen la estructura que devuelve la API oficial.

interface ProvinciasResponse {
  provincias: Provincia[]; // La API devuelve un array de provincias
}

interface MunicipiosResponse {
  municipios: Municipio[]; // La API devuelve un array de municipios
}

interface LocalidadesResponse {
  localidades: Localidad[]; // La API devuelve un array de localidades
}

/**
 * Helper interno para hacer un fetch con timeout.
 * Si el servidor no responde dentro del tiempo indicado, aborta la petición.
 *
 * @param input URL o RequestInfo del fetch
 * @param timeoutMs tiempo máximo en milisegundos
 */
async function fetchWithTimeout(
  input: RequestInfo | URL,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController(); // Controlador para poder abortar el fetch
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // Si pasa el tiempo, aborta

  try {
    // Ejecutamos el fetch pasando la señal del AbortController
    const response = await fetch(input, { signal: controller.signal });
    return response;
  } finally {
    // Siempre limpiamos el timeout, haya ido bien o mal
    clearTimeout(timeoutId);
  }
}

/**
 * Devuelve la lista de provincias (id, nombre) desde la API oficial.
 * Si la API está caída, lenta o responde mal, usa un FALBACK local.
 */
export async function fetchProvinces(): Promise<Provincia[]> {
  // Endpoint de provincias con campos mínimos y un límite de resultados
  const url =
    "https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre&max=100";

  // Fallback local para pruebas cuando la API está caída/lenta
  // Esto asegura que la app siga funcionando con una lista razonable de provincias.
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

  try {
    // Intento principal: usamos fetch con timeout de 5 segundos
    const res = await fetchWithTimeout(url, 5000);

    // Si la respuesta no es "ok", usamos el fallback local
    if (!res.ok) {
      console.warn(
        `[fetchProvinces] respuesta no OK ${res.status}. Usando fallback local.`
      );
      return FALLBACK_PROVINCES;
    }

    // Parseamos el JSON tipado como ProvinciasResponse
    const data: ProvinciasResponse = await res.json();

    const list = data?.provincias; // Extraemos el array de provincias

    // Si la lista no es válida o viene vacía, usamos el fallback
    if (!Array.isArray(list) || list.length === 0) {
      console.warn(
        "[fetchProvinces] respuesta sin provincias válidas. Usando fallback local."
      );
      return FALLBACK_PROVINCES;
    }

    // Caso feliz: devolvemos la lista de provincias de la API
    return list;
  } catch (err: any) {
    // Cualquier error de red, timeout, etc. se loguea y se devuelve el fallback
    const msg = (err && (err.name || err.message)) || String(err);
    console.warn(`[fetchProvinces] fallo: ${msg}. Usando fallback local.`);
    return FALLBACK_PROVINCES;
  }
}

/**
 * Dada la id de una provincia (p. ej. "06" para Buenos Aires),
 * retorna los municipios correspondientes.
 *
 * @param provinceId string con el ID de la provincia (ej: "06")
 */
export async function fetchMunicipalities(
  provinceId: string
): Promise<Municipio[]> {
  // Construimos la URL con la provincia codificada en la query string
  const url = `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(
    provinceId
  )}&campos=id,nombre&max=500`;

  // Hacemos el request a la API sin timeout especial (usa el del ambiente)
  const res = await fetch(url);

  // Si la respuesta no es OK, lanzamos error para que lo maneje la capa superior
  if (!res.ok) {
    throw new Error(`Error al obtener municipios: ${res.status}`);
  }

  // Parseamos el JSON tipado como MunicipiosResponse
  const data: MunicipiosResponse = await res.json();

  // Devuelve { municipios: [{ id, nombre }, ...], ... }
  return data.municipios || [];
}

/**
 * Dada la id de la provincia y la id del municipio,
 * retorna las localidades correspondientes.
 *
 * @param provinceId string con el ID de la provincia
 * @param municipalityId string con el ID del municipio
 */
export async function fetchLocalities(
  provinceId: string,
  municipalityId: string
): Promise<Localidad[]> {
  // Construimos la URL con provincia y municipio codificados
  const url = `https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(
    provinceId
  )}&municipio=${encodeURIComponent(municipalityId)}&campos=id,nombre&max=500`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Error al obtener localidades: ${res.status}`);
  }

  // Parseamos el JSON tipado como LocalidadesResponse
  const data: LocalidadesResponse = await res.json();

  // Devuelve { localidades: [{ id, nombre }, ...], ... }
  return data.localidades || [];
}

/**
 * Obtiene localidades únicamente por provincia (sin filtrar por municipio).
 * Útil, por ejemplo, para Ciudad Autónoma de Buenos Aires donde se quiere
 * listar todas las localidades de la capital independientemente del municipio.
 *
 * @param provinceId string con el ID de la provincia (ej: "02" para CABA)
 */
export async function fetchLocalitiesByProvince(
  provinceId: string
): Promise<Localidad[]> {
  // No transformamos el id: la API espera el formato ya normalizado (ej: "02").
  const prov = provinceId;

  // Armamos la URL codificando el ID de provincia por seguridad
  const url = `https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(
    prov
  )}&campos=id,nombre&max=1000`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      // Logueamos info extra para debugging (status y url)
      console.warn(
        `[fetchLocalitiesByProvince] respuesta no OK: ${res.status} ${res.statusText} - ${url}`
      );
      throw new Error(
        `Error al obtener localidades por provincia: ${res.status}`
      );
    }

    const data: LocalidadesResponse = await res.json();

    // Si la API no trae "localidades", devolvemos array vacío para no romper el flujo
    return data.localidades || [];
  } catch (err) {
    console.warn("[fetchLocalitiesByProvince] fallo fetch:", err, "url:", url);
    // Re-lanzamos el error para que la capa que llama pueda decidir qué hacer
    throw err;
  }
}

/**
 * Busca localidades por nombre parcial (ej. "Corrien") en la API georef.
 * Ejemplo:
 *   GET https://apis.datos.gob.ar/georef/api/localidades?nombre=Corrien&max=10
 *
 * @param name Nombre parcial a buscar (ej: "Corrien" para "Corrientes")
 */
export async function fetchLocalitiesByName(
  name: string
): Promise<Localidad[]> {
  // Si no hay texto de búsqueda, devolvemos un array vacío directamente
  if (!name) return [];

  const url = `https://apis.datos.gob.ar/georef/api/localidades?nombre=${encodeURIComponent(
    name
  )}&max=10`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Error al buscar localidades: ${res.status}`);
  }

  const data: LocalidadesResponse = await res.json();

  // Si no hay localidades, devolvemos array vacío para que el UI lo maneje tranquilo
  return data.localidades || [];
}

// --- Expo Router: este módulo NO es una pantalla/ruta ---
// Export default inofensivo para evitar el warning de expo-router,
// ya que el archivo está dentro de la carpeta "app" pero no define una pantalla.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ExpoRouterNoRoute() {
  // Componente "dummy" que nunca se usa en la UI.
  // Sólo existe para que Expo Router acepte este archivo sin warnings.
  return null;
}

// Export default requerido por Expo Router para no levantar warnings
export default ExpoRouterNoRoute;
