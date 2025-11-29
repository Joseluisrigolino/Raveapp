// app/artists/services/useCreateArtista.ts
// Hook sencillo para crear un artista mediante POST al backend.

import { useCallback, useState } from "react";
import { createArtistOnApi } from "@/app/artists/apis/artistApi";

// Payload mínimo necesario para crear un artista
type CreateArtistPayload = {
  name: string;
  description?: string;
  instagramURL?: string;
  spotifyURL?: string;
  soundcloudURL?: string;
};

export default function useCreateArtista() {
  const [isLoading, setIsLoading] = useState(false); // flag de carga
  const [error, setError] = useState<any>(null);     // último error (si hubo)

  // Función que envía el POST al backend
  const createArtist = useCallback(
    async (payload: CreateArtistPayload) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await createArtistOnApi(payload);
        return response;
      } catch (err) {
        // guardamos el error para que la UI decida qué hacer
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Devolvemos la función y estados para que la pantalla los use
  return { createArtist, isLoading, error } as const;
}
