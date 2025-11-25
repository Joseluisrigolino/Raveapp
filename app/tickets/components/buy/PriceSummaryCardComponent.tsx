// app/tickets/components/buy/PriceSummaryCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type Props = {
  subtotal: number;
  cargoServicio: number;
  total: number;
};

export default function PriceSummaryCard({
  subtotal,
  cargoServicio,
  total,
}: Props) {
  return (
    <View style={styles.priceSummary}>
      <Text style={styles.priceLine}>
        Subtotal: <Text style={styles.priceValue}>${subtotal}</Text>
      </Text>
      <Text style={styles.priceLine}>
        Cargo por servicio (10%):{" "}
        <Text style={styles.serviceFee}>${cargoServicio}</Text>
      </Text>
      <Text style={[styles.priceLine, styles.priceTotal]}>
        Total: ${total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  priceSummary: {
    marginVertical: 12,
    padding: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
  },
  priceLine: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  priceValue: {
    fontWeight: "bold",
  },
  serviceFee: {
    color: COLORS.positive,
    fontWeight: "bold",
  },
  priceTotal: {
    marginTop: 6,
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
  },
});
