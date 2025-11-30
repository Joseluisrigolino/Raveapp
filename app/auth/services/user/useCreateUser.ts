import { useState } from "react";
import { apiClient, login as apiLogin } from "@/app/apis/apiClient";

// Tipo para el payload de creación de usuario
type CreateUserPayload = Record<string, any>;

// Hook para crear usuario en la app
export default function useCreateUser() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función principal para crear usuario
  async function createUser(payload: CreateUserPayload) {
    setError(null);
    setCreating(true);
    try {
      // Obtenemos el token root y seteamos el header (autenticación)
      const rootToken = await apiLogin();
      apiClient.defaults.headers.common.Authorization = `Bearer ${rootToken}`;

      // Validamos si ya existe un usuario con ese correo antes de crear
      const email = (payload as any)?.correo || (payload as any)?.email || "";
      if (email) {
        try {
          const resp = await apiClient.get("/v1/Usuario/GetUsuario", {
            params: { Mail: String(email).trim(), IsActivo: true },
          });
          const data = resp?.data;
          const exists =
            (Array.isArray(data?.usuarios) && data.usuarios.length > 0) ||
            (data && typeof (data as any).idUsuario === "string") ||
            (Array.isArray(data) && data.length > 0);
          if (exists) {
            const msg = "Email ya registrado en la aplicacion";
            setError(msg);
            throw new Error(msg);
          }
        } catch (getErr: any) {
          // Si la comprobación devolvió 404 significa "no existe" — continuar.
          if (getErr?.response?.status === 404) {
            // no encontrado -> seguir con la creación
          } else if ((getErr as any).message === "Usuario ya existe") {
            // ya manejado arriba: rethrow para que el catch más externo lo capture
            throw getErr;
          } else if (getErr?.response) {
            // error HTTP distinto -> propagar para que se muestre al usuario
            const msg = getErr?.message || "Error verificando usuario existente";
            setError(String(msg));
            throw getErr;
          } else {
            // error de red u otro -> propagar
            throw getErr;
          }
        }
      }

      // Llamada a la API para crear el usuario
      await apiClient.post("/v1/Usuario/CreateUsuario", payload, {
        headers: { "Content-Type": "application/json" },
      });

      return true;
    } catch (e: any) {
      // Guardamos el mensaje de error para la UI
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
