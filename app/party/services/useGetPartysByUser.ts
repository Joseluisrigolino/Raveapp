import { useState, useEffect, useCallback } from "react";
import { Party, getPartiesByUser } from "@/app/party/apis/partysApi";

export default function useGetPartysByUser(userId?: string | null) {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) {
        setParties([]);
        return;
      }
      const data = await getPartiesByUser(String(userId));
      // Mostrar solo las fiestas activas
      const active = (data || []).filter((p) => p.isActivo === true);
      setParties(active);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { parties, loading, error, refresh } as const;
}
