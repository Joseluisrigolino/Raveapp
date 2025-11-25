import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/styles/globalStyles";
import { ManageFilterStatus } from "../../services/useManageSalesEvents";

type Props = {
  value: ManageFilterStatus;
  onChange: (value: ManageFilterStatus) => void;
};

const CHIPS: { key: ManageFilterStatus; label: string }[] = [
  { key: "en_venta", label: "En venta" },
  { key: "fin_venta", label: "Fin venta" },
  { key: "finalizado", label: "Finalizado" },
];

export default function ManageEventsStatusChipsComponent({
  value,
  onChange,
}: Props) {
  return (
    <View style={styles.chipsRow}>
      {CHIPS.map((chip) => {
        const active = value === chip.key;
        return (
          <TouchableOpacity
            key={chip.key}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.8}
            onPress={() => onChange(chip.key)}
          >
            <Text
              style={[styles.chipText, active && styles.chipTextActive]}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  chipActive: {
    backgroundColor: "#111827",
  },
  chipText: {
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
});
