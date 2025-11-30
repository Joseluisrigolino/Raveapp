import { useCallback, useState } from "react";
import { apiClient, login } from "@/app/apis/apiClient";
import { deleteControllerUser } from "@/app/auth/apis/user-controller/controllerUserApi";

// Hook para eliminar users controladores.
// Comentarios en español, internals en inglés
export default function useDeleteUserControllers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  type DeleteParam =
    | string
    | {
        idUsuarioOrg: string;
        idUsuarioControl: string;
      };

  const deleteUser = useCallback(async (param: DeleteParam) => {
    setLoading(true);
    setError(null);
    let lastErr: any = null;
    try {
      const token = await login();
      // Si el caller provee IDs, usamos la función específica del API
      if (typeof param !== "string") {
        await deleteControllerUser({ idUsuarioOrg: param.idUsuarioOrg, idUsuarioControl: param.idUsuarioControl });
        return;
      }

      const username = param;

      // Intentamos varios endpoints plausibles cuando sólo se dispone del username.
      const attempts: Array<{ method: "delete" | "post"; url: string; config?: any; body?: any }> = [
        { method: "delete", url: "/v1/Usuario/DeleteUsuarioControl", config: { params: { nombreUsuario: username } } },
        { method: "delete", url: "/v1/Usuario/DeleteUsuario", config: { params: { nombreUsuario: username } } },
        { method: "delete", url: `/v1/Usuario/DeleteUsuario/${username}`, config: {} },
        // Algunos endpoints esperan POST con body
        { method: "post", url: "/v1/Usuario/DeleteUsuarioControl", body: { nombreUsuario: username } },
        { method: "post", url: "/v1/Usuario/DeleteUsuario", body: { nombreUsuario: username } },
        // variantes con mayúsculas/nombre distinto
        { method: "delete", url: "/v1/Usuario/DeleteUsuarioControl", config: { params: { NombreUsuario: username } } },
        { method: "post", url: "/v1/Usuario/DeleteUsuarioControl", body: { NombreUsuario: username } },
      ];

      for (const a of attempts) {
        try {
          if (a.method === "delete") {
            await apiClient.delete(a.url, { headers: { Authorization: `Bearer ${token}` }, ...(a.config || {}) });
          } else {
            await apiClient.post(a.url, a.body || {}, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
          }
          return; // éxito
        } catch (e) {
          lastErr = e;
          // intentar siguiente
        }
      }

      // Si llegamos acá, todos fallaron
      throw lastErr || new Error("Delete failed");
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteUser, loading, error } as const;
}
