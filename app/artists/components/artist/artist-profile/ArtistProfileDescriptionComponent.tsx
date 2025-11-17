// Componente para mostrar la descripción del artista
import React from "react";
import { Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";

type Props = {
  text?: string | null;
  style?: any;
};

export default function Description({ text, style }: Props) {
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
