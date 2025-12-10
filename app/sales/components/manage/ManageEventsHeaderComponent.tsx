import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/styles/globalStyles";

type Props = {
  title?: string;
};

export default function ManageEventsHeaderComponent({
  title = "Reporte de ventas de entradas",
}: Props) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        Seleccioná un evento para ver el reporte de entradas
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 10,
  },
});
