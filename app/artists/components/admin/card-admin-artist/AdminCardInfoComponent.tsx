// Componente: Información del artista (nombre y fecha) para la tarjeta (admin)
// Comentarios en español, código en inglés

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";

interface Props {
  name: string;
  creationDate?: string;
}

// helper: fecha amigable en español
const formatDateEs = (iso?: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("es-ES", { month: "long" });
    const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
    return `${day} ${monthCap} ${d.getFullYear()}`;
  } catch {
    return iso as string;
  }
};

export default function AdminCardInfoComponent({ name, creationDate }: Props) {
  return (
    <View style={styles.info}>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.metaRow}>
        <MaterialCommunityIcons
          name="calendar-blank"
          size={16}
          color={COLORS.textSecondary}
        />
        <Text style={styles.metaText}>{formatDateEs(creationDate)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // contenedor de la info
  info: { flex: 1, marginLeft: 12 },
  name: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  metaText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.smallText },
});
