// app/artists/services/useUpdateArtist.ts

import { useCallback, useState } from "react";
import { updateArtistOnApi } from "@/app/artists/apis/artistApi";
import { Artist } from "@/app/artists/types/Artist";

// Hook simple para actualizar un artista en la API.
// Deja toda la llamada y manejo de loading/error afuera de la UI.
export default function useUpdateArtist() {
  // flag de carga mientras se hace el PUT/POST en backend
  const [loading, setLoading] = useState(false);
  // error que podamos querer mostrar/loguear desde la pantalla
  const [error, setError] = useState<unknown>(null);

  // función que se expone al componente para actualizar un artista
  const updateArtist = useCallback(
    async (payload: Partial<Artist>) => {
      // arrancamos la operación: encendemos loading y limpiamos error anterior
      setLoading(true);
      setError(null);

      try {
        // delegamos en la función que realmente pega a la API
        const res = await updateArtistOnApi(payload);
        return res; // por ahora la API devuelve void, pero dejamos el return por si cambia
      } catch (e) {
        // si algo falla, guardamos el error en estado para que la UI pueda reaccionar
        setError(e);
        // volvemos a lanzar el error para que la pantalla pueda manejarlo con try/catch
        throw e;
      } finally {
        // siempre apagamos el loading, haya ido bien o mal
        setLoading(false);
      }
    },
    [] // no depende de nada externo, así que el callback es estable
  );

  // devolvemos la función y el estado asociado
  return { updateArtist, loading, error } as const;
}
