// Hook sencillo para crear un artista mediante POST
// Comentarios en español, internals en inglés
import { useState } from 'react';
import { createArtistOnApi } from '@/app/artists/apis/artistApi';

type CreatePayload = {
  name: string;
  description?: string;
  instagramURL?: string;
  spotifyURL?: string;
  soundcloudURL?: string;
};

export default function useCreateArtista() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // crear artista: recibe payload y ejecuta el endpoint
  const createArtist = async (payload: CreatePayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await createArtistOnApi(payload);
      setIsLoading(false);
      return res;
    } catch (err) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return { createArtist, isLoading, error };
}
