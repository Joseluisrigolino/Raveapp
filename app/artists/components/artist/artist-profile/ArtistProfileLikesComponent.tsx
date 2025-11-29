// app/artists/components/artist/artist-profile/ArtistProfileLikesComponent.tsx
// Muestra el corazón, los últimos avatars y el texto de cuántos likes tiene el artista.

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

type Props = {
  isLiked: boolean;
  onToggle: () => void;
  recentLikes?: string[]; // URLs de las fotos de usuarios que dieron like
  likesCount?: number; // Cantidad total de likes del artista
  style?: StyleProp<ViewStyle>;
};

export default function ArtistProfileLikes({
  isLiked,
  onToggle,
  recentLikes = [],
  likesCount = 0,
  style,
}: Props) {
  // Nos aseguramos de quedarnos solo con las últimas 3 imágenes
  const avatars = Array.isArray(recentLikes) ? recentLikes.slice(-3) : [];

  // Formateamos el número de likes para mostrarlo prolijo según "es-AR"
  const formattedLikes = new Intl.NumberFormat("es-AR").format(
    typeof likesCount === "number" ? likesCount : 0
  );

  return (
    <View style={[styles.row, style]}>
      {/* Botón de corazón (like) */}
      <TouchableOpacity
        onPress={onToggle}
        style={styles.heartButton}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={isLiked ? "heart" : "heart-outline"}
          size={22}
          color={isLiked ? COLORS.primary : COLORS.textSecondary}
        />
      </TouchableOpacity>

      {/* Avatares de las últimas personas que dieron like */}
      <View style={styles.avatarsRow}>
        {avatars.map((url, index) => (
          <Avatar.Image
            key={`${index}-${url}`}
            size={20}
            source={getSafeImageSource(url)}
            style={[
              styles.smallAvatar,
              // Pequeño solapado para que se vean apilados
              index === 0 ? { marginLeft: -2 } : { marginLeft: -10 },
            ]}
          />
        ))}
      </View>

      {/* Texto con la cantidad total de likes */}
      <Text style={styles.likesText} numberOfLines={1}>
        {`A ${formattedLikes} personas les gusta esto`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heartButton: {
    padding: 2,
    marginRight: 2,
  },
  avatarsRow: {
    flexDirection: "row",
  },
  smallAvatar: {
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  likesText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginLeft: 4,
    flexShrink: 1,
  },
});
