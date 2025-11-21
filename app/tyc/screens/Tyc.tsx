// src/screens/admin/Tyc.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS } from "@/styles/globalStyles";

import { useTyc } from "../services/useTyc";
import TycMetadataCardComponent from "../components/TycMetadataCardComponent";
import TycPreviewCardComponent from "../components/TycPreviewCardComponent";

export default function Tyc() {
  const {
    pdfUrl,
    meta,
    sizeLabel,
    loading,
    updating,
    previewFailed,
    handleChangePdf,
    handleShare,
    handleDownload,
    handlePreviewError,
  } = useTyc();

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header title="Términos y Condiciones" />

        <View style={styles.content}>
          <TycMetadataCardComponent
            fileName={meta?.name}
            sizeLabel={sizeLabel}
            updating={updating}
            onChangePdf={handleChangePdf}
            onDownload={handleDownload}
            onShare={handleShare}
          />

          <TycPreviewCardComponent
            pdfUrl={pdfUrl}
            loading={loading}
            previewFailed={previewFailed}
            onPreviewError={handlePreviewError}
          />
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
