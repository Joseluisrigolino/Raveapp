import { useCallback, useState } from "react";
import { updateArtistOnApi } from "@/app/artists/apis/artistApi";

// Hook simple para actualizar un artista en el API
// Comentarios en español, internals en inglés
export default function useUpdateArtist() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const updateArtist = useCallback(async (payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateArtistOnApi(payload);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateArtist, loading, error } as const;
}
