// app/artists/components/admin/card-admin-artist/AdminCardBtnComponent.tsx
// Botón de acción dentro de la card de artista en modo admin (Editar / Eliminar)

import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

// Props simples: etiqueta, variante visual y callback
type AdminCardButtonProps = {
  label: string;                 // texto del botón (ej: "Editar", "Eliminar")
  variant: "edit" | "delete";    // define colores (primario / peligro)
  onPress: () => void;           // acción al tocar el botón
};

export default function AdminCardBtnComponent({
  label,
  variant,
  onPress,
}: AdminCardButtonProps) {
  // flag para saber si estamos en modo "eliminar"
  const isDelete = variant === "delete";

  return (
    <TouchableOpacity
      // combinamos estilos base + variante (editar / eliminar)
      style={[styles.button, isDelete ? styles.buttonDelete : styles.buttonEdit]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={isDelete ? styles.buttonDeleteText : styles.buttonEditText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // estilo base del botón (tamaño y alineación)
  button: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  // variante para "Editar": fondo claro
  buttonEdit: {
    backgroundColor: "#F1F5F9",
  },
  buttonEditText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  // variante para "Eliminar": fondo oscuro (parecido a botón peligro)
  buttonDelete: {
    backgroundColor: "#374151",
  },
  buttonDeleteText: {
    color: COLORS.backgroundLight,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
});
