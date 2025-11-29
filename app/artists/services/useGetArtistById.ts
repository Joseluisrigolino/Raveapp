// app/artists/services/useGetArtistById.ts
// Hook para traer el detalle de un artista por id desde la API.

import { useState, useEffect, useCallback } from "react";
import { fetchOneArtistFromApi } from "@/app/artists/apis/artistApi";

// Tipo inferido a partir de lo que devuelve fetchOneArtistFromApi
type ArtistDetail = Awaited<ReturnType<typeof fetchOneArtistFromApi>>;

export default function useGetArtistById(id?: string, userId?: string) {
  // Estado con el artista (o null si no hay)
  const [data, setData] = useState<ArtistDetail | null>(null);
  // Flag simple de carga
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Error básico por si algo falla en el fetch
  const [error, setError] = useState<unknown>(null);

  // Función para volver a pedir el artista a la API
  const refresh = useCallback(async () => {
    // Si falta id o userId, limpiamos y no llamamos a la API
    if (!id || !userId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchOneArtistFromApi(id, userId);
      setData(result ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [id, userId]);

  // Disparamos el fetch inicial y cada vez que cambian id o userId
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Devolvemos un objeto inmutable con la data y helpers
  return { data, isLoading, error, refresh } as const;
}
