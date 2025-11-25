import axios from "axios";

// Base URL de tu API
const API_BASE_URL = "https://dev.api.raveapp.com.ar";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Aumentamos timeout para operaciones de upload en mobile
  timeout: 30000,
});

// Función para obtener el “root” token que autoriza las demás llamadas
export async function login(): Promise<string> {
  const credentials = {
    usuario: "raveapp",
    pass: "RaveAppApi367..",
  };

  const response = await apiClient.post(
    "/v1/Security/Login",
    credentials,
    {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    }
  );

  // Ajustá esto si tu Swagger lo llama distinto
  return response.data.token;
}

// --- Expo Router: este módulo NO es una pantalla/ruta ---
// Agregamos un export default inofensivo para evitar el warning de expo-router.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ExpoRouterNoRoute() { return null; }
export default ExpoRouterNoRoute;
