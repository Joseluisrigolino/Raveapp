import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { COLORS } from "@/styles/globalStyles";

type Props = {
  onPressGoToManage: () => void;
};

export default function ManageEventsEmptyStateComponent({
  onPressGoToManage,
}: Props) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Icon name="event-busy" size={34} color="#9ca3af" />
      </View>
      <Text style={styles.emptyTitle}>No hay eventos disponibles</Text>
      <Text style={styles.emptyText}>
        No tenés eventos con estados "En venta", "Fin venta" o
        "Finalizados" para mostrar reportes de entradas.
      </Text>

      <TouchableOpacity
        style={styles.createBtn}
        onPress={onPressGoToManage}
      >
        <Text style={styles.createBtnText}>
          Ver estado de mis eventos →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 20,
  },
  createBtn: {
    backgroundColor: "#0f172a",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  createBtnText: { color: "#fff", fontWeight: "700" },
});
