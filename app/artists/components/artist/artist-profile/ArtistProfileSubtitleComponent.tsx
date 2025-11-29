// app/artists/components/artist/artist-profile/ArtistProfileSubtitleComponent.tsx
// Subtitle simple para secciones dentro del perfil del artista (ej: "Sobre el artista").

import React from "react";
import { StyleSheet, Text, TextStyle } from "react-native";
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";

type ArtistProfileSubtitleProps = {
  text?: string | null;             // texto del subtítulo
  style?: TextStyle | TextStyle[];  // estilos extra opcionales
};

export default function ArtistProfileSubtitle({
  text,
  style,
}: ArtistProfileSubtitleProps) {
  // si no hay texto, no mostramos nada
  if (!text) return null;

  return <Text style={[styles.subtitle, style]}>{text}</Text>;
}

const styles = StyleSheet.create({
  subtitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
});
