// Hook para manejar el estado de like de un artista
// Mantiene la lógica de toggle y refresco separado de la UI
import { useState, useRef, useEffect } from "react";
import { Alert } from "react-native";
import {
  fetchOneArtistFromApi,
  toggleArtistFavoriteOnApi,
} from "@/app/artists/apis/artistApi";

export default function useLikeArtist() {
  const [isLiked, setIsLiked] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // toggleLike realizará la llamada a la API y luego pedirá un refetch simple
  // Retorna el artista actualizado si pudo obtenerlo, o undefined si hubo error
  const toggleLike = async (userId?: string, artistId?: string) => {
    if (!userId || !artistId) return undefined;

    // feedback inmediato
    setIsLiked((v) => !v);

    try {
      await toggleArtistFavoriteOnApi(userId, artistId);
    } catch (err) {
      // revertir y notificar
      setIsLiked((v) => !v);
      Alert.alert("Error", "No se pudo actualizar el favorito");
      return undefined;
    }

    // esperar 1s y pedir datos actualizados
    if (timerRef.current) clearTimeout(timerRef.current);
    return new Promise<any>(async (resolve) => {
      timerRef.current = setTimeout(async () => {
        try {
          const updated = await fetchOneArtistFromApi(artistId, userId);
          if (updated) setIsLiked(!!updated.isLiked);
          resolve(updated);
        } catch (e) {
          resolve(undefined);
        }
      }, 1000);
    });
  };

  return { isLiked, setIsLiked, toggleLike };
}
