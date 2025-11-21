// src/screens/admin/components/tyc/TycMetadataCardComponent.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { COLORS } from "@/styles/globalStyles";

type Props = {
  fileName?: string;
  sizeLabel: string;
  updating: boolean;
  onChangePdf: () => void;
  onDownload: () => void;
  onShare: () => void;
};

export default function TycMetadataCardComponent({
  fileName,
  sizeLabel,
  updating,
  onChangePdf,
  onDownload,
  onShare,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.iconCircle}>
          <Icon name="picture-as-pdf" color="#374151" size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Términos y Condiciones</Text>
          <Text
            style={styles.cardFileName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {fileName || "archivo.pdf"}
          </Text>
        </View>
        <Text style={styles.cardSize}>{sizeLabel}</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={onDownload}>
          <Icon name="download" size={20} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onShare}>
          <Icon name="ios-share" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.changeButton}
        onPress={onChangePdf}
        disabled={updating}
      >
        {updating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.changeButtonContent}>
            <Icon
              name="file-upload"
              color="#fff"
              size={18}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.changeButtonText}>Cambiar archivo PDF</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
  cardFileName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  cardSize: {
    color: "#6b7280",
    fontSize: 12,
    marginLeft: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginLeft: 8,
  },
  changeButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  changeButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  changeButtonText: { color: "#fff", fontWeight: "700" },
});
