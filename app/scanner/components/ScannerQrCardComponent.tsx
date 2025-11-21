// app/scanner/components/ScannerQrCardComponent.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";

type Props = {
  hasPermission: boolean;
  processing: boolean;
  onActivateCamera: () => void;
};

export default function ScannerQrCardComponent({
  hasPermission,
  processing,
  onActivateCamera,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Escáner QR</Text>

      <View style={styles.scannerBox}>
        <View className="scannerDashed" style={styles.scannerDashed}>
          <Icon name="qr-code-2" size={44} color="#9ca3af" />
          <Text style={styles.scannerHint}>Apunta la cámara al código QR</Text>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={onActivateCamera}
        style={styles.primaryBtn}
        contentStyle={{ height: 44 }}
        labelStyle={{ fontWeight: "700", color: "#ffffff" }}
        loading={processing}
      >
        {hasPermission === false
          ? "Permiso cámara denegado"
          : "Activar Cámara"}
      </Button>
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
  cardTitle: { fontWeight: "700", color: "#111827", marginBottom: 10 },
  scannerBox: { alignItems: "center", marginBottom: 10 },
  scannerDashed: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  scannerHint: { color: "#6b7280", marginTop: 8 },
  primaryBtn: { backgroundColor: "#0f172a", borderRadius: 10, marginTop: 8 },
});
