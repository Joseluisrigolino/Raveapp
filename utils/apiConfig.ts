// src/utils/apiConfig.ts
import axios from 'axios';

const API_BASE_URL = 'http://144.22.158.49:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Función para obtener el token a partir de las credenciales (login)
export async function login() {
  const credentials = {
    usuario: 'raveapp',
    pass: 'RaveAppApi367..',
  };

  try {
    const response = await apiClient.post('/v1/Security/Login', credentials, {
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
    });
    // Supongamos que el token se encuentra en response.data.token.
    // Ajusta esto según lo que indique tu Swagger.
    return response.data.token;
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}
