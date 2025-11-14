import { apiClient, login } from "@/app/apis/apiConfig";
import { formatAxiosError } from "@/utils/httpError";

// Request payload for PUT /v1/Entrada/ControlarEntrada
export interface ControlarEntradaRequest {
  idEntrada: string;
  mdQr: string;
}

// Raw API response is not yet defined in Swagger for this project.
// Keep it flexible but provide a small normalized helper below if needed.
export type ControlarEntradaResponse = any;

/**
 * PUT /v1/Entrada/ControlarEntrada
 * Body: { idEntrada: string, mdQr: string }
 * Returns: raw API response (typed as unknown/any until contract stabilizes)
 */
export async function controlarEntrada(
  payload: ControlarEntradaRequest
): Promise<ControlarEntradaResponse> {
  const token = await login();
  try {
    const resp = await apiClient.put("/v1/Entrada/ControlarEntrada", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });
    return resp.data;
  } catch (err) {
    // Log enriched error for easier troubleshooting and rethrow
    try {
      console.error(
        "[ScannerApi] ControlarEntrada error:\n" + formatAxiosError(err)
      );
    } catch {}
    throw err;
  }
}

// --- Expo Router: este módulo NO es una pantalla/ruta ---
// Agregamos un export default inofensivo para evitar el warning de expo-router.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ExpoRouterNoRoute() {
  return null;
}
export default ExpoRouterNoRoute;
