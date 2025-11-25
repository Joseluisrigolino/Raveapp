// app/sales/components/manage/TicketsSoldNotFoundComponent.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES } from "@/styles/globalStyles";

export default function TicketsSoldNotFoundComponent() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>
        No se encontró información de entradas vendidas para este evento.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    textAlign: "center",
  },
});
