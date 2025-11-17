// Componente simple para mostrar un subtitle / encabezado pequeño
import React from "react";
import { Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";

type Props = {
  text?: string | null;
  style?: any;
};

export default function Subtitle({ text, style }: Props) {
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
