// app/sales/components/manage/TicketsSoldCardListComponent.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { OwnerEventTicketsSoldData } from "@/app/events/types/OwnerEventTicketsSold";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { formatTicketsMoney } from "../../services/useTicketsSoldByEvent";

type Props = {
  rows: OwnerEventTicketsSoldData["rows"];
};

export default function TicketsSoldCardListComponent({ rows }: Props) {
  return (
    <View style={styles.cardsContainer}>
      {rows.map((row, index) => (
        <View key={index} style={styles.ticketCard}>
          <Text style={styles.ticketTitle}>{row.type}</Text>

          <View style={styles.ticketInfoRow}>
            <Text style={styles.label}>Precio:</Text>
            <Text style={styles.value}>{formatTicketsMoney(row.price)}</Text>
          </View>

          <View style={styles.ticketInfoRow}>
            <Text style={styles.label}>Cantidad:</Text>
            <Text style={styles.value}>{row.quantity}</Text>
          </View>

          <View style={styles.ticketInfoRow}>
            <Text style={styles.label}>Total:</Text>
            <Text style={styles.value}>{formatTicketsMoney(row.total)}</Text>
          </View>

          <View style={styles.ticketInfoRow}>
            <Text style={styles.label}>En stock:</Text>
            <Text style={styles.value}>{row.inStock}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardsContainer: {
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  ticketInfoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    marginRight: 4,
  },
  value: {
    color: COLORS.textPrimary,
  },
});
