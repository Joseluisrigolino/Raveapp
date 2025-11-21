import { useEffect, useRef, useState, useCallback } from "react";
import { Alert, BackHandler } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { CameraPermissionStatus, useCameraPermissions } from "expo-camera";

import ROUTES from "@/routes";
import { useAuth } from "@/app/auth/AuthContext";
import { getProfile } from "@/app/auth/userHelpers";
import { getControllerUsers } from "@/app/auth/apis/user-controller/controllerApi";
import { controlarEntrada, ControlarEntradaRequest } from "@/app/scanner/apis/ScannerApi";

type ScanStatus = "ok" | "error" | null;

export interface LastScanItem {
  id: string;
  title: string;
  subtitle: string;
  valid: boolean;
  status: "OK" | "ERROR";
}

export function useScanner() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ user?: string }>();
  const { user, logout } = useAuth() as any;

  const loginParam = String(params?.user ?? "");

  const [controllerName, setControllerName] = useState<string>(loginParam || "Controlador");
  const [scanCount, setScanCount] = useState(0);
  const [lastScans, setLastScans] = useState<LastScanItem[]>([]);

  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted ?? false;

  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [scanStatus, setScanStatus] = useState<ScanStatus>(null);

  const allowExitRef = useRef(false);
  const processingFlagRef = useRef(false);

  // --- Cargar nombre del controlador ---
  useEffect(() => {
    (async () => {
      try {
        if (!user?.username) {
          if (loginParam) setControllerName(loginParam);
          return;
        }

        const profile = await getProfile(user.username);
        const orgId = String(profile?.idUsuario ?? "");
        if (!orgId) return;

        const controllers = await getControllerUsers(orgId);
        const match = controllers.find(
          (c) => c.username?.trim().toLowerCase() === loginParam.trim().toLowerCase()
        );

        if (match?.username) setControllerName(match.username);
      } catch {
        // si falla dejamos el nombre como está
      }
    })();
  }, [user?.username, loginParam]);

  // --- Bloquear back hardware / gestos mientras esté en el scanner ---
  useEffect(() => {
    const onBack = () => true;
    const subBack = BackHandler.addEventListener("hardwareBackPress", onBack);
    const subNav = navigation.addListener("beforeRemove", (e: any) => {
      if (!allowExitRef.current) e.preventDefault();
    });

    return () => {
      subBack.remove();
      subNav && (subNav as any)();
    };
  }, [navigation]);

  // --- Helpers QR ---

  function parseQrData(data: string): ControlarEntradaRequest | null {
    const raw = (data || "").trim();
    if (!raw) return null;

    // 1) JSON
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        const idEntrada = String(parsed[0] ?? "").trim();
        const mdQr = String(parsed[1] ?? "").trim();
        if (idEntrada) return { idEntrada, mdQr };
      } else if (parsed && typeof parsed === "object") {
        const idEntrada =
          parsed.idEntrada ?? parsed.entrada ?? parsed.Entrada ?? parsed.id ?? null;
        const mdQr =
          parsed.mdQr ?? parsed.mdQR ?? parsed.qr ?? parsed.codigoQr ?? parsed.cod_qr ?? "";
        if (idEntrada) return { idEntrada: String(idEntrada), mdQr: String(mdQr || "") };
      }
    } catch {
      /* ignore */
    }

    // 2) Querystring / URL
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
          get("idEntrada") ||
          get("IdEntrada") ||
          get("entrada") ||
          get("Entrada") ||
          get("id") ||
          undefined;

        const mdQr =
          get("mdQr") ||
          get("mdQR") ||
          get("MdQr") ||
          get("MDQR") ||
          get("qr") ||
          get("codigoQr") ||
          get("cod_qr") ||
          "";

        if (idEntrada) return { idEntrada: String(idEntrada), mdQr: String(mdQr || "") };
      }
    } catch {
      /* ignore */
    }

    // 3) CSV "idEntrada,mdQr"
    const csv = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (csv.length === 2) {
      return { idEntrada: csv[0], mdQr: csv[1] };
    }

    // 4) Texto plano con claves
    const map: Record<string, string> = {};
    raw
      .split(/[|;\n,]/)
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

  // --- Handlers públicos ---

  const handleActivateCamera = useCallback(async () => {
    if (!permission || permission.status === CameraPermissionStatus.UNDETERMINED) {
      const granted = await requestPermission();
      if (!granted?.granted) {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a la cámara para escanear el QR."
        );
        return;
      }
    } else if (permission.status === CameraPermissionStatus.DENIED) {
      Alert.alert(
        "Permiso requerido",
        "Tenés que habilitar la cámara desde la configuración del dispositivo."
      );
      return;
    }

    setScanning(true);
    setModalVisible(true);
    setScanMessage("");
    setScanStatus(null);
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async (result: any) => {
    if (processingFlagRef.current) return;
    processingFlagRef.current = true;

    setScanning(false);
    setProcessing(true);

    try {
      const rawValue =
        typeof result?.data === "string"
          ? result.data
          : Array.isArray(result?.data?.barcodes)
          ? result.data.barcodes[0]?.data
          : result?.rawValue || "";

      const dataStr = String(rawValue || "");
      const parsed = parseQrData(dataStr);

      if (!parsed) {
        setScanStatus("error");
        setScanMessage("Formato de QR inválido");
        setProcessing(false);
        return;
      }

      const apiResp = await controlarEntrada(parsed);

      const valido =
        typeof apiResp === "boolean"
          ? apiResp
          : apiResp?.valido ?? apiResp?.isValid ?? apiResp?.ok ?? false;

      const mensaje =
        apiResp?.mensaje ??
        apiResp?.message ??
        apiResp?.status ??
        (valido ? "Entrada válida" : "Entrada inválida");

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
        setScanStatus("ok");
        setScanMessage(mensaje);
        setModalVisible(false);
        setScanning(false);
        return;
      }

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
      allowExitRef.current = true;
      logout && logout();
    } finally {
      router.replace(ROUTES.LOGIN.LOGIN);
    }
  };

  return {
    // estado
    controllerName,
    scanCount,
    lastScans,
    permission,
    hasPermission,
    scanning,
    processing,
    modalVisible,
    scanMessage,
    scanStatus,
    // handlers
    handleActivateCamera,
    handleBarCodeScanned,
    handleReScan,
    closeModal,
    handleLogout,
  };
}
