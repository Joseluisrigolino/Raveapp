import { useState } from "react";
import { updateUsuario } from "@/app/auth/userApi";
import { getProfile } from "@/app/auth/userApi";
import { useAuth } from "@/app/auth/AuthContext";

export default function useUpdateUserProfile() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  async function updateUserProfile(payload: any) {
    if (!user) throw new Error("No authenticated user");
    setError(null);
    setUpdating(true);
    try {
      await updateUsuario(payload);
      // refresh profile from API
      const updated = await getProfile(user.username);
      return updated;
    } catch (e: any) {
      const msg = e?.response?.data?.title || e?.message || "Error";
      setError(String(msg));
      throw e;
    } finally {
      setUpdating(false);
    }
  }

  return { updating, error, updateUserProfile } as const;
}
