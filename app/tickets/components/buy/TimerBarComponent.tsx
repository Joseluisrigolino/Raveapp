// app/tickets/components/buy/TimerBar.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES } from "@/styles/globalStyles";

type Props = {
  timerLabel: string;
  progress: number;
  isExpired: boolean;
};

export default function TimerBar({ timerLabel, progress, isExpired }: Props) {
  return (
    <>
      <View style={styles.reserveHeader}>
        <Text style={styles.reserveText}>Tu reserva expira en</Text>
        <Text style={styles.reserveTimer}>{timerLabel}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: isExpired ? COLORS.negative : "#D926AA",
            },
          ]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  reserveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  reserveText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.smallText,
  },
  reserveTimer: {
    color: COLORS.info,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.borderInput,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
});
