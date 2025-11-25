import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/styles/globalStyles";

type Props = {
  eventName?: string;
  infoText: string;
  onReload: () => void;
};

export default function EventSalesHeaderComponent({
  eventName,
  infoText,
  onReload,
}: Props) {
  return (
    <View>
      <Text style={styles.title}>Reporte de ventas de evento</Text>
      {eventName ? (
        <Text style={styles.subtitle}>Evento: {eventName}</Text>
      ) : null}
      <Text style={styles.info}>{infoText}</Text>

      <TouchableOpacity style={styles.refreshBtn} onPress={onReload}>
        <Text style={styles.refreshBtnText}>Actualizar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.textSecondary,
  },
  info: {
    marginTop: 8,
    color: COLORS.textSecondary,
  },
  refreshBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  refreshBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
