// app/sales/components/manage/TicketsSoldHeaderComponent.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES } from "@/styles/globalStyles";

type Props = {
  eventName: string;
  lastUpdate: string;
};

export default function TicketsSoldHeaderComponent({ eventName, lastUpdate }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entradas vendidas de {eventName}</Text>
      <Text style={styles.subInfo}>Información al {lastUpdate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subInfo: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
