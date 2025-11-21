import { useCallback, useEffect, useState } from "react";
import { getPartiesByUser } from "@/app/party/apis/partysApi";

export default function useGetPartysByUser(userId?: string | null) {
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!userId) {
        setParties([]);
        return;
      }
      const data = await getPartiesByUser(String(userId));
      setParties(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[useGetPartysByUser] fetch error", e);
      setError("No pudimos cargar tus fiestas recurrentes.");
      setParties([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { parties, loading, error, refresh: fetch } as const;
}
