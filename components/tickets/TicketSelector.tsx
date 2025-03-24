// components/TicketSelector/TicketSelector.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/**
 * Componente para incrementar/decrementar la cantidad de entradas de un tipo.
 */
interface TicketSelectorProps {
  label: string;
  maxQty: number;
  currentQty: number;
  onChange: (delta: number) => void;
}

export default function TicketSelector({
  label,
  maxQty,
  currentQty,
  onChange,
}: TicketSelectorProps) {
  return (
    <View style={styles.ticketSelectorRow}>
      <Text style={styles.ticketSelectorLabel}>{label}</Text>
      <View style={styles.ticketSelectorActions}>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => onChange(-1)}
          disabled={currentQty <= 0}
        >
          <Text style={styles.qtyButtonText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.qtyNumber}>{currentQty}</Text>

        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => onChange(+1)}
          disabled={currentQty >= maxQty}
        >
          <Text style={styles.qtyButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticketSelectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
    marginLeft: 12,
  },
  ticketSelectorLabel: {
    flex: 1,
    color: COLORS.textPrimary,
  },
  ticketSelectorActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  qtyButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: 18,
  },
  qtyNumber: {
    minWidth: 24,
    textAlign: "center",
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
  },
});
