// src/utils/apiConfig.ts
import axios from "axios";

// La documentación de la API está en https://api.raveapp.com.ar/swagger/index.html
// y la URL base para las solicitudes es:
const API_BASE_URL = "https://api.raveapp.com.ar";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Función para obtener el token a partir de las credenciales (login)
export async function login() {
  const credentials = {
    usuario: "raveapp",
    pass: "RaveAppApi367..",
  };

  try {
    const response = await apiClient.post("/v1/Security/Login", credentials, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    // Supongamos que el token se encuentra en response.data.token.
    // Ajustá esto según lo que indique tu Swagger.
    return response.data.token;
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
}
