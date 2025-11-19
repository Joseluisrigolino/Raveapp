import { useState } from "react";
import { apiClient, login as apiLogin } from "@/app/apis/apiConfig";

type CreatePayload = any;

// hook simple para crear usuario
export default function useCreateUser() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createUser(payload: CreatePayload) {
    setError(null);
    setCreating(true);
    try {
      // obtener token root y setear header (mismo comportamiento que antes)
      const rootToken = await apiLogin();
      apiClient.defaults.headers.common.Authorization = `Bearer ${rootToken}`;

      await apiClient.post("/v1/Usuario/CreateUsuario", payload, {
        headers: { "Content-Type": "application/json" },
      });

      return true;
    } catch (e: any) {
      // guardar mensaje simple para UI
      try {
        const msg = e?.response?.data?.title || e?.message || JSON.stringify(e);
        setError(String(msg));
      } catch {
        setError("Error desconocido");
      }
      throw e;
    } finally {
      setCreating(false);
    }
  }

  return { creating, error, createUser } as const;
}
