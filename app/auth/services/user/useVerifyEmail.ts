import { useState } from "react";
import { sendConfirmEmail } from "@/app/apis/mailsApi";

type Params = {
  to: string;
  name?: string;
  confirmationUrl?: string;
};

export default function useVerifyEmail() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendVerifyEmail({ to, name, confirmationUrl }: Params) {
    setError(null);
    setSending(true);
    try {
      await sendConfirmEmail({
        to,
        name: name || "Usuario",
        confirmationUrl: confirmationUrl ?? "https://raveapp.com.ar/confirmacion-mail",
      });
      return true;
    } catch (e: any) {
      const msg = e?.response?.data?.title || e?.message || "Error";
      setError(String(msg));
      throw e;
    } finally {
      setSending(false);
    }
  }

  return { sending, error, sendVerifyEmail } as const;
}
