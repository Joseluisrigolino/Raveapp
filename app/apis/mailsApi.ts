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
  const { data } = await apiClient.post(endpoint, body, {
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return data;
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
    recoveryUrl = "https://raveapp.com.ar/restablecer-contrasena",
  } = params || {};
  if (!to || !name) throw new Error("Faltan datos: to, name");
  return postEmail("/v1/Email/EnviarRecuperarContrasena", {
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
  buildCancellationEmailBody,
};
