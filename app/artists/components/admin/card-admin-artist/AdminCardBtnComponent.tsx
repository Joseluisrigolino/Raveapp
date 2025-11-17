// Componente: Botón de acción para la tarjeta de artista (admin)
// Comentarios en español, código en inglés

import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

interface Props {
  label: string;
  variant: "edit" | "delete";
  onPress: () => void;
}

export default function AdminCardBtnComponent({ label, variant, onPress }: Props) {
  const isDelete = variant === "delete";
  return (
    <TouchableOpacity
      style={[styles.btn, isDelete ? styles.btnDelete : styles.btnEdit]}
      onPress={onPress}
    >
      <Text style={isDelete ? styles.btnDeleteText : styles.btnEditText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // botón base
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  // variantes
  btnEdit: { backgroundColor: "#F1F5F9" },
  btnEditText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  btnDelete: { backgroundColor: "#374151" },
  btnDeleteText: {
    color: COLORS.backgroundLight,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
});
