// Hook para encapsular la lógica de envío de email de recuperación
// Comentarios en español, código en inglés

import { useState, useCallback } from "react";
import { sendPasswordRecoveryEmail } from "@/app/apis/mailsApi";
import { getUsuarioByEmailPublic, getUsuarioById } from "@/app/auth/userApi";

export default function useSendRecoveryPass() {
  const [sending, setSending] = useState(false);

  // Comentario en español: intenta obtener nombre y enviar el correo
  const sendRecovery = useCallback(async (email: string) => {
    if (!email || !email.trim()) {
      const e: any = new Error("EMPTY_EMAIL");
      e.code = "EMPTY_EMAIL";
      throw e;
    }
    setSending(true);
    try {
      // 1) Intentamos obtener usuario por email. Si el valor provisto es
      // en realidad un id de usuario, intentamos obtener por id.
      let usuarios: any[] = [];
      const raw = String(email || "").trim();

      const looksLikeId = (() => {
        // UUID v4-ish or long hex-like id: contiene guiones o tiene más de 12 chars hex
        const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (uuidRe.test(raw)) return true;
        if (raw.length >= 12 && /^[0-9a-fA-F-]+$/.test(raw)) return true;
        return false;
      })();

      // Si parece un id, intentamos obtener el usuario por id primero
      if (looksLikeId) {
        try {
          const byId = await getUsuarioById(raw);
          if (byId) usuarios = [byId as any];
        } catch (e) {
          // no hacemos nada; caemos al intento por email luego
        }
      }

      try {
        if (!usuarios.length) {
          usuarios = await getUsuarioByEmailPublic(raw);
        }
      } catch (err: any) {
        // Clasificamos errores para distinguir "email no existe" de errores de sistema.
        const resp = err?.response;
        if (resp) {
          const status = resp.status;
          const msg = resp.data?.message;
          // Backend could return 500 with message "Correo no registrado" in some cases
          if (status === 500 && msg === "Correo no registrado") {
            const e: any = new Error("EMAIL_NOT_FOUND");
            e.code = "EMAIL_NOT_FOUND";
            e.originalError = err;
            throw e;
          }
          // 404 or similar -> email not found
          if (status === 404) {
            const e: any = new Error("EMAIL_NOT_FOUND");
            e.code = "EMAIL_NOT_FOUND";
            e.originalError = err;
            throw e;
          }
          // 401/403 -> auth problem (system)
          if (status === 401 || status === 403) {
            // Log details to help debugging in PROD
            try {
              console.error('[sendRecovery] RECOVERY_SYSTEM_ERROR - status,data,url', resp.status, resp.data, err?.config?.url);
            } catch {}
            const e: any = new Error("RECOVERY_SYSTEM_ERROR");
            e.code = "RECOVERY_SYSTEM_ERROR";
            e.originalError = err;
            throw e;
          }
          // Other statuses -> treat as system error
          try {
            console.error('[sendRecovery] RECOVERY_SYSTEM_ERROR - status,data,url', resp.status, resp.data, err?.config?.url);
          } catch {}
          const e: any = new Error("RECOVERY_SYSTEM_ERROR");
          e.code = "RECOVERY_SYSTEM_ERROR";
          e.originalError = err;
          throw e;
        }

        // Network or other unexpected errors
        try {
          console.error('[sendRecovery] RECOVERY_SYSTEM_ERROR - no response, config.url', err?.config?.url, err?.message);
        } catch {}
        const e: any = new Error("RECOVERY_SYSTEM_ERROR");
        e.code = "RECOVERY_SYSTEM_ERROR";
        e.originalError = err;
        throw e;
      }
      // 2) Si no hay usuarios devueltos → intentamos nuevamente tratando la
      // entrada como id (por si el backend devolvió un id o el usuario ingresó id)
      if (!usuarios || usuarios.length === 0) {
        try {
          const byId = await getUsuarioById(raw);
          if (byId) usuarios = [byId as any];
        } catch {
          const e: any = new Error("EMAIL_NOT_FOUND");
          e.code = "EMAIL_NOT_FOUND";
          throw e;
        }
      }

      const user = usuarios[0];

      // Extraer email/mail/correo desde posibles formas que devuelva la API
      const candidateMail =
        user?.correo || user?.Correo || user?.mail || user?.Mail || user?.email || user?.Email || null;

      if (!candidateMail || !String(candidateMail || "").trim()) {
        // Si el objeto usuario no contiene mail pero tiene idUsuario, intentamos
        // obtener el usuario completo por id y extraer el correo.
        const idFromUser = user?.idUsuario || user?.IdUsuario || user?.id || null;
        if (idFromUser) {
          try {
            const full = await getUsuarioById(String(idFromUser));
            if (full) {
              // reasignamos candidato
              const fm = full?.correo || full?.Correo || full?.mail || full?.Mail || full?.email || null;
              if (fm) {
                // ok
                // @ts-ignore
                user.correo = fm;
              }
            }
          } catch {
            // no hacemos nada, caerá en el error abajo
          }
        }
      }

      const name = [user?.nombre, user?.apellido].filter(Boolean).join(" ") || "Usuario";

      const toEmail = String(user?.correo || user?.Correo || user?.mail || user?.Mail || user?.email || "").trim();

      if (!toEmail) {
        const e: any = new Error("EMAIL_NOT_FOUND");
        e.code = "EMAIL_NOT_FOUND";
        throw e;
      }

      // 3) Mandar mail
      try {
        await sendPasswordRecoveryEmail({ to: toEmail, name });
      } catch (err: any) {
        try {
          console.error('[sendRecovery] error enviando mail de recuperación', {
            status: err?.response?.status,
            data: err?.response?.data,
            url: err?.config?.url,
          });
        } catch {}
        const e: any = new Error("RECOVERY_SYSTEM_ERROR");
        e.code = "RECOVERY_SYSTEM_ERROR";
        e.originalError = err;
        throw e;
      }
    } finally {
      setSending(false);
    }
  }, []);

  return { sending, sendRecovery };
}
