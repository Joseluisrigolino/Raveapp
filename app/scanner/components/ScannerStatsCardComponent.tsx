// app/scanner/components/ScannerStatsCardComponent.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Chip } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";

type Props = { scanCount: number };

export default function ScannerStatsCardComponent({ scanCount }: Props) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Icon name="qr-code-scanner" size={16} color="#6b7280" />
          <Chip compact style={styles.statPill} textStyle={{ fontSize: 12 }}>
            0
          </Chip>
        </View>
        <Text style={styles.statValue}>{scanCount}</Text>
        <Text style={styles.statLabel}>QRs Escaneados Hoy</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statPill: { backgroundColor: "#eef2ff", borderRadius: 8, height: 22 },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginVertical: 6,
  },
  statLabel: { color: "#6b7280", fontSize: 12 },
});
