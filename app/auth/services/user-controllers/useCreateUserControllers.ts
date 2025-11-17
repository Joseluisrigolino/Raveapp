import { useCallback, useState } from "react";
import { createControllerUser } from "../../apis/user-controller/controllerApi";

// Hook simple para crear usuarios controladores
// Comentarios en español, internals en inglés
export default function useCreateUserControllers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const createUser = useCallback(async (payload: { idUsuarioOrg: string; nombreUsuario: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createControllerUser(payload);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createUser, loading, error } as const;
}
