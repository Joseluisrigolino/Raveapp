import { useState, useEffect, useCallback } from "react";
import { Artist } from "@/app/artists/types/Artist";
import { fetchArtistsFromApi } from "@/app/artists/apis/artistApi";

export default function useGetArtists() {
  const [data, setData] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const d = await fetchArtistsFromApi();
      setData(d || []);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh } as const;
}
