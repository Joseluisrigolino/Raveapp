import { useCallback, useState } from "react";
import { deleteParty as deletePartyApi } from "@/app/party/apis/partysApi";

export default function useDeleteParty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const deleteParty = useCallback(async (idFiesta: string) => {
    setLoading(true);
    setError(null);
    try {
      await deletePartyApi(idFiesta);
      return;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteParty, loading, error } as const;
}
