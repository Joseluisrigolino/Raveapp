// app/artists/components/artist/artist-profile/ArtistProfileDescriptionComponent.tsx
// Muestra el texto de descripción / bio del artista.

import React from "react";
import { StyleSheet, Text, TextStyle } from "react-native";
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";

type ArtistProfileDescriptionProps = {
  text?: string | null;          // descripción del artista (puede venir null/undefined)
  style?: TextStyle | TextStyle[]; // estilos extra opcionales
};

export default function ArtistProfileDescription({
  text,
  style,
}: ArtistProfileDescriptionProps) {
  // Si no hay texto mandamos string vacío para no romper el layout
  return <Text style={[styles.text, style]}>{text || ""}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.body * 1.4,
  },
});
