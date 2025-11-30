// app/tickets/components/buy/TycRow.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type Props = {
  acceptedTyc: boolean;
  toggleAcceptedTyc: () => void;
};

export default function TycRow({ acceptedTyc, toggleAcceptedTyc }: Props) {
  return (
    <View style={styles.tycRow}>
      <TouchableOpacity
        onPress={toggleAcceptedTyc}
        style={[styles.checkbox, acceptedTyc && styles.checkboxChecked]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTyc }}
      >
        {acceptedTyc ? <Text style={styles.checkboxTick}>✓</Text> : null}
      </TouchableOpacity>
      <Text style={styles.tycText}>
        Acepto los Términos y Condiciones y Política de Privacidad.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tycRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardBg,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxTick: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: 14,
  },
  tycText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.smallText,
  },
});
