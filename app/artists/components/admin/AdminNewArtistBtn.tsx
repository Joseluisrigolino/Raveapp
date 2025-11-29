// app/artists/components/admin/AdminNewArtistBtn.tsx

// Botón configurable para "Nuevo artista" (texto + ícono).

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

interface Props {
  onPress: () => void; // Acción al presionar el botón
  label?: string; // Texto del botón
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; // Nombre del ícono
  bgColor?: string; // Color de fondo
  textColor?: string; // Color del texto
  iconColor?: string; // Color del ícono
  style?: StyleProp<ViewStyle>; // Estilos extra desde la screen
}

export default function AdminNewArtistBtn({
  onPress,
  label = "Nuevo artista",
  iconName = "music-note-outline",
  bgColor = "#0F172A",
  textColor = COLORS.backgroundLight,
  iconColor = COLORS.cardBg,
  style,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.addBtn, { backgroundColor: bgColor }, style]}
      onPress={onPress}
    >
      {iconName ? (
        <MaterialCommunityIcons
          name={iconName}
          size={16}
          color={iconColor}
          style={{ marginRight: 6 }}
        />
      ) : null}
      <Text style={[styles.addBtnText, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Botón principal
  addBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    flexDirection: "row",
  },
  // Texto interno del botón
  addBtnText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.backgroundLight,
  },
});
