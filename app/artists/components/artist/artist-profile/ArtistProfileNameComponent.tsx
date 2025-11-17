// Componente simple para mostrar el nombre del artista
import React from "react";
import { Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";

type Props = {
  name?: string | null;
  style?: any;
};

export default function ArtistName({ name, style }: Props) {
  // si no hay nombre, no renderiza nada
  if (!name) return null;
  return (
    <Text style={[styles.title, style]} numberOfLines={2} ellipsizeMode="tail">
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
