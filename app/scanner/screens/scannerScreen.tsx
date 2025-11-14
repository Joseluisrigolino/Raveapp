import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  BackHandler,
  Modal,
} from "react-native";
import { Text, Button, Divider, Chip } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useAuth } from "@/app/auth/AuthContext";
import { getProfile } from "@/app/auth/userHelpers";
import { getControllerUsers } from "@/app/auth/apis/user-controller/controllerApi";
import ROUTES from "@/routes";
import { CameraView, useCameraPermissions } from "expo-camera";
import { controlarEntrada } from "@/app/scanner/apis/ScannerApi";

export default function ScannerScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ user?: string }>();
  const { user, logout } = useAuth() as any;
  const loginParam = String(params?.user ?? "");
  const [controllerName, setControllerName] = React.useState<string>(
    loginParam || "Controlador"
  );
  const [scanCount, setScanCount] = React.useState<number>(0); // reseteado a 0
  const [lastScans, setLastScans] = React.useState<any[]>([]); // vacío por ahora
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted ?? false;
  const [scanning, setScanning] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [scanMessage, setScanMessage] = React.useState<string>("");
  const [scanStatus, setScanStatus] = React.useState<"ok" | "error" | null>(
    null
  );
  const allowExitRef = React.useRef(false);
  // Flag inmediato (no dependiente de render) para evitar escaneos múltiples en ráfaga
  const processingFlagRef = React.useRef(false);

  React.useEffect(() => {
    (async () => {
      try {
        if (!user?.username) {
          // si no hay usuario de app, mostramos el loginParam si vino
          if (loginParam) setControllerName(loginParam);
          return;
        }
        const profile = await getProfile(user.username);
        const orgId = String(profile?.idUsuario ?? "");
        if (!orgId) return;
        const controllers = await getControllerUsers(orgId);
        const match = controllers.find(
          (c) =>
            c.username?.trim().toLowerCase() === loginParam.trim().toLowerCase()
        );
        if (match?.username) setControllerName(match.username);
      } catch {
        // ignorar fallos; mantener nombre previo
      }
    })();
  }, [user?.username, loginParam]);

  // Bloquear vuelta atrás (hardware y gestos), salvo cuando hacemos logout explícito
  React.useEffect(() => {
    const onBack = () => true; // consumir back
    const subBack = BackHandler.addEventListener("hardwareBackPress", onBack);
    const subNav = navigation.addListener("beforeRemove", (e: any) => {
      if (!allowExitRef.current) {
        e.preventDefault();
      }
    });
    return () => {
      subBack.remove();
      subNav && (subNav as any)();
    };
  }, [navigation]);

  const handleActivateCamera = React.useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted?.granted) {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a la cámara para escanear el QR."
        );
        return;
      }
    }
    setScanning(true);
    setModalVisible(true);
    setScanMessage("");
    setScanStatus(null);
  }, [hasPermission, requestPermission]);

  function parseQrData(
    data: string
  ): { idEntrada: string; mdQr: string } | null {
    const raw = (data || "").trim();
    if (!raw) return null;

    // 1) JSON directo u objetos similares (también soporta arrays [idEntrada, mdQr])
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        const idEntrada = String(parsed[0] ?? "").trim();
        const mdQr = String(parsed[1] ?? "").trim();
        if (idEntrada) return { idEntrada, mdQr };
      } else if (parsed && typeof parsed === 'object') {
        const idEntrada =
          parsed?.idEntrada ?? parsed?.entrada ?? parsed?.Entrada ?? parsed?.id ?? null;
        const mdQr =
          parsed?.mdQr ?? parsed?.mdQR ?? parsed?.qr ?? parsed?.codigoQr ?? parsed?.cod_qr ?? "";
        if (idEntrada) return { idEntrada: String(idEntrada), mdQr: String(mdQr || "") };
      }
    } catch {}

    // 2) URL o querystring: ?idEntrada=...&mdQr=... (acepta variantes de claves)
    try {
      let qs = raw;
      if (/^https?:\/\//i.test(raw)) {
        const u = new URL(raw);
        qs = u.search.substring(1);
      }
      if (qs.includes("=")) {
        const params = new URLSearchParams(qs.startsWith("?") ? qs : `?${qs}`);
        const get = (k: string) => params.get(k) ?? undefined;
        const idEntrada =
          get("idEntrada") || get("IdEntrada") || get("entrada") || get("Entrada") || get("id") || undefined;
        const mdQr =
          get("mdQr") || get("mdQR") || get("MdQr") || get("MDQR") || get("qr") || get("codigoQr") || get("cod_qr") || "";
        if (idEntrada) return { idEntrada: String(idEntrada), mdQr: String(mdQr || "") };
      }
    } catch {}

    // 3) CSV simple: "idEntrada,mdQr" (dos strings separados por coma)
    const csvParts = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (csvParts.length === 2) {
      return { idEntrada: csvParts[0], mdQr: csvParts[1] };
    }

    // 4) Texto plano con separadores: soportar 'Entrada:123|Evento:abc|Fecha:...' y variantes
    const map: Record<string, string> = {};
    raw
      .split(/[|;\n,]/) // separadores comunes en nuestros PDFs
      .map((seg) => seg.trim())
      .filter(Boolean)
      .forEach((pair) => {
        const [k, ...rest] = pair.split(/[:=]/);
        const key = (k || "").trim().toLowerCase();
        const val = rest.join(":").trim();
        if (key && val) map[key] = val;
      });
    const idEntrada = map["identrada"] || map["entrada"] || map["id"];
    const mdQr = map["mdqr"] || map["qr"] || map["codigoqr"] || map["cod_qr"] || "";
    if (idEntrada) return { idEntrada: String(idEntrada), mdQr: String(mdQr || "") };

    return null;
  }

  const handleBarCodeScanned = async (result: any) => {
    // Cortacircuito inmediato para ráfagas del escáner antes de que React re-renderice
    if (processingFlagRef.current) return;
    processingFlagRef.current = true;
    // Detener el flujo de nuevos eventos del escáner mientras procesamos este
    setScanning(false);
    setProcessing(true);
    try {
      const rawValue = (result?.data && typeof result.data === 'string')
        ? result.data
        : (Array.isArray(result?.data?.barcodes) ? result.data.barcodes[0]?.data : (result?.rawValue || ''));
      const dataStr = typeof rawValue === 'string' ? rawValue : String(rawValue || '');
      try { console.log('[QR] raw scan result object:', result); } catch {}
      try { console.log('[QR] extracted rawValue:', dataStr); } catch {}
      const parsed = parseQrData(dataStr);
      if (!parsed) {
        try { console.warn('[QR] parse failed for dataStr:', dataStr); } catch {}
        setScanStatus("error");
        setScanMessage("Formato de QR inválido");
        setProcessing(false);
        return;
      }
      try { console.log('[QR] parsed payload:', parsed); } catch {}
      // Llamar API
      const apiResp = await controlarEntrada(parsed);
      try { console.log('[QR] controlarEntrada response:', apiResp); } catch {}
      // Extraer estado/mensaje
      const valido =
        (typeof apiResp === 'boolean') ? apiResp :
        (apiResp?.valido ?? apiResp?.isValid ?? apiResp?.ok ?? false);
      const mensaje =
        apiResp?.mensaje ??
        apiResp?.message ??
        apiResp?.status ??
        (valido ? "Entrada válida" : "Entrada inválida");

      // Actualizar listas (siempre sumamos al historial)
      setScanCount((c) => c + 1);
      setLastScans((prev) => [
        {
          id: Date.now().toString(),
          title: parsed.idEntrada,
          subtitle: new Date().toLocaleTimeString(),
          valid: !!valido,
          status: valido ? "OK" : "ERROR",
        },
        ...prev.slice(0, 19),
      ]);

      if (valido) {
        // Caso éxito: cerrar cámara y volver a la pantalla principal del escáner
        try { console.log('[QR] válido=true, cerrando cámara y volviendo'); } catch {}
        setScanStatus("ok");
        setScanMessage(mensaje);
        closeModal();
        return;
      }

      // Caso error: mantener modal abierto y mostrar overlay para reintentar
      setScanStatus("error");
      setScanMessage(mensaje);
    } catch (e: any) {
      setScanStatus("error");
      setScanMessage(
        "Fallo al validar: " + (e?.message || "Error desconocido")
      );
    } finally {
      setProcessing(false);
      processingFlagRef.current = false;
      // Detener escaneo hasta que usuario decida reintentar
      setScanning(false);
    }
  };

  const handleReScan = () => {
    setScanStatus(null);
    setScanMessage("");
    setScanning(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setScanning(false);
  };

  const handleLogout = () => {
    try {
      allowExitRef.current = true; // permitir salir de esta pantalla
      logout && logout(); // cerrar sesión realmente (borra storage y estado)
    } finally {
      router.replace(ROUTES.LOGIN.LOGIN);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerBadge}>
            <Icon name="security" size={16} color="#e5e7eb" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Panel Controlador</Text>
            <Text style={styles.headerSubtitle}>Control de Acceso QR</Text>
          </View>
        </View>
        <Pressable onPress={handleLogout} style={styles.headerRight}>
          <Icon name="logout" size={18} color="#e5e7eb" />
        </Pressable>
      </View>

      {/* Perfil */}
      <View style={styles.profileCard}>
        <View style={styles.profileLeft}>
          <View style={styles.avatar}>
            <Icon name="person" size={22} color="#0f172a" />
          </View>
          <View>
            <Text style={styles.profileName}>{controllerName}</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Icon name="qr-code-scanner" size={16} color="#6b7280" />
            <Chip compact style={styles.statPill} textStyle={{ fontSize: 12 }}>
              0
            </Chip>
          </View>
          <Text style={styles.statValue}>{scanCount}</Text>
          <Text style={styles.statLabel}>QRs Escaneados Hoy</Text>
        </View>
      </View>

      {/* Escáner QR */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Escáner QR</Text>
        <View style={styles.scannerBox}>
          <View style={styles.scannerDashed}>
            <Icon name="qr-code-2" size={44} color="#9ca3af" />
            <Text style={styles.scannerHint}>
              Apunta la cámara al código QR
            </Text>
          </View>
        </View>
        <Button
          mode="contained"
          onPress={handleActivateCamera}
          style={styles.primaryBtn}
          contentStyle={{ height: 44 }}
          labelStyle={{ fontWeight: "700", color: "#ffffff" }}
          loading={processing}
        >
          {hasPermission === false
            ? "Permiso cámara denegado"
            : "Activar Cámara"}
        </Button>
        {/* Acciones extra removidas (Flash / Historial) */}
      </View>

      {/* Modal de cámara */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Escanear QR</Text>
            <Pressable onPress={closeModal} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.scannerWrapper}>
            {!permission && (
              <Text style={styles.infoText}>Solicitando permiso...</Text>
            )}
            {permission && !hasPermission && (
              <Text style={styles.errorText}>No hay permiso de cámara</Text>
            )}
            {hasPermission && (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
              />
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
                  <Button
                    mode="contained"
                    onPress={handleReScan}
                    style={styles.reScanBtn}
                  >
                    Re-escanear
                  </Button>
                  <Button mode="text" onPress={closeModal} textColor="#fff">
                    Cerrar
                  </Button>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Últimos Escaneos */}
      <View style={styles.card}>
        <View style={styles.listHeader}>
          <Text style={styles.cardTitle}>Últimos escaneos de la sesión</Text>
          <Pressable onPress={() => Alert.alert("Ver todos", "Próximamente")}>
            <Text style={styles.link}>Ver todos</Text>
          </Pressable>
        </View>

        <Divider style={styles.divider} />

        {lastScans.length === 0 ? (
          <Text
            style={{ color: "#6b7280", textAlign: "center", marginVertical: 8 }}
          >
            No hay escaneos aún
          </Text>
        ) : (
          lastScans.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <View style={styles.itemLeft}>
                <View style={styles.itemIcon}>
                  <Icon name="confirmation-number" size={18} color="#0f172a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.itemTitle}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                </View>
                <Chip
                  compact
                  style={[
                    styles.badge,
                    item.valid ? styles.badgeValid : styles.badgeInvalid,
                  ]}
                  textStyle={{
                    color: "#ffffff",
                    fontWeight: "700",
                  }}
                >
                  {item.status}
                </Chip>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f5f6fa" },
  header: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  headerTitle: { color: "#e5e7eb", fontWeight: "700" },
  headerSubtitle: { color: "#9ca3af", fontSize: 12 },
  headerRight: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },

  profileCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  profileLeft: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  profileName: { color: "#f9fafb", fontWeight: "700" },
  // Estado eliminado

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statPill: { backgroundColor: "#eef2ff", borderRadius: 8, height: 22 },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginVertical: 6,
  },
  statLabel: { color: "#6b7280", fontSize: 12 },

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
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  outlinedBtn: {
    borderColor: "#e6e9ef",
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: { color: "#0f172a", fontWeight: "700" },
  divider: { marginVertical: 8, backgroundColor: "#e6e9ef" },
  listItem: {
    paddingVertical: 8,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  itemTitle: { fontWeight: "700", color: "#111827" },
  itemSubtitle: { color: "#6b7280", fontSize: 12 },
  badge: { borderRadius: 8, height: 24, justifyContent: "center", paddingHorizontal: 10, marginLeft: 8 },
  // Badges con mayor contraste para visibilidad clara de OK/ERROR
  badgeValid: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  badgeInvalid: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  // Modal / scanner styles
  modalContainer: { flex: 1, backgroundColor: "#000" },
  modalHeader: {
    height: 56,
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  modalTitle: { color: "#fff", fontWeight: "700" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  scannerWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
  infoText: { color: "#e5e7eb" },
  errorText: { color: "#fecaca" },
  resultOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    alignItems: "center",
  },
  resultText: { color: "#fff", marginTop: 8, textAlign: "center" },
  resultActions: { flexDirection: "row", gap: 12, marginTop: 12 },
  reScanBtn: { backgroundColor: "#16a34a" },
});
