// app/scanner/components/ScannerHeaderComponent.tsx
import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";

type Props = {
  onLogout: () => void;
};

export default function ScannerHeaderComponent({ onLogout }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.headerBadge}>
          <Icon name="security" size={16} color="#e5e7eb" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Panel Controlador</Text>
          <Text style={styles.headerSubtitle}>Control de Acceso QR</Text>
        </View>
      </View>

      <Pressable onPress={onLogout} style={styles.headerRight}>
        <Icon name="logout" size={18} color="#e5e7eb" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  headerTitle: { color: "#e5e7eb", fontWeight: "700" },
  headerSubtitle: { color: "#9ca3af", fontSize: 12 },
  headerRight: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
});
