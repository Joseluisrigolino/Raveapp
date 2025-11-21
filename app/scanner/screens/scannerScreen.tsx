// app/scanner/ScannerScreen.tsx
import React, { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, BackHandler } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import ROUTES from "@/routes";
import { useAuth } from "@/app/auth/AuthContext";

import ScannerHeaderComponent from "../components/ScannerHeaderComponent";
import ScannerProfileCardComponent from "../components/ScannerProfileCardComponent";
import ScannerStatsCardComponent from "../components/ScannerStatsCardComponent";
import ScannerQrCardComponent from "../components/ScannerQrCardComponent";
import ScannerCameraModalComponent from "../components/ScannerCameraModalComponent";
import ScannerLastScansCardComponent from "../components/ScannerLastScansCardComponent";

import { useScanner } from "../services/useScanner";

export default function ScannerScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ user?: string }>();
  const { logout } = useAuth() as any;
  const loginParam = String(params?.user ?? "");

  const {
    controllerName,
    scanCount,
    lastScans,
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
  } = useScanner({ loginParam });

  const allowExitRef = useRef(false);

  // bloquear botón atrás físico
  useEffect(() => {
    const onBack = () => true;
    const subBack = BackHandler.addEventListener("hardwareBackPress", onBack);
    const subNav = navigation.addListener("beforeRemove", (e: any) => {
      if (!allowExitRef.current) e.preventDefault();
    });
    return () => {
      subBack.remove();
      // @ts-ignore
      subNav && subNav();
    };
  }, [navigation]);

  const handleLogout = () => {
    try {
      allowExitRef.current = true;
      logout && logout();
    } finally {
      router.replace(ROUTES.LOGIN.LOGIN);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScannerHeaderComponent onLogout={handleLogout} />
      <ScannerProfileCardComponent controllerName={controllerName} />
      <ScannerStatsCardComponent scanCount={scanCount} />
      <ScannerQrCardComponent
        hasPermission={hasPermission}
        processing={processing}
        onActivateCamera={handleActivateCamera}
      />
      <ScannerLastScansCardComponent lastScans={lastScans} />

      <ScannerCameraModalComponent
        visible={modalVisible}
        permissionLoaded={!!permission}
        hasPermission={hasPermission}
        scanning={scanning}
        scanStatus={scanStatus}
        scanMessage={scanMessage}
        onClose={closeModal}
        onReScan={handleReScan}
        onBarCodeScanned={handleBarCodeScanned}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f5f6fa" },
});
