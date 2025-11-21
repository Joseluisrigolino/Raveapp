// app/scanner/components/ScannerLastScansCardComponent.tsx
import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Chip, Divider } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import type { LastScanItem } from "@/app/scanner/services/useScanner";

type Props = {
  lastScans: LastScanItem[];
};

export default function ScannerLastScansCardComponent({ lastScans }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.listHeader}>
        <Text style={styles.cardTitle}>Últimos escaneos de la sesión</Text>
        <Pressable onPress={() => {}}>
          <Text style={styles.link}>Ver todos</Text>
        </Pressable>
      </View>

      <Divider style={styles.divider} />

      {lastScans.length === 0 ? (
        <Text style={styles.emptyText}>No hay escaneos aún</Text>
      ) : (
        lastScans.map((item) => (
          <View key={item.id} style={styles.listItem}>
            <View style={styles.itemLeft}>
              <View style={styles.itemIcon}>
                <Icon name="confirmation-number" size={18} color="#0f172a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1} ellipsizeMode="middle">
                  {item.title}
                </Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
              <Chip
                compact
                style={[styles.badge, item.valid ? styles.badgeValid : styles.badgeInvalid]}
                textStyle={{ color: "#ffffff", fontWeight: "700" }}
              >
                {item.status}
              </Chip>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontWeight: "700", color: "#111827" },
  link: { color: "#0f172a", fontWeight: "700" },
  divider: { marginVertical: 8, backgroundColor: "#e6e9ef" },
  emptyText: { color: "#6b7280", textAlign: "center", marginVertical: 8 },
  listItem: { paddingVertical: 8 },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  itemTitle: { fontWeight: "700", color: "#111827" },
  itemSubtitle: { color: "#6b7280", fontSize: 12 },
  badge: {
    borderRadius: 8,
    height: 24,
    justifyContent: "center",
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  badgeValid: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  badgeInvalid: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
});
