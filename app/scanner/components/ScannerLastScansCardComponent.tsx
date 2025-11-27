// app/scanner/components/ScannerLastScansCardComponent.tsx
import React, { useState } from "react";
import { View, StyleSheet, Pressable, Modal, ScrollView } from "react-native";
import { Text, Chip, Divider } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import type { LastScanItem } from "@/app/scanner/services/useScanner";

type Props = {
  lastScans: LastScanItem[];
};

export default function ScannerLastScansCardComponent({ lastScans }: Props) {
  const [selected, setSelected] = useState<LastScanItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  function openDetails(item: LastScanItem) {
    setSelected(item);
    setModalVisible(true);
  }

  function closeDetails() {
    setSelected(null);
    setModalVisible(false);
  }
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
          <Pressable key={item.id} onPress={() => openDetails(item)} style={styles.listItem}>
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
          </Pressable>
        ))
      )}

      {/* Details modal */}
      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={closeDetails}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Detalle del escaneo</Text>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalLabel}>ID Entrada</Text>
              <Text style={styles.codeBlock}>{selected?.title}</Text>

              <Text style={styles.modalLabel}>Hora</Text>
              <Text style={styles.codeBlock}>{selected?.subtitle}</Text>

              <Text style={styles.modalLabel}>Estado</Text>
              <Text style={styles.codeBlock}>{selected?.status}</Text>

              <Text style={styles.modalLabel}>Detalles (raw / parsed / apiResp)</Text>
              <Text style={styles.codeBlock}>{JSON.stringify(selected?.details, null, 2)}</Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.closeBtn} onPress={closeDetails}>
                <Text style={styles.closeText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalCard: { width: "100%", maxWidth: 600, backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  modalTitle: { fontWeight: "700", color: "#111827", marginBottom: 8 },
  modalContent: { maxHeight: 360, marginBottom: 12 },
  modalLabel: { color: "#6b7280", fontSize: 12, marginTop: 8 },
  codeBlock: { backgroundColor: "#f3f4f6", padding: 8, borderRadius: 8, fontFamily: "monospace", color: "#111827" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  closeText: { color: "#0f172a", fontWeight: "700" },
});
