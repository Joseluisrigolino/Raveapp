// Hook para encapsular la lógica de envío de email de recuperación
// Comentarios en español, código en inglés

import { useState, useCallback } from "react";
import { sendPasswordRecoveryEmail } from "@/app/apis/mailsApi";
import { getProfile } from "@/app/auth/userApi";

export default function useSendRecoveryPass() {
  const [sending, setSending] = useState(false);

  // Comentario en español: intenta obtener nombre y enviar el correo
  const sendRecovery = useCallback(async (email: string) => {
    if (!email || !email.trim()) throw new Error("EMPTY_EMAIL");
    setSending(true);
    try {
      let name = "Usuario";
      try {
        const profile = await getProfile(email.trim());
        name = profile?.nombre || "Usuario";
      } catch {
        // si falla, usamos nombre por defecto
      }

      await sendPasswordRecoveryEmail({ to: email.trim(), name });
    } finally {
      setSending(false);
    }
  }, []);

  return { sending, sendRecovery };
}
