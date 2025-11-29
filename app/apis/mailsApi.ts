// app/apis/mailsApi.ts

import { apiClient, login } from "@/app/apis/apiClient"; // Cliente HTTP y login root de la API

// ----------------------
// Tipos de datos públicos
// ----------------------

// Datos que se usan para el template de confirmación de email
export interface ConfirmEmailTemplateData {
  name: string;             // Nombre del destinatario
  confirmationUrl: string;  // URL de confirmación (link que el usuario va a clickear)
}

// Datos que se usan para el template de recuperación de contraseña
export interface RecoveryEmailTemplateData {
  name: string;        // Nombre del destinatario
  recoveryUrl: string; // URL para restablecer contraseña
}

// Estructura base de un mail genérico que se envía desde la app
export interface GenericEmailRequest {
  to: string;          // Destinatario (correo)
  titulo: string;      // Asunto / título del mail
  cuerpo: string;      // Cuerpo del mail (puede ser HTML)
  botonUrl?: string;   // URL opcional de un botón en el mail
  botonTexto?: string; // Texto opcional del botón
}

// Por ahora no conocemos la forma exacta de la respuesta del backend de mails,
// así que usamos un tipo genérico que puede ser cualquier cosa.
type EmailApiResponse = unknown;

// ----------------------
// Helper genérico de POST
// ----------------------

/**
 * Helper genérico para hacer POST contra los endpoints de Email.
 * - Obtiene un token vía login root.
 * - Arma los headers (incluyendo Authorization si hay token).
 * - Loguea la request para debugging.
 * - En caso de error, adjunta información útil para diagnosticar.
 *
 * @param endpoint Ruta relativa del endpoint de email (ej: "/v1/Email/EnvioMailGenerico")
 * @param body Cuerpo JSON que se envía al backend
 */
async function postEmail<T = EmailApiResponse>(
  endpoint: string,
  body: unknown
): Promise<T> {
  // Intentamos obtener el token root.
  // Si falla el login, seguimos sin Authorization para no bloquear completamente el uso.
  const token = await login().catch(() => null);

  try {
    // Construimos la URL absoluta solo para usar en los logs (debugging).
    // Tomamos la baseURL de apiClient y nos aseguramos de que no termine con "/".
    const baseUrl = apiClient.defaults.baseURL?.replace(/\/$/, "") || "";
    const url = `${baseUrl}${endpoint}`;

    // Armamos los headers comunes
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "*/*",
      // Si tenemos token, agregamos el Authorization.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Bloque de logging para ayudar cuando el backend responde mal (ej: 404, 500)
    try {
      // Enmascaramos el token en el log para no exponerlo completo
      const maskedToken = token ? `***(${String(token).length} chars)` : null;

      // eslint-disable-next-line no-console
      console.debug(
        "POST email ->",
        url,
        body,
        token ? `(with token ${maskedToken})` : "(no token)"
      );
      // eslint-disable-next-line no-console
      console.debug("Request headers ->", Object.keys(headers));
    } catch {
      // Si por algún motivo falla el console.debug, lo ignoramos.
    }

    // Hacemos el POST usando el apiClient configurado (timeout, baseURL, etc.)
    const { data } = await apiClient.post<T>(endpoint, body, { headers });

    // Devolvemos la data tal cual como viene del backend
    return data;
  } catch (err: any) {
    // Si hay error, intentamos enriquecerlo con más info para debugging
    try {
      // eslint-disable-next-line no-console
      console.error("postEmail error status:", err?.response?.status);
      // eslint-disable-next-line no-console
      console.error("postEmail response data:", err?.response?.data);
      // eslint-disable-next-line no-console
      console.error(
        "failed request config:",
        err?.config && {
          url: err.config.url,
          method: err.config.method,
          data: err.config.data,
        }
      );
    } catch {
      // Si falla el logging, lo ignoramos.
    }

    // Si el error viene con respuesta HTTP (Axios error con response)
    if (err?.response) {
      const status = err.response.status;
      const respData = err.response.data;
      const message = `postEmail failed ${status}: ${JSON.stringify(respData)}`;

      // Creamos un Error más descriptivo
      const enrichedError = new Error(message);

      // Adjuntamos info adicional en el objeto de error (fuera de typing estricto)
      // para que la capa superior pueda usar estos datos si lo necesita.
      // @ts-ignore attach details
      enrichedError.status = status;
      // @ts-ignore
      enrichedError.responseData = respData;

      throw enrichedError;
    }

    // Si no hay response (error de red, timeout, etc.), re-lanzamos tal cual
    throw err;
  }
}

// ----------------------
// Funciones públicas de envío de mails
// ----------------------

/**
 * Envía un mail de confirmación de email al usuario.
 * Usa un template específico en el backend.
 */
export async function sendConfirmEmail(params: {
  to: string;
  name: string;
  confirmationUrl: string;
}): Promise<EmailApiResponse> {
  const { to, name, confirmationUrl } = params || {};

  // Validamos datos mínimos requeridos
  if (!to || !name || !confirmationUrl) {
    throw new Error("Faltan datos: to, name, confirmationUrl");
  }

  // Llamamos al endpoint de confirmación en backend
  return postEmail("/v1/Email/EnviarConfirmarEmail", {
    to,
    templateData: { name, confirmationUrl },
  });
}

/**
 * Envía un mail de recuperación de contraseña.
 * Si no se provee recoveryUrl, se usa una URL por defecto al entorno DEV.
 */
export async function sendPasswordRecoveryEmail(params: {
  to: string;
  name: string;
  recoveryUrl?: string;
}): Promise<EmailApiResponse> {
  const {
    to,
    name,
    recoveryUrl = "https://dev.raveapp.com.ar/restablecer-contrasena",
  } = params || {};

  // Validamos datos mínimos requeridos
  if (!to || !name) {
    throw new Error("Faltan datos: to, name");
  }

  // Llamamos al endpoint de recuperación de contraseña
  return postEmail("/v1/Email/EnviarPassRecoveryEmail", {
    to,
    templateData: { name, recoveryUrl },
  });
}

/**
 * Envía un correo genérico (custom) a un solo destinatario.
 * Útil para comunicaciones puntuales que no usan un template fijo.
 */
export async function sendGenericEmail(
  payload: GenericEmailRequest
): Promise<EmailApiResponse> {
  const { to, titulo, cuerpo, botonUrl, botonTexto } = payload || {};

  // Validamos datos mínimos requeridos
  if (!to || !titulo || !cuerpo) {
    throw new Error("Faltan datos: to, titulo, cuerpo");
  }

  // Llamamos al endpoint genérico de envío de mail
  return postEmail("/v1/Email/EnvioMailGenerico", {
    to,
    titulo,
    cuerpo,
    botonUrl: botonUrl ?? "",
    botonTexto: botonTexto ?? "",
  });
}

/**
 * Envía un mail genérico masivo a todos los compradores de un evento
 * (por ejemplo, en caso de cancelación).
 */
export async function sendMassCancellationEmail(payload: {
  idEvento: string;
  titulo: string;
  cuerpo: string;
  botonUrl?: string;
  botonTexto?: string;
}): Promise<EmailApiResponse> {
  const { idEvento, titulo, cuerpo, botonUrl, botonTexto } = payload || {};

  // Validamos datos mínimos requeridos
  if (!idEvento || !titulo || !cuerpo) {
    throw new Error("Faltan datos: idEvento, titulo, cuerpo");
  }

  // Endpoint definido en backend para envío masivo genérico
  return postEmail("/v1/Email/EnvioMailGenericoMasivo", {
    idEvento,
    titulo,
    cuerpo,
    botonUrl: botonUrl ?? "",
    botonTexto: botonTexto ?? "",
  });
}

/**
 * Envía un mail masivo a todos los compradores de un evento cuando
 * hay una modificación importante (cambio de fecha, lugar, etc.).
 * Arma el título y el cuerpo automáticamente en base al nombre del evento.
 */
export async function sendMassiveEventUpdateEmail(params: {
  idEvento: string;
  nombreEvento: string;
}): Promise<EmailApiResponse> {
  const { idEvento, nombreEvento } = params || {};

  if (!idEvento || !nombreEvento) {
    throw new Error("Faltan datos: idEvento, nombreEvento");
  }

  // Armamos título y cuerpo por defecto
  const titulo = `Modificación en el evento ${nombreEvento}`;

  const cuerpo = `Estimados: hubo una modificación en los detalles del evento <b>${nombreEvento}</b>.<br><br>
Por dicho motivo, si lo desean, pueden solicitar un reembolso de su entrada dentro de los 5 días corridos desde la percepción de este correo.<br><br>
El reembolso de la/s entrada/s lo podés solicitar ingresando a la aplicación de RaveApp &gt; Tickets &gt; Mis entradas &gt; Seleccionar la entrada correspondiente al evento &gt; Botón de arrepentimiento.<br><br>
Atentamente,`;

  // Envío masivo usando el mismo endpoint genérico masivo
  return postEmail("/v1/Email/EnvioMailGenericoMasivo", {
    idEvento,
    titulo,
    cuerpo,
    botonUrl: "",
    botonTexto: "",
  });
}

// ----------------------
// Helper para armar cuerpo de mail de cancelación
// ----------------------

/**
 * Construye el título y cuerpo HTML de un mail de cancelación de entradas.
 * No envía el mail, solo arma el contenido para luego ser usado en sendGenericEmail o masivo.
 */
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

  // Formateamos la fecha de compra a dd/mm/yyyy si es una fecha válida
  const fechaFmt = (() => {
    const d = new Date(fechaCompra);
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}/${d.getFullYear()}`;
    }
    // Si no es una fecha válida, devolvemos tal cual el valor original
    return String(fechaCompra);
  })();

  // Formateamos el importe en formato local (es-AR)
  const importeStr = `$ ${
    typeof importeReembolsado === "number"
      ? importeReembolsado.toLocaleString("es-AR")
      : String(importeReembolsado)
  }`;

  // Título alineado a la semántica del mail de cancelación
  const titulo = `Cancelación de entradas a evento ${nombreEvento}`;

  // Si tenemos número de operación de MercadoPago, armamos un bloque HTML
  const operacionHtml = numeroOperacionMP
    ? `<p>Número de operación de MercadoPago: ${numeroOperacionMP}</p>`
    : "";

  // Cuerpo en HTML del mail de cancelación
  const cuerpo = `
<p>Estimado ${nombreUsuario},</p>
<p>
Has cancelado tu/s entrada/s al evento <strong>${nombreEvento}</strong> por un importe de <strong>${importeStr}</strong>,
que habías adquirido el día ${fechaFmt}.<br>
Dicho importe se te ha reembolsado al medio de pago que hayas utilizado en MercadoPago y lo verás acreditado dentro de los 7 días hábiles.
</p>
${operacionHtml}
<p>Atentamente,</p>
`.trim();

  return { titulo, cuerpo };
}

// ----------------------
// Objeto agrupador (fachada)
// ----------------------

export const mailsApi = {
  sendConfirmEmail,
  sendPasswordRecoveryEmail,
  sendGenericEmail,
  sendMassCancellationEmail,
  sendMassiveEventUpdateEmail,
  buildCancellationEmailBody,
};

// --- Expo Router: este módulo NO es una pantalla/ruta ---
// Export default inofensivo para evitar el warning de expo-router,
// ya que el archivo está dentro de la carpeta "app" pero no define una pantalla.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ExpoRouterNoRoute() {
  // Componente dummy que nunca se usa en la navegación.
  return null;
}

export default ExpoRouterNoRoute;
