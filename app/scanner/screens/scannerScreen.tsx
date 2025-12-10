// app/scanner/ScannerScreen.tsx
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import ROUTES from "@/routes";
import { useAuth } from "@/app/auth/AuthContext";

import ScannerHeaderComponent from "../components/ScannerHeaderComponent";
import Header from "@/components/layout/HeaderComponent";
import ScannerProfileCardComponent from "../components/ScannerProfileCardComponent";
import ScannerQrCardComponent from "../components/ScannerQrCardComponent";
import ScannerCameraModalComponent from "../components/ScannerCameraModalComponent";

import { useScanner } from "../services/useScanner";

export default function ScannerScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ user?: string }>();
  const loginParam = String(params?.user ?? "");

  const {
    controllerName,
    permission,
    hasPermission,
    processing,
    modalVisible,
    scanning,
    scanMessage,
    scanStatus,
    handleActivateCamera,
    handleBarCodeScanned,
    handleReScan,
    closeModal,
    handleLogout,
    handleStartScan,
  } = useScanner();

  // useScanner ya expone handleLogout que marca allowExitRef y navega
  const onLogout = () => {
    handleLogout && handleLogout();
  };

  // Navegación de resultado ahora la realiza el hook al validar OK.

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header />
      <ScannerHeaderComponent onLogout={onLogout} />
      <ScannerProfileCardComponent controllerName={controllerName} />
      <ScannerQrCardComponent
        hasPermission={hasPermission}
        processing={processing}
        onActivateCamera={handleActivateCamera}
      />
      <ScannerCameraModalComponent
        visible={modalVisible}
        permissionLoading={!permission}
        hasPermission={hasPermission}
        scanning={scanning}
        scanStatus={scanStatus}
        scanMessage={scanMessage}
        onClose={closeModal}
        onReScan={handleReScan}
        onBarCodeScanned={handleBarCodeScanned}
        onStartScan={handleStartScan}
      />

      {/* Navegación a resultado la dispara el one-shot desde el hook al validar */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f5f6fa" },
  // estilos de prueba removidos
});
