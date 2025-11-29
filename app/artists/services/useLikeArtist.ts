// app/artists/services/useLikeArtist.ts
// Hook para manejar el estado de "me gusta" de un artista.

import { useState } from "react";
import { Alert } from "react-native";
import { toggleArtistFavoriteOnApi } from "@/app/artists/apis/artistApi";

export default function useLikeArtist() {
  // Estado local del corazón (like / no like) en la UI
  const [isLiked, setIsLiked] = useState(false);

  /**
   * toggleLike:
   * - recibe userId y artistId
   * - hace un toggle optimista del estado (cambia el corazón al toque)
   * - si la API falla, revierte el estado y avisa con un Alert
   *
   * El re-fetch de datos completos del artista (likes, avatars, etc.)
   * lo hace la pantalla que usa este hook (ej: ArtistScreen) llamando a refresh().
   */
  const toggleLike = async (userId?: string, artistId?: string) => {
    if (!userId || !artistId) return;

    // Guardamos el estado anterior por si hay que revertir
    const prev = isLiked;

    // Toggle optimista para dar feedback rápido en la UI
    setIsLiked(!prev);

    try {
      // Llamamos a la API para marcar o desmarcar favorito
      await toggleArtistFavoriteOnApi(userId, artistId);
    } catch (err) {
      // Si algo falla, volvemos al estado anterior y avisamos
      setIsLiked(prev);
      Alert.alert("Error", "No se pudo actualizar el favorito");
    }
  };

  return { isLiked, setIsLiked, toggleLike };
}
