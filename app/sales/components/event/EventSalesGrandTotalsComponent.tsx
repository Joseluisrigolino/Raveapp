import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/styles/globalStyles";
import { EventSalesTotals, formatMoney } from "../../services/useEventSalesReport";

type Props = {
  totals: EventSalesTotals;
  isAdmin: boolean;
};

export default function EventSalesGrandTotalsComponent({ totals, isAdmin }: Props) {
  return (
    <View style={styles.grandCard}>
      <Text style={styles.grandHeader}>Total General del Evento</Text>

      <View style={styles.rowBetween}>
        <Text style={styles.grandText}>
          Total entradas vendidas (ambos días)
        </Text>
        <Text style={styles.grandText}>{totals.vendidos}</Text>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.grandText}>
          Total recaudado entradas (ambos días)
        </Text>
        <Text style={styles.grandText}>
          {formatMoney(totals.recEntradas)}
        </Text>
      </View>

      {isAdmin && (
        <View style={styles.rowBetween}>
          <Text style={styles.grandText}>
            Total cargo por servicio (ambos días)
          </Text>
          <Text style={styles.grandText}>
            {formatMoney(totals.cargo)}
          </Text>
        </View>
      )}

      <View style={styles.totalPill}>
        <Text style={styles.totalPillText}>
          {isAdmin
            ? "TOTAL RECAUDADO (ENTRADAS + SERVICIO)  "
            : "TOTAL RECAUDADO  "}
          {formatMoney(isAdmin ? totals.total : totals.recEntradas)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grandCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  grandHeader: {
    color: "#fff",
    fontWeight: "800",
    marginBottom: 10,
    fontSize: 16,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  grandText: { color: "#d1d5db" },
  totalPill: {
    marginTop: 14,
    backgroundColor: "#1f2937",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  totalPillText: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
  },
});
