import { useCallback, useState } from "react";
import { loginUser, AuthUser } from "@/app/auth/authApi";

// Hook para realizar el login de usuario contra la API
// Internals en inglés, comentarios en español
export default function useLoginUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginUser(email, password);
      return user;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, error } as const;
}
