// src/screens/admin/components/tyc/TycPreviewCardComponent.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { COLORS } from "@/styles/globalStyles";

type Props = {
  pdfUrl: string | null;
  loading: boolean;
  previewFailed: boolean;
  onPreviewError: () => void;
};

export default function TycPreviewCardComponent({
  pdfUrl,
  loading,
  previewFailed,
  onPreviewError,
}: Props) {
  return (
    <View style={styles.previewCard}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : pdfUrl ? (
        previewFailed ? (
          <View style={styles.previewErrorBox}>
            <Text style={styles.previewErrorText}>
              No se pudo previsualizar el PDF en esta vista. Usá los botones de
              descarga o compartir para abrir el archivo.
            </Text>
          </View>
        ) : (
          <WebView
            source={{
              uri:
                Platform.OS === "android" && pdfUrl
                  ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(
                      pdfUrl
                    )}`
                  : pdfUrl,
            }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            startInLoadingState
            onError={onPreviewError}
            onHttpError={onPreviewError}
            androidLayerType="software"
            style={styles.webView}
          />
        )
      ) : (
        <View style={styles.noDocBox}>
          <Text style={styles.noDocText}>No hay documento para mostrar.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    flex: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  webView: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewErrorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  previewErrorText: {
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  noDocBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  noDocText: {
    color: COLORS.textSecondary,
  },
});
