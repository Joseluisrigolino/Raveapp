// Componente: Botón configurable (label, ícono, colores)
// Comentarios en español, código en inglés

import React from "react";
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

// props configurables para poder setear desde la screen
interface Props {
  onPress: () => void;
  label?: string;
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  bgColor?: string;
  textColor?: string;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
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
    <TouchableOpacity style={[styles.addBtn, { backgroundColor: bgColor }, style]} onPress={onPress}>
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
  // botón base (alineado con estilo previo)
  addBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    flexDirection: "row",
  },
  addBtnText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.backgroundLight,
  },
});
