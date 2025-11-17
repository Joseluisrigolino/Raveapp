import { useState, useEffect, useCallback } from "react";
import { fetchOneArtistFromApi } from "@/app/artists/apis/artistApi";

export default function useGetArtistById(id?: string, userId?: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const refresh = useCallback(async () => {
    if (!id || !userId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const d = await fetchOneArtistFromApi(id, userId);
      setData(d || null);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh } as const;
}
