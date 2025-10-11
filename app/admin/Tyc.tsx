// src/screens/admin/Tyc.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Dimensions, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getTycPdfUrl } from "@/utils/tycApi";
import { COLORS } from "@/styles/globalStyles";
import * as FileSystem from "expo-file-system/legacy";
import { mediaApi } from "@/utils/mediaApi";

export default function Tyc() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [picked, setPicked] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const { height, width } = Dimensions.get("window");

  useEffect(() => {
    (async () => {
      try {
        const url = await getTycPdfUrl();
        setPdfUrl(url);
      } catch (err) {
        console.error("Error cargando PDF de T&C:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePickPdf = async () => {
    try {
      const DocumentPicker: any = await import("expo-document-picker");
      const res: any = await DocumentPicker.getDocumentAsync({ type: "application/pdf", multiple: false, copyToCacheDirectory: true });
      // Soportar shape antiguo y nuevo de expo-document-picker
      let file: { uri: string; name: string; mimeType?: string } | null = null;
      if (res?.assets?.length) {
        const a = res.assets[0];
        if (res.type !== "cancel" && a?.uri) file = { uri: a.uri, name: a.name || "archivo.pdf", mimeType: a.mimeType || "application/pdf" };
      } else if (res?.type === "success" && res?.uri) {
        file = { uri: res.uri, name: res.name || "archivo.pdf", mimeType: res.mimeType || "application/pdf" };
      }
      if (!file) return; // cancelado
      // Validar extensión y tamaño máximo
      if (!/\.pdf$/i.test(file.name)) {
        file.name = file.name + ".pdf";
      }
      try {
        const info: any = await FileSystem.getInfoAsync(file.uri);
        if (info?.size && info.size > 2 * 1024 * 1024) {
          Alert.alert("Archivo demasiado grande", "El PDF no debe superar los 2MB.");
          return;
        }
      } catch {}
      setPicked({ uri: file.uri, name: file.name, mimeType: file.mimeType || "application/pdf" });
    } catch (e) {
      // noop
    }
  };

  const handleUpdatePdf = async () => {
    if (!picked) {
      Alert.alert("Seleccioná un archivo", "Debés elegir un PDF para actualizar.");
      return;
    }
    try {
      setUpdating(true);
      // Borrar media anterior (si existe) para reemplazarla
      try {
        const data: any = await mediaApi.getByEntidad("archivoTyc");
        if (Array.isArray(data?.media)) {
          for (const m of data.media) {
            if (m?.idMedia) {
              try { await mediaApi.delete(m.idMedia); } catch {}
            }
          }
        }
      } catch {}

      const file = { uri: picked.uri, name: picked.name, type: picked.mimeType || "application/pdf" } as any;
      // Subir nuevo PDF, elevamos límite a 2MB
      await mediaApi.upload("archivoTyc", file, undefined, { maxBytes: 2 * 1024 * 1024 });

      // Refrescar visor
      const url = await getTycPdfUrl();
      setPdfUrl(url);
      setPicked(null);
      Alert.alert("Listo", "Se actualizó el PDF de Términos y Condiciones.");
    } catch (e: any) {
      const msg = e?.message || "No se pudo actualizar el PDF.";
      Alert.alert("Error", msg);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header title="Términos y Condiciones" />

        <View style={styles.content}>
          {/* Selector y botón para actualizar el PDF */}
          <Text style={styles.sectionTitle}>Seleccionar nuevo archivo PDF:</Text>
          <View style={styles.filePickerRow}>
            <TouchableOpacity style={styles.pickButton} onPress={handlePickPdf} disabled={updating}>
              <Text style={styles.pickButtonText}>SELECCIONAR ARCHIVO</Text>
            </TouchableOpacity>
            <View style={styles.fileNameBox}>
              <Text style={styles.fileNameText} numberOfLines={1} ellipsizeMode="tail">
                {picked?.name || "Sin archivos seleccionados"}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePdf} disabled={updating}>
            {updating ? (
              <ActivityIndicator color={"#fff"} />
            ) : (
              <Text style={styles.updateButtonText}>ACTUALIZAR ARCHIVO</Text>
            )}
          </TouchableOpacity>

          {loading && (
            <ActivityIndicator size="large" color={COLORS.primary} />
          )}
          {!loading && pdfUrl && (
            <WebView
              source={{ uri: pdfUrl }}
              style={{ flex: 1, width, height }}
            />
          )}
        </View>

        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
    marginHorizontal: 8,
    marginVertical: 12,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 14,
  },
  filePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  pickButton: {
    backgroundColor: "#1f2937",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pickButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  fileNameBox: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#6b7280",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  fileNameText: {
    color: COLORS.textSecondary,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
