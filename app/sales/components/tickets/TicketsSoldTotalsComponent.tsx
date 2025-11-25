// app/sales/components/manage/TicketsSoldTotalsComponent.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { OwnerEventTicketsSoldData } from "@/app/events/types/OwnerEventTicketsSold";
import { COLORS, FONT_SIZES } from "@/styles/globalStyles";
import { formatTicketsMoney } from "../../services/useTicketsSoldByEvent";

type Props = {
  totalTickets: OwnerEventTicketsSoldData["totalTickets"];
  totalRevenue: OwnerEventTicketsSoldData["totalRevenue"];
};

export default function TicketsSoldTotalsComponent({ totalTickets, totalRevenue }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.footerText}>
        Total de entradas vendidas:{" "}
        <Text style={styles.totalNumber}>{totalTickets}</Text>
      </Text>
      <Text style={styles.footerText}>
        Total recaudado al momento:{" "}
        <Text style={styles.totalMoney}>{formatTicketsMoney(totalRevenue)}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  footerText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  totalNumber: {
    fontWeight: "bold",
    color: COLORS.info,
  },
  totalMoney: {
    fontWeight: "bold",
    color: COLORS.positive,
  },
});
