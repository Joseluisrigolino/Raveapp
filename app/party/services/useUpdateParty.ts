import { useCallback, useState } from "react";
import { updateParty as updatePartyApi } from "@/app/party/apis/partysApi";

export default function useUpdateParty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const updateParty = useCallback(async (payload: { idFiesta: string; nombre?: string; isActivo?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      await updatePartyApi(payload);
      return;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateParty, loading, error } as const;
}
