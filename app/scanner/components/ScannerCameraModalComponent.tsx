import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable, Platform } from "react-native";
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
  onStartScan?: () => void;
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
  onStartScan,
}: Props) {
  // Forzar remount del CameraView y evitar eventos de frames previos
  const [cameraKey, setCameraKey] = useState(0);
  const scanStartRef = useRef<number>(0);
  const WARMUP_MS = 400; // milisegundos para ignorar eventos iniciales

  // Cuando comienza un nuevo escaneo, reiniciamos la vista de cámara y marcamos inicio
  useEffect(() => {
    if (scanning) {
      try {
        setCameraKey((k) => k + 1);
        scanStartRef.current = Date.now();
      } catch {}
    } else {
      // si no está escaneando, limpiar marca de inicio
      scanStartRef.current = 0;
    }
  }, [scanning]);

  // Wrapper que ignora eventos demasiado rápidos (posibles frames en caché)
  const handleScanEvent = useCallback(
    (result: any) => {
      const started = scanStartRef.current || 0;
      if (started > 0) {
        const elapsed = Date.now() - started;
        if (elapsed < WARMUP_MS) {
          // Ignorar el evento si llega inmediatamente al activar el escaneo
          return;
        }
      }
      onBarCodeScanned && onBarCodeScanned(result);
    },
    [onBarCodeScanned]
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Escanear QR</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="close" size={20} color="#fff" />
          </Pressable>
        </View>

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
              key={cameraKey}
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanning ? handleScanEvent : undefined}
            />
          )}

          {/* Botón para iniciar escaneo manualmente */}
          {hasPermission && !scanning && scanStatus === null && onStartScan && (
            <View style={{ position: "absolute", bottom: 24, left: 0, right: 0, alignItems: "center" }}>
              <Pressable onPress={onStartScan} style={{ backgroundColor: "#0f172a", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Escanear ahora</Text>
              </Pressable>
            </View>
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
                <Pressable style={styles.reScanBtn} onPress={onReScan}>
                  <Text style={styles.reScanText}>Re-escanear</Text>
                </Pressable>
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
