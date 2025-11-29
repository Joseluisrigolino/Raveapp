// app/artists/components/admin/card-admin-artist/AdminCardInfoComponent.tsx
// Componente: muestra nombre del artista + fecha de alta formateada para la tarjeta admin.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";
// Usamos helper centralizado de fechas en lugar de definir uno local
import { formatDateLongEs } from "@/utils/formatDate";

type Props = {
  name: string;          // nombre del artista
  creationDate?: string; // fecha de alta en ISO (viene del backend)
};

export default function AdminCardInfoComponent({ name, creationDate }: Props) {
  // Formateamos la fecha a algo legible para UI (ej: "24 Noviembre 2025")
  const formattedDate = formatDateLongEs(creationDate);

  return (
    // Contenedor de la info textual de la card
    <View style={styles.info}>
      {/* Nombre del artista */}
      <Text style={styles.name}>{name}</Text>

      {/* Fila con ícono de calendario + fecha formateada (si hay) */}
      <View style={styles.metaRow}>
        <MaterialCommunityIcons
          name="calendar-blank"
          size={16}
          color={COLORS.textSecondary}
        />
        <Text style={styles.metaText}>
          {formattedDate}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // contenedor general de la info dentro de la card
  info: {
    flex: 1,
    marginLeft: 12,
  },
  // estilo del nombre del artista
  name: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  // fila para ícono + texto de fecha
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  // texto de la fecha
  metaText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.smallText,
  },
});
