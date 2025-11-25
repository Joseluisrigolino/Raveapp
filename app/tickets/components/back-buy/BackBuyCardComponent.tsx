import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

type Props = {
  processing?: boolean;
  onGoToTickets: () => void;
};

export default function BackBuyCardComponent({ processing, onGoToTickets }: Props) {
  return (
    <View style={styles.content}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>✓</Text>
        </View>
        <Text style={styles.title}>¡Gracias por tu compra!</Text>
        <Text style={styles.subtitle}>
          Una vez que se procese el pago, recibirás por mail la entrada del evento, y también
          podrás ver tu entrada en la sección
        </Text>

        <TouchableOpacity onPress={onGoToTickets} style={styles.linkWrap}>
          <Text style={styles.link}>mis entradas</Text>
        </TouchableOpacity>

        {processing ? (
          <Text style={styles.processing}>Procesando pago…</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  card: {
    width: "94%",
    backgroundColor: "#EFFFF3",
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#BDE5C8",
    alignItems: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#CFF6DA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  iconText: { color: "#2E7D32", fontSize: 28, fontWeight: "700", lineHeight: 30 },
  title: { fontFamily: FONTS.titleBold, fontSize: 22, color: COLORS.textPrimary, marginBottom: 8, textAlign: "center" },
  subtitle: { fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.body, color: COLORS.textSecondary, textAlign: "center", lineHeight: FONT_SIZES.body * 1.4, marginTop: 6 },
  linkWrap: { marginTop: 10 },
  link: { color: COLORS.primary, fontWeight: "600", textDecorationLine: "underline" },
  processing: { marginTop: 12, color: COLORS.info },
});
