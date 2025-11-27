import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  SafeAreaView,
} from "react-native";
import { CameraView } from "expo-camera";
import { MaterialIcons as Icon } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  hasPermission: boolean;
  permissionLoading: boolean;
  scanning: boolean;
  scanStatus: "ok" | "error" | null;
  scanMessage: string;
  onClose: () => void;
  onBarCodeScanned: (result: any) => void;
  onReScan: () => void;
};

export default function ScannerCameraModalComponent({
  visible,
  hasPermission,
  permissionLoading,
  scanning,
  scanStatus,
  scanMessage,
  onClose,
  onBarCodeScanned,
  onReScan,
}: Props) {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.safeTop} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Escanear QR</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Icon name="close" size={20} color="#fff" />
            </Pressable>
          </View>
        </SafeAreaView>

        <View style={styles.scannerWrapper}>
          {permissionLoading && (
            <Text style={styles.infoText}>Solicitando permiso…</Text>
          )}

          {!permissionLoading && !hasPermission && (
            <Text style={styles.errorText}>
              No hay permiso de cámara. Habilitalo desde la configuración.
            </Text>
          )}

          {hasPermission && (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanning ? onBarCodeScanned : undefined}
            />
          )}

          {!scanning && scanStatus && (
            <View style={styles.resultOverlay}>
              <Icon
                name={scanStatus === "ok" ? "check-circle" : "error"}
                size={64}
                color={scanStatus === "ok" ? "#16a34a" : "#dc2626"}
              />
              <Text style={styles.resultText}>{scanMessage}</Text>
              <View style={styles.resultActions}>
                {scanStatus === "error" && (
                  <Pressable style={styles.reScanBtn} onPress={onReScan}>
                    <Text style={styles.reScanText}>Re-escanear</Text>
                  </Pressable>
                )}
                <Pressable style={styles.closeTextBtn} onPress={onClose}>
                  <Text style={styles.closeText}>Cerrar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: "#000" },
  modalHeader: {
    height: 64,
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 8 : 6,
  },
  modalTitle: { color: "#fff", fontWeight: "700" },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  scannerWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
  infoText: { color: "#e5e7eb" },
  errorText: { color: "#fecaca", textAlign: "center", paddingHorizontal: 16 },
  resultOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(15,23,42,0.9)",
    alignItems: "center",
  },
  resultText: { color: "#fff", marginTop: 8, textAlign: "center" },
  resultActions: { flexDirection: "row", gap: 12, marginTop: 12 },
  reScanBtn: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reScanText: { color: "#fff", fontWeight: "700" },
  closeTextBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeText: { color: "#fff" },
});
