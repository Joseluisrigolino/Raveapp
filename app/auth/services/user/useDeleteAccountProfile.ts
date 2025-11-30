import { useState } from "react";
import { apiClient } from "@/app/apis/apiClient";
import { useAuth } from "@/app/auth/AuthContext";
import { useRouter } from "expo-router";
import * as nav from "@/utils/navigation";
import ROUTES from "@/routes";

// Hook para eliminar la cuenta del usuario actual
export default function useDeleteAccountProfile() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Función principal para eliminar la cuenta
  async function deleteAccount() {
    if (!user?.username && !user?.id) throw new Error("No authenticated user");
    setError(null);
    setDeleting(true);
    try {
      const userId = (user as any).idUsuario ?? (user as any).id ?? user.username;
      // Llamada a la API para eliminar el usuario
      await apiClient.delete(`/v1/Usuario/DeleteUsuario/${userId}`);
      // Logout y redirección a login
      try {
        await logout();
      } catch {}
      nav.replace(router, ROUTES.LOGIN.LOGIN);
      return true;
    } catch (e: any) {
      // Guardamos el mensaje de error para la UI
      const msg = e?.response?.data?.title || e?.message || "Error";
      setError(String(msg));
      throw e;
    } finally {
      setDeleting(false);
    }
  }

  return { deleting, error, deleteAccount } as const;
}
