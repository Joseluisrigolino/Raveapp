import { useState } from "react";
import { apiClient } from "@/app/apis/apiClient";
import { useAuth } from "@/app/auth/AuthContext";
import { useRouter } from "expo-router";
import * as nav from "@/utils/navigation";
import ROUTES from "@/routes";

export default function useDeleteAccountProfile() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  async function deleteAccount() {
    if (!user?.username && !user?.id) throw new Error("No authenticated user");
    setError(null);
    setDeleting(true);
    try {
      const userId = (user as any).idUsuario ?? (user as any).id ?? user.username;
      await apiClient.delete(`/v1/Usuario/DeleteUsuario/${userId}`);
      // logout and redirect to login
      try {
        await logout();
      } catch {}
      nav.replace(router, ROUTES.LOGIN.LOGIN);
      return true;
    } catch (e: any) {
      const msg = e?.response?.data?.title || e?.message || "Error";
      setError(String(msg));
      throw e;
    } finally {
      setDeleting(false);
    }
  }

  return { deleting, error, deleteAccount } as const;
}
