import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { IconButton, Avatar } from "react-native-paper";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";
import { fetchOneArtistFromApi } from "@/utils/artists/artistApi";


interface Props {
  idArtista: string;
  likedByImages: string[];
  likedByIds: string[];
  isLiked: boolean;
  currentUserId?: string;
  onToggleLike?: () => Promise<void> | void; // función opcional que togglea en el servidor
  avatarMarginLeft?: number;
}

const LikesArtistComponent: React.FC<Props> = ({
  idArtista,
  likedByImages,
  likedByIds,
  isLiked,
  currentUserId,
  onToggleLike,
  avatarMarginLeft = -6,
}) => {
  const [isLikedLocal, setIsLikedLocal] = useState<boolean>(isLiked);
  const [likedImagesLocal, setLikedImagesLocal] = useState<string[]>(likedByImages.slice(0, 3));
  const [likedIdsLocal, setLikedIdsLocal] = useState<string[]>(likedByIds);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsLikedLocal(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setLikedImagesLocal(likedByImages.slice(0, 3));
  }, [likedByImages]);

  useEffect(() => {
    setLikedIdsLocal(likedByIds);
  }, [likedByIds]);

  const refreshLikesFromApi = async () => {
    try {
      const artist = await fetchOneArtistFromApi(idArtista, currentUserId);
      setLikedImagesLocal((artist.likedByImages || []).slice(0, 3));
      setLikedIdsLocal(artist.likedByIds || []);
      setIsLikedLocal(Boolean(artist.isLiked));
    } catch (e) {
      console.warn("refreshLikesFromApi failed", e);
    }
  };

  const handleToggle = async () => {
    if (busy) return;
    const prev = isLikedLocal;
    // Optimistic UI
    setIsLikedLocal(!prev);

    try {
      setBusy(true);
      // Llamar a la función proporcionada por el padre para togglear en el servidor (si existe)
      if (onToggleLike) {
        await onToggleLike();
      } else {
        // Si no hay función, intentamos refrescar igualmente (asumimos que algún proceso externo actualiza)
      }

      // Re-fetch para obtener imágenes/IDs actualizados
      await refreshLikesFromApi();
    } catch (err) {
      // Revertir en caso de error
      setIsLikedLocal(prev);
      Alert.alert("Error", "No se pudo actualizar el like. Intenta de nuevo.");
      console.error("handleToggle error", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.likesRow}>
      <TouchableOpacity onPress={handleToggle} style={styles.iconTouchable} disabled={busy}>
        <IconButton
          icon={isLikedLocal ? "heart" : "heart-outline"}
          size={28}
          iconColor={isLikedLocal ? COLORS.negative : COLORS.textPrimary}
          style={styles.iconButton}
        />
      </TouchableOpacity>

      <View style={[styles.avatars, { marginLeft: 0 }] }>
        {likedImagesLocal.map((uri, idx) => (
          uri ? (
            <Avatar.Image
              key={uri + idx}
              source={{ uri }}
              size={32}
              style={[styles.avatar, { marginLeft: idx === 0 ? 0 : avatarMarginLeft }]}
            />
          ) : (
            <Avatar.Icon
              key={`noimg-${idx}`}
              icon="account"
              size={32}
              style={[styles.avatar, { marginLeft: idx === 0 ? 0 : avatarMarginLeft }]}
              color={COLORS.textPrimary}
            />
          )
        ))}
      </View>

      <Text style={[styles.likeText, { marginLeft: likedImagesLocal.length ? 8 : 0 }] }>
        A {likedIdsLocal.length} persona{likedIdsLocal.length !== 1 ? "s" : ""} le gusta esto
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  likesRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatars: { flexDirection: "row" },
  iconTouchable: { marginRight: -6 },
  iconButton: { margin: 0, padding: 0 },
  avatar: { borderWidth: 2, borderColor: COLORS.cardBg },
  likeText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
});

export default LikesArtistComponent;
