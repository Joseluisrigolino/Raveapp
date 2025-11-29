// app/artists/components/artist/artist-profile/ArtistProfileNameComponent.tsx
// Muestra el nombre del artista como título principal del perfil.

import React from "react";
import { StyleSheet, Text, TextStyle } from "react-native";
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";

type ArtistProfileNameProps = {
  name?: string | null;              // nombre del artista
  style?: TextStyle | TextStyle[];   // estilos extra opcionales
};

export default function ArtistProfileName({
  name,
  style,
}: ArtistProfileNameProps) {
  // si no hay nombre, directamente no mostramos nada
  if (!name) return null;

  return (
    <Text
      style={[styles.title, style]}
      numberOfLines={2}
      ellipsizeMode="tail"
    >
      {name}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 10,
  },
});
