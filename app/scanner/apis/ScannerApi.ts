// src/app/scanner/apis/ScannerApi.ts
import { apiClient, login } from "@/app/apis/apiClient";

export type ControlarEntradaPayload = {
  idEntrada: string;
  mdQr: string;
};

export type ControlarEntradaResult = {
  valido: boolean;
  mensaje: string;
  raw: any;
};

/**
 * PUT /v1/Entrada/ControlarEntrada
 * Body: { idEntrada, mdQr }
 */
export async function controlarEntrada(
  payload: ControlarEntradaPayload
): Promise<ControlarEntradaResult> {
  const token = await login();

  const resp = await apiClient.put("/v1/Entrada/ControlarEntrada", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = resp.data ?? {};

  return {
    valido: Boolean(data.valido ?? data.isValid ?? data.ok),
    mensaje:
      data.mensaje ??
      data.message ??
      data.status ??
      (data.valido ? "Entrada válida" : "Entrada inválida"),
    raw: data,
  };
}
