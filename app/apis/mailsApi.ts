// app/apis/mailsApi.ts

import { apiClient, login } from "@/app/apis/apiClient"; // Cliente HTTP y login root de la API

// ----------------------
// Tipos locales (no exportados)
// ----------------------
// Las interfaces públicas reutilizables ya existen en `interfaces/emails/*`.
// Aquí mantenemos sólo tipos locales cuando hace falta.

// ----------------------
// Helper genérico de POST
// ----------------------

/**
 * Helper genérico para hacer POST contra los endpoints de Email.
 * - Obtiene un token vía login root.
 * - Arma los headers (incluyendo Authorization si hay token).
 * - Loguea la request para debugging.
 * - En caso de error, adjunta información útil para diagnosticar.
 */
async function postEmail(endpoint: string, body: unknown): Promise<void> {
  // Intentamos obtener el token root.
  // Si falla el login, seguimos sin Authorization para no bloquear completamente el uso.
  const token = await login().catch(() => null);

  try {
    // Construimos headers e intentamos enviar el request.
    const baseUrl = apiClient.defaults.baseURL?.replace(/\/$/, "") || "";
    const url = `${baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Log de alto nivel (no imprimimos body completo para evitar datos sensibles)
    // eslint-disable-next-line no-console
    console.debug("POST email ->", url, token ? "(with token)" : "(no token)");

    await apiClient.post(endpoint, body, { headers });
  } catch (err: any) {
    // Si hay error, intentamos enriquecerlo con más info para debugging
    try {
      // eslint-disable-next-line no-console
      console.error("postEmail error:", err?.response?.status || err?.message || err);
      // eslint-disable-next-line no-console
      console.error("postEmail response data:", err?.response?.data);
    } catch {
      // Si falla el logging, lo ignoramos.
    }

    // Si el error viene con respuesta HTTP (Axios error con response)
    if (err?.response) {
      const status = err.response.status;
      const respData = err.response.data;
      const message = `postEmail failed ${status}: ${JSON.stringify(respData)}`;
      const enrichedError = new Error(message);
      // @ts-ignore
      enrichedError.status = status;
      // @ts-ignore
      enrichedError.responseData = respData;
      throw enrichedError;
    }

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
}): Promise<void> {
  const { to, name, confirmationUrl } = params || {};

  // Validamos datos mínimos requeridos
  if (!to || !name || !confirmationUrl) {
    throw new Error("Faltan datos: to, name, confirmationUrl");
  }

  // Llamamos al endpoint de confirmación en backend
  await postEmail("/v1/Email/EnviarConfirmarEmail", {
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
}): Promise<void> {
  const {
    to,
    name,
    recoveryUrl = "https://raveapp.com.ar/restablecer-contrasena",
  } = params || {};

  // Validamos datos mínimos requeridos
  if (!to || !name) {
    throw new Error("Faltan datos: to, name");
  }

  // Llamamos al endpoint de recuperación de contraseña
  await postEmail("/v1/Email/EnviarPassRecoveryEmail", {
    to,
    templateData: { name, recoveryUrl },
  });
}

/**
 * Envía un correo genérico (custom) a un solo destinatario.
 * Útil para comunicaciones puntuales que no usan un template fijo.
 */
export async function sendGenericEmail(
  payload: {
    to: string;
    titulo: string;
    cuerpo: string;
    botonUrl?: string;
    botonTexto?: string;
  }
): Promise<void> {
  const { to, titulo, cuerpo, botonUrl, botonTexto } = payload || {};

  // Validamos datos mínimos requeridos
  if (!to || !titulo || !cuerpo) {
    throw new Error("Faltan datos: to, titulo, cuerpo");
  }

  // Llamamos al endpoint genérico de envío de mail
  await postEmail("/v1/Email/EnvioMailGenerico", {
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
}): Promise<void> {
  const { idEvento, titulo, cuerpo, botonUrl, botonTexto } = payload || {};

  // Validamos datos mínimos requeridos
  if (!idEvento || !titulo || !cuerpo) {
    throw new Error("Faltan datos: idEvento, titulo, cuerpo");
  }

  // Endpoint definido en backend para envío masivo genérico
  await postEmail("/v1/Email/EnvioMailGenericoMasivo", {
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
}): Promise<void> {
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
  await postEmail("/v1/Email/EnvioMailGenericoMasivo", {
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
