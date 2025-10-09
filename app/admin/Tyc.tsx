// src/screens/admin/Tyc.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getTycPdfUrl } from "@/utils/tycApi";
import { COLORS } from "@/styles/globalStyles";

export default function Tyc() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header title="Términos y Condiciones" />

        <View style={styles.content}>
          {loading && (
            <ActivityIndicator size="large" color={COLORS.primary} />
          )}
          {!loading && pdfUrl && (
            <WebView
              source={{ uri: pdfUrl }}
              style={{ flex: 1, width, height }}
            />
          )}
          {/* TODO: aquí irá el selector de archivo y botón de actualizar */}
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
});
