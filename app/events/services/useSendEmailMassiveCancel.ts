// Servicio para construir y enviar el mail masivo de cancelación
import { sendMassCancellationEmail } from "@/app/apis/mailsApi";

export interface SendMassCancelParams {
  idEvento: string;
  eventName: string;
  reason?: string;
}

function escapeHtml(s: string): string {
  return String(s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendMassCancelEmail(params: SendMassCancelParams): Promise<any> {
  const { idEvento, eventName, reason } = params || {};
  if (!idEvento || !eventName) throw new Error("Faltan datos: idEvento, eventName");

  const safeEventName = escapeHtml(eventName);
  const safeReason = escapeHtml(reason || "");

  const titulo = `Se ha cancelado el evento ${safeEventName}`;
  const cuerpo = `
<p>Lamentamos comunicarte que el evento <strong>${safeEventName}</strong> se ha cancelado, por causas ajenas a RaveApp.</p>
${safeReason ? `<p>El organizador del evento ha indicado lo siguiente: <strong>${safeReason}</strong></p>` : `<p>(sin motivo)</p>`}
<p>Por este motivo, procedemos a realizar el reembolso de tu compra al medio de pago que hayas utilizado en MercadoPago, y lo verás acreditado dentro de los 7 días hábiles.</p>
<p>Atentamente,</p>
`.trim();

  // Enviar con campos de botón vacíos por compatibilidad
  return sendMassCancellationEmail({
    idEvento: String(idEvento),
    titulo,
    cuerpo,
    botonUrl: "",
    botonTexto: "",
  });
}

export default sendMassCancelEmail;
