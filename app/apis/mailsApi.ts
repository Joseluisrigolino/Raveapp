// utils/mails/mailsApi.ts (simplificado)
import { apiClient, login } from "@/app/apis/apiConfig";

// Tipos
export interface ConfirmEmailTemplateData {
  name: string;
  confirmationUrl: string;
}
export interface RecoveryEmailTemplateData {
  name: string;
  recoveryUrl: string;
}
export interface GenericEmailRequest {
  to: string;
  titulo: string;
  cuerpo: string;
  botonUrl?: string;
  botonTexto?: string;
}

// Helper genérico para POST
async function postEmail<T = any>(endpoint: string, body: any): Promise<T> {
  const token = await login().catch(() => null);
  try {
    const url = `${apiClient.defaults.baseURL?.replace(/\/$/, "") || ""}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      Accept: "*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as Record<string, string>;
    // Log request for easier debugging when backend returns 404
    try {
      // Mask token for logs
      const maskedToken = token ? `***(${String(token).length} chars)` : null;
      // eslint-disable-next-line no-console
      console.debug("POST email ->", url, body, token ? `(with token ${maskedToken})` : "(no token)");
      // eslint-disable-next-line no-console
      console.debug("Request headers ->", Object.keys(headers));
    } catch {}

    const { data } = await apiClient.post(endpoint, body, { headers });
    return data;
  } catch (err: any) {
    // Enriquecer el error con detalles de respuesta para debugging
    try {
      // eslint-disable-next-line no-console
      console.error("postEmail error status:", err?.response?.status);
      // eslint-disable-next-line no-console
      console.error("postEmail response data:", err?.response?.data);
      // eslint-disable-next-line no-console
      console.error("failed request config:", err?.config && { url: err.config.url, method: err.config.method, data: err.config.data });
    } catch {}
    if (err?.response) {
      const status = err.response.status;
      const respData = err.response.data;
      const message = `postEmail failed ${status}: ${JSON.stringify(respData)}`;
      const e = new Error(message);
      // @ts-ignore attach details
      e.status = status;
      // @ts-ignore
      e.responseData = respData;
      throw e;
    }
    throw err;
  }
}

// Confirmación de email
export async function sendConfirmEmail(params: {
  to: string;
  name: string;
  confirmationUrl: string;
}): Promise<any> {
  const { to, name, confirmationUrl } = params || {};
  if (!to || !name || !confirmationUrl)
    throw new Error("Faltan datos: to, name, confirmationUrl");
  return postEmail("/v1/Email/EnviarConfirmarEmail", {
    to,
    templateData: { name, confirmationUrl },
  });
}
// Variante raw manteniendo compatibilidad

// Recuperación de contraseña
export async function sendPasswordRecoveryEmail(params: {
  to: string;
  name: string;
  recoveryUrl?: string;
}): Promise<any> {
  const {
    to,
    name,
    recoveryUrl = "https://dev.raveapp.com.ar/restablecer-contrasena",
  } = params || {};
  if (!to || !name) throw new Error("Faltan datos: to, name");
  return postEmail("/v1/Email/EnviarPassRecoveryEmail", {
    to,
    templateData: { name, recoveryUrl },
  });
}

// Correo genérico
export async function sendGenericEmail(
  payload: GenericEmailRequest
): Promise<any> {
  if (!payload?.to || !payload?.titulo || !payload?.cuerpo)
    throw new Error("Faltan datos: to, titulo, cuerpo");
  return postEmail("/v1/Email/EnvioMailGenerico", {
    to: payload.to,
    titulo: payload.titulo,
    cuerpo: payload.cuerpo,
    botonUrl: payload.botonUrl ?? "",
    botonTexto: payload.botonTexto ?? "",
  });
}

// Envío masivo de mails de cancelación para un evento (a todos los compradores)
export async function sendMassCancellationEmail(payload: {
  idEvento: string;
  titulo: string;
  cuerpo: string;
  botonUrl?: string;
  botonTexto?: string;
}): Promise<any> {
  if (!payload?.idEvento || !payload?.titulo || !payload?.cuerpo)
    throw new Error("Faltan datos: idEvento, titulo, cuerpo");

  // Endpoint correcto en backend para envío masivo genérico.
  return postEmail("/v1/Email/EnvioMailGenericoMasivo", {
    idEvento: payload.idEvento,
    titulo: payload.titulo,
    cuerpo: payload.cuerpo,
    botonUrl: payload.botonUrl ?? "",
    botonTexto: payload.botonTexto ?? "",
  });
}

// Cuerpo de cancelación
export function buildCancellationEmailBody(params: {
  nombreUsuario: string;
  nombreEvento: string;
  importeReembolsado: number;
  fechaCompra: Date | string;
  numeroOperacionMP?: string;
}): { titulo: string; cuerpo: string } {
  const {
    nombreUsuario,
    nombreEvento,
    importeReembolsado,
    fechaCompra,
    numeroOperacionMP = "",
  } = params;

  const fechaFmt = (() => {
    const d = new Date(fechaCompra);
    if (!isNaN(d.getTime()))
      return `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}/${d.getFullYear()}`;
    return String(fechaCompra);
  })();

  const importeStr = `$ ${
    typeof importeReembolsado === "number"
      ? importeReembolsado.toLocaleString("es-AR")
      : String(importeReembolsado)
  }`;

  // Título alineado al ejemplo de tu compañero
  const titulo = `Cancelación de entradas a evento ${nombreEvento}`;

  // Cuerpo en HTML, como en el ejemplo compartido
  const operacionHtml = numeroOperacionMP
    ? `<p>Número de operación de MercadoPago: ${numeroOperacionMP}</p>`
    : "";

  const cuerpo = `
<p>Estimado ${nombreUsuario},</p>
<p>
Has cancelado tu/s entrada/s al evento <strong>${nombreEvento}</strong> por un importe de <strong>${importeStr}</strong>,
que habías adquirido el día ${fechaFmt}.<br>
Dicho importe se te ha reembolsado al medio de pago que hayas utilizado en MercadoPago y lo verás acreditado dentro de los 7 días hábiles.
</p>
${operacionHtml}
<p>Atentamente,
`.trim();

  return { titulo, cuerpo };
}

export const mailsApi = {
  sendConfirmEmail,
  sendPasswordRecoveryEmail,
  sendGenericEmail,
  sendMassCancellationEmail,
  buildCancellationEmailBody,
};
