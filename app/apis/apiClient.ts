import axios from "axios"; // Importamos Axios para hacer llamadas HTTP

// URL base de la API (ambiente DEV en este caso)
const API_BASE_URL = "https://dev.api.raveapp.com.ar";

// Definimos el tipo de las credenciales que usa el login de la API
type LoginCredentials = {
  usuario: string; // Nombre de usuario que espera el backend
  pass: string;    // Password que espera el backend
};

// Definimos el tipo esperado de la respuesta del endpoint de login
interface LoginResponse {
  token: string; // La API devuelve un token que usamos para autorizar el resto de las llamadas
  // Si en un futuro la API devolviera más cosas (expiración, roles, etc.),
  // se pueden ir agregando campos acá.
}

// Creamos una instancia de Axios configurada para nuestra API
export const apiClient = axios.create({
  baseURL: API_BASE_URL, // Todas las llamadas van a partir de esta URL base
  timeout: 30000,        // Timeout de 30 segundos (útil en mobile, sobre todo en uploads o redes lentas)
});

// Función que hace el login "root" contra la API y devuelve el token de autenticación
export async function login(): Promise<string> {
  // Armamos el objeto de credenciales con el formato que espera la API
  // NOTA: en producción lo ideal sería leer esto desde variables de entorno,
  // no dejarlo hardcodeado en el código.
  const credentials: LoginCredentials = {
    usuario: "raveapp",
    pass: "RaveAppApi367..",
  };

  // Hacemos un POST al endpoint de login usando el apiClient configurado arriba
  const response = await apiClient.post<LoginResponse>(
    "/v1/Security/Login", // Endpoint del login según el backend
    credentials,          // Body de la request: las credenciales
    {
      headers: {
        "Content-Type": "application/json", // Indicamos que enviamos JSON
        accept: "*/*",                      // Aceptamos cualquier tipo de respuesta
      },
    }
  );

  // Devolvemos únicamente el token de la respuesta
  // Si el backend cambia el nombre de este campo, habría que ajustarlo acá.
  return response.data.token;
}

// --- Expo Router: este módulo NO es una pantalla/ruta ---
// Como este archivo está dentro de la carpeta "app", Expo Router lo interpreta
// como una ruta/pantalla. Para evitar warnings, exportamos un default "inofensivo".

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ExpoRouterNoRoute() {
  // Componente vacío que no se va a usar nunca como pantalla.
  // Sólo existe para cumplir con la convención de Expo Router.
  return null;
}

// Export default requerido por Expo Router para no levantar warnings
export default ExpoRouterNoRoute;
