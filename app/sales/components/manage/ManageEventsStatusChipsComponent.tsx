import React from "react";
import { ScrollView, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, RADIUS, FONT_SIZES } from "@/styles/globalStyles";
import { ManageFilterStatus } from "../../services/useManageSalesEvents";

type Props = {
  value: ManageFilterStatus;
  onChange: (value: ManageFilterStatus) => void;
};

const CHIPS: { key: ManageFilterStatus; label: string }[] = [
  { key: "en_venta", label: "En venta" },
  { key: "finalizado", label: "Finalizados" },
  { key: "fin_venta", label: "Venta finalizada" },
  { key: "cancelado", label: "Cancelados" },
];

export default function ManageEventsStatusChipsComponent({
  value,
  onChange,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
    >
      {CHIPS.map((chip) => {
        const active = value === chip.key;
        return (
          <TouchableOpacity
            key={chip.key}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.8}
            onPress={() => onChange(chip.key)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: "row",
    // match FiltroMisTickets spacing
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.chip,
    marginRight: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  chipActive: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.textSecondary,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    marginLeft: 0,
  },
  chipTextActive: {
    color: COLORS.textPrimary,
  },
});
