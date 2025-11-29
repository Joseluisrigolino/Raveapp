// app/artists/services/useGetArtists.ts

import { useState, useEffect, useCallback } from "react"; // Hooks de React
import { Artist } from "@/app/artists/types/Artist"; // Tipo de artista que usamos en el front
import { fetchArtistsFromApi } from "@/app/artists/apis/artistApi"; // Llamada real a la API de artistas

// Hook que trae la lista de artistas desde la API y expone estado de carga / error.
export default function useGetArtists() {
  const [data, setData] = useState<Artist[]>([]); // Lista de artistas
  const [isLoading, setIsLoading] = useState(false); // Flag de loading
  const [error, setError] = useState<unknown>(null); // Último error capturado

  // Función que realmente pega a la API y actualiza estados.
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const artists = await fetchArtistsFromApi(); // Llamada al backend
      setData(artists || []); // Siempre guardamos un array
    } catch (e) {
      setError(e); // Guardamos el error para que la UI pueda decidir qué hacer
    } finally {
      setIsLoading(false); // Siempre apagamos el loading
    }
  }, []);

  // Al montar el hook (y cuando cambien las deps de refresh), disparamos la carga inicial.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Devolvemos los estados principales + la función para recargar
  return { data, isLoading, error, refresh } as const;
}
