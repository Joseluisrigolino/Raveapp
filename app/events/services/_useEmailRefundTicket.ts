// Servicio wrapper para solicitar reembolso masivo de entradas de un evento
import { solicitarReembolsoMasivo } from "@/app/events/apis/entradaApi";
import { sendGenericEmail } from "@/app/apis/mailsApi";

export async function requestMassRefundForEvent(idEvento: string): Promise<any> {
  if (!idEvento) throw new Error("Faltan datos: idEvento");
  try {
    return await solicitarReembolsoMasivo(String(idEvento));
  } catch (err: any) {
    // Loguear y volver a lanzar para que el llamador pueda decidir
    try { console.warn("requestMassRefundForEvent failed:", err); } catch {}
    throw err;
  }
}

export default requestMassRefundForEvent;

// Construye título y cuerpo HTML para notificar al comprador sobre el reembolso
export function buildRefundEmailBody(params: {
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
    const d = new Date(fechaCompra as any);
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

  const titulo = `Cancelación de entradas a evento ${nombreEvento}`;

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
<p>Atentamente,</p>
`.trim();

  return { titulo, cuerpo };
}

// Helper: enviar mail individual de reembolso (usa sendGenericEmail)
export async function sendRefundEmailToRecipient(params: {
  to: string;
  nombreUsuario: string;
  nombreEvento: string;
  importeReembolsado: number;
  fechaCompra: Date | string;
  numeroOperacionMP?: string;
}) {
  const { to, nombreUsuario, nombreEvento, importeReembolsado, fechaCompra, numeroOperacionMP } = params;
  if (!to) throw new Error("Falta destinatario 'to'");
  const { titulo, cuerpo } = buildRefundEmailBody({ nombreUsuario, nombreEvento, importeReembolsado, fechaCompra, numeroOperacionMP });
  return sendGenericEmail({ to, titulo, cuerpo, botonUrl: "", botonTexto: "" });
}
