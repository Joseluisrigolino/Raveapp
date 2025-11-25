// app/sales/components/manage/TicketsSoldBackButtonComponent.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type Props = {
  onPress: () => void;
};

export default function TicketsSoldBackButtonComponent({ onPress }: Props) {
  return (
    <TouchableOpacity style={styles.backButton} onPress={onPress}>
      <Text style={styles.backButtonText}>Volver</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: COLORS.alternative,
    paddingVertical: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
    marginTop: 16,
  },
  backButtonText: {
    color: COLORS.cardBg,
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
  },
});
