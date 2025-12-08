// app/apis/apiClient.ts
import axios from "axios"; // Cliente HTTP para llamar a la API

// -----------------------------------------------------------------------------
// Configuración de la API desde variables de entorno (Expo)
// -----------------------------------------------------------------------------
// En Expo, las variables que se usan en el código del cliente tienen que
// empezar con EXPO_PUBLIC_ para que se inyecten en el bundle.
// -----------------------------------------------------------------------------

const ENV = String(process.env.EXPO_PUBLIC_API_ENV ?? "prd").toLowerCase();
// IS_PRD es true cuando ENV === 'prd'
const IS_PRD = ENV === "dev";

// Valores por defecto seguros cuando las env no están presentes en el bundle
const DEFAULT_PRD = "https://api.raveapp.com.ar";
const DEFAULT_DEV = "https://dev.api.raveapp.com.ar";

// Selección de baseURL con fallback hardcodeado si la env no está definida
const API_BASE_URL = IS_PRD
  ? process.env.EXPO_PUBLIC_API_BASE_URL_PRD || DEFAULT_PRD
  : process.env.EXPO_PUBLIC_API_BASE_URL_DEV || DEFAULT_DEV;

// No hacemos throw al importar el módulo: si por alguna razón no hay URL
// (caso extremo), logueamos el problema y permitimos que la app siga
// cargando; los errores reales se verán cuando se intente hacer requests.
if (!API_BASE_URL) {
  try {
    console.error(
      `[apiClient] No se encontró API_BASE_URL para el entorno "${ENV}". ` +
        "Revisá EXPO_PUBLIC_API_BASE_URL_DEV/PRD en tu .env o en la configuración de EAS."
    );
  } catch {}
}

// Log de depuración en modo desarrollo
if (typeof __DEV__ !== "undefined" && __DEV__) {
  try {
    // eslint-disable-next-line no-console
    console.log("[apiClient] ENV DEBUG", {
      ENV,
      IS_PRD,
      API_BASE_URL,
      DEV_URL: process.env.EXPO_PUBLIC_API_BASE_URL_DEV,
      PRD_URL: process.env.EXPO_PUBLIC_API_BASE_URL_PRD,
    });
  } catch {}
}

// Tipo de las credenciales que usa el login de la API
type LoginCredentials = {
  usuario: string; // Nombre de usuario que espera el backend
  pass: string;    // Password que espera el backend
};

// Tipo esperado de la respuesta del endpoint de login
interface LoginResponse {
  token: string; // La API devuelve un token que usamos para autorizar el resto de las llamadas
}

// Instancia de Axios configurada para nuestra API
export const apiClient = axios.create({
  baseURL: API_BASE_URL, // Todas las llamadas van a partir de esta URL base
  timeout: 30000,        // Timeout de 30 segundos (útil en mobile)
});

// Login "root" contra la API: devuelve el token de autenticación
export async function login(): Promise<string> {
  // Leemos usuario y pass según el entorno actual
  const usuario = IS_PRD
    ? process.env.EXPO_PUBLIC_API_ROOT_USER_PRD
    : process.env.EXPO_PUBLIC_API_ROOT_USER_DEV;

  const pass = IS_PRD
    ? process.env.EXPO_PUBLIC_API_ROOT_PASS_PRD
    : process.env.EXPO_PUBLIC_API_ROOT_PASS_DEV;

  if (!usuario || !pass) {
    throw new Error(
      `[apiClient.login] Faltan credenciales para el entorno "${ENV}". ` +
        "Revisá EXPO_PUBLIC_API_ROOT_USER_DEV/PRD y EXPO_PUBLIC_API_ROOT_PASS_DEV/PRD."
    );
  }

  const credentials: LoginCredentials = { usuario, pass };

  // POST al endpoint de login usando el apiClient configurado arriba
  const response = await apiClient.post<LoginResponse>(
    "/v1/Security/Login", // Endpoint del login según el backend
    credentials,          // Body de la request: las credenciales
    {
      headers: {
        "Content-Type": "application/json", // Enviamos JSON
        accept: "*/*",                      // Aceptamos cualquier tipo de respuesta
      },
    }
  );

  // Devolvemos únicamente el token de la respuesta
  return response.data.token;
}

// --- Expo Router: este módulo NO es una pantalla/ruta ---
// Como este archivo está dentro de la carpeta "app", Expo Router lo interpreta
// como una ruta/pantalla. Para evitar warnings, exportamos un default "inofensivo".

function ExpoRouterNoRoute() {
  // Componente vacío que no se va a usar nunca como pantalla.
  // Sólo existe para cumplir con la convención de Expo Router.
  return null;
}

// Export default requerido por Expo Router para no levantar warnings
export default ExpoRouterNoRoute;
