import { useState } from "react";
import { sendConfirmEmail } from "@/app/apis/mailsApi";

// Tipo para los parámetros de verificación de email
interface VerifyEmailParams {
  to: string;
  name?: string;
  confirmationUrl?: string;
}

// Hook para enviar email de verificación de cuenta
export default function useVerifyEmail() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función principal para enviar el email de verificación
  async function sendVerifyEmail({ to, name, confirmationUrl }: VerifyEmailParams) {
    setError(null);
    setSending(true);
    try {
      // Llamada a la API para enviar el email de confirmación
      await sendConfirmEmail({
        to,
        name: name || "Usuario",
        confirmationUrl: confirmationUrl ?? "https://raveapp.com.ar/confirmacion-mail",
      });
      return true;
    } catch (e: any) {
      // Guardamos el mensaje de error para la UI
      const msg = e?.response?.data?.title || e?.message || "Error";
      setError(String(msg));
      throw e;
    } finally {
      setSending(false);
    }
  }

  return { sending, error, sendVerifyEmail } as const;
}
