// app/tickets/components/buy/PurchaseSummaryCard.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { GroupedSelectionMap } from "@/app/tickets/types/BuyProps";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type Props = {
  eventTitle: string;
  imageUrl?: string | null;
  groupedSelection: GroupedSelectionMap;
  fechaLabel: (idFecha: string) => string;
};

export default function PurchaseSummaryCard({
  eventTitle,
  imageUrl,
  groupedSelection,
  fechaLabel,
}: Props) {
  return (
    <>
      <Text style={styles.title}>Resumen de tu compra</Text>
      <View style={styles.summaryBlock}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.summaryImage} />
        ) : null}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryEventTitle}>Evento: {eventTitle}</Text>
          {Object.entries(groupedSelection).map(([idFecha, items]) => {
            if (!items.length) return null;
            const daySubtotal = items.reduce(
              (acc, it) => acc + it.qty * it.price,
              0
            );
            return (
              <View key={idFecha || "unknown"} style={styles.summaryDayGroup}>
                {items.map((it) => (
                  <Text key={it.idEntrada} style={styles.summaryLine}>
                    <Text style={styles.summaryLineBold}>
                      {it.qty} x {it.label}
                    </Text>{" "}
                    para el día {fechaLabel(idFecha)} a ${it.price} c/u
                  </Text>
                ))}
                <Text style={styles.summaryDaySubtotal}>
                  Subtotal: ${daySubtotal}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginVertical: 12,
    textAlign: "center",
  },
  summaryBlock: {
    flexDirection: "column",
    gap: 10,
    marginBottom: 12,
  },
  summaryImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: RADIUS.card,
    backgroundColor: "#eee",
  },
  summaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    elevation: 2,
  },
  summaryEventTitle: {
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
    fontSize: FONT_SIZES.body,
  },
  summaryDayGroup: {
    marginBottom: 6,
  },
  summaryLine: {
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  summaryLineBold: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
  summaryDaySubtotal: {
    marginTop: 4,
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: FONT_SIZES.smallText,
    textAlign: "right",
  },
});
