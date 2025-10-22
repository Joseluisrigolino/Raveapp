// src/screens/admin/Tyc.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Dimensions, Text, TouchableOpacity, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getTycPdfUrl } from "@/utils/tycApi";
import { COLORS } from "@/styles/globalStyles";
import * as FileSystem from "expo-file-system/legacy";
import { mediaApi } from "@/utils/mediaApi";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as WebBrowser from "expo-web-browser";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export default function Tyc() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [meta, setMeta] = useState<{ name?: string; sizeBytes?: number; updatedAt?: string } | null>(null);
  const [zoomPct, setZoomPct] = useState<number>(100);
  const { height, width } = Dimensions.get("window");

  useEffect(() => {
    (async () => {
      try {
        const url = await getTycPdfUrl();
        setPdfUrl(url);
        await loadMediaMeta();
      } catch (err) {
        console.error("Error cargando PDF de T&C:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadMediaMeta = async () => {
    try {
      const data: any = await mediaApi.getByEntidad("archivoTyc");
      const m = Array.isArray(data?.media) && data.media.length ? data.media[0] : null;
      let name: string | undefined = m?.nombre || m?.fileName || m?.dsNombre || undefined;
      let sizeBytes: number | undefined = (typeof m?.size === 'number' && m.size) || (typeof m?.peso === 'number' && m.peso) || undefined;
      let updatedAt: string | undefined = m?.fecha || m?.dtCreacion || m?.createdAt || m?.fecAlta || undefined;
      // derive name from URL if missing
      if (!name && pdfUrl) {
        try { name = decodeURIComponent(pdfUrl.split("/").pop() || ""); } catch { name = pdfUrl.split("/").pop() || undefined; }
      }
      // if size missing, try HEAD request
      if (!sizeBytes && pdfUrl) {
        try {
          const resp = await fetch(pdfUrl, { method: 'HEAD' });
          const len = resp.headers.get('content-length');
          const n = len ? Number(len) : 0;
          if (Number.isFinite(n) && n > 0) sizeBytes = n;
        } catch {}
      }
      setMeta({ name, sizeBytes, updatedAt });
    } catch {
      setMeta(null);
    }
  };

  const handleChangePdf = async () => {
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
      // Cargar inmediatamente (flujo de 1 botón)
      await performUpload(file);
    } catch (e) {
      // noop
    }
  };

  const performUpload = async (picked: { uri: string; name: string; mimeType?: string }) => {
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
      await mediaApi.upload("archivoTyc", file, undefined, { maxBytes: 2 * 1024 * 1024 });
      const url = await getTycPdfUrl();
      setPdfUrl(url);
      await loadMediaMeta();
      Alert.alert("Listo", "Se actualizó el PDF de Términos y Condiciones.");
    } catch (e: any) {
      const msg = e?.message || "No se pudo actualizar el PDF.";
      Alert.alert("Error", msg);
    } finally {
      setUpdating(false);
    }
  };

  const formatBytesMB = (n?: number) => {
    if (!Number.isFinite(n as number) || !n) return "—";
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDatePretty = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(String(iso));
    if (!isFinite(d.getTime())) return "—";
    const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const dd = d.getDate().toString().padStart(2, '0');
    const mm = months[d.getMonth()] || "";
    const yyyy = d.getFullYear();
    return `${dd} ${mm} ${yyyy}`;
  };

  const handleOpenFullscreen = async () => {
    if (!pdfUrl) return;
    try { await WebBrowser.openBrowserAsync(pdfUrl); } catch { Linking.openURL(pdfUrl); }
  };

  const handlePrint = async () => {
    if (!pdfUrl) return;
    try { await Print.printAsync({ uri: pdfUrl }); } catch (e) { Alert.alert("Error", "No se pudo abrir el diálogo de impresión."); }
  };

  const handleShare = async () => {
    if (!pdfUrl) return;
    try {
      const fileName = meta?.name || 'terminos.pdf';
      const dest = FileSystem.cacheDirectory + fileName;
      const res = await FileSystem.downloadAsync(pdfUrl, dest);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri);
      } else {
        Alert.alert('Guardado', 'Se descargó el archivo en caché interna.');
      }
    } catch (e) {
      Linking.openURL(pdfUrl).catch(() => Alert.alert('Error', 'No se pudo compartir/descargar.'));
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;
    try {
      const fileName = meta?.name || 'terminos.pdf';
      const dest = FileSystem.documentDirectory + fileName;
      await FileSystem.downloadAsync(pdfUrl, dest);
      Alert.alert('Descargado', 'El archivo se descargó en Documentos.');
    } catch (e) {
      Linking.openURL(pdfUrl).catch(() => Alert.alert('Error', 'No se pudo descargar.'));
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header title="Términos y Condiciones" />

        <View style={styles.content}>
          {/* Card metadata */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircle}><Icon name="picture-as-pdf" color="#374151" size={22} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Términos y Condiciones</Text>
                <Text style={styles.cardFileName} numberOfLines={1} ellipsizeMode="tail">{meta?.name || "archivo.pdf"}</Text>
                <Text style={styles.cardUpdate}>Última actualización: {formatDatePretty(meta?.updatedAt)}</Text>
              </View>
              <Text style={styles.cardSize}>{formatBytesMB(meta?.sizeBytes)}</Text>
              <TouchableOpacity style={styles.iconBtn} onPress={handleDownload}>
                <Icon name="download" size={20} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
                <Icon name="ios-share" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.changeButton} onPress={handleChangePdf} disabled={updating}>
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="file-upload" color="#fff" size={18} style={{ marginRight: 8 }} />
                  <Text style={styles.changeButtonText}>Cambiar archivo PDF</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Zoom controls */}
          <View style={styles.zoomRow}>
            <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoomPct((z) => Math.max(25, z - 25))}><Text style={styles.zoomBtnText}>−</Text></TouchableOpacity>
            <Text style={styles.zoomPctText}>{zoomPct}%</Text>
            <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoomPct((z) => Math.min(300, z + 25))}><Text style={styles.zoomBtnText}>+</Text></TouchableOpacity>
          </View>

          {/* Preview card */}
          <View style={styles.previewCard}>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : pdfUrl ? (
              <WebView
                source={{ uri: pdfUrl }}
                style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
                scalesPageToFit
              />
            ) : (
              <Text style={{ color: COLORS.textSecondary }}>No hay documento para mostrar.</Text>
            )}
            <View style={styles.pageFooter}>
              <TouchableOpacity disabled style={styles.navArrow}><Icon name="chevron-left" size={22} color="#6b7280" /></TouchableOpacity>
              <Text style={styles.pageText}>Página 1</Text>
              <TouchableOpacity disabled style={styles.navArrow}><Icon name="chevron-right" size={22} color="#6b7280" /></TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleOpenFullscreen}>
            <Icon name="visibility" size={18} color="#111827" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Ver en pantalla completa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handlePrint}>
            <Icon name="print" size={18} color="#111827" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Imprimir documento</Text>
          </TouchableOpacity>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  cardFileName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  cardUpdate: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  cardSize: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginLeft: 8,
  },
  changeButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  changeButtonText: { color: '#fff', fontWeight: '700' },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  zoomBtn: {
    width: 42,
    height: 32,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  zoomBtnText: { fontSize: 18, color: COLORS.textPrimary },
  zoomPctText: { marginHorizontal: 12, color: COLORS.textPrimary, fontWeight: '700' },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    flex: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  pageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  navArrow: {
    width: 36,
    height: 32,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  pageText: { color: COLORS.textPrimary, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  actionBtnText: { color: '#111827', fontWeight: '700' },
});
