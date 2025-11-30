import { useEffect, useRef, useState, useCallback } from "react";
import { Alert, BackHandler } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";

import ROUTES from "@/routes";
import { useAuth } from "@/app/auth/AuthContext";
import { getProfile } from "@/app/auth/userApi";
import { getControllerUsers } from "@/app/auth/apis/user-controller/controllerUserApi";
import { controlarEntrada, ControlarEntradaRequest } from "@/app/scanner/apis/ScannerApi";

type ScanStatus = "ok" | "error" | null;

export interface LastScanItem {
  id: string;
  title: string;
  subtitle: string;
  valid: boolean;
  status: "OK" | "ERROR";
  // detalles crudos para debugging (raw QR, parsed payload, API response)
  details?: any;
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
  const lastScanRef = useRef<{ hash?: string; time?: number }>({});

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
    // permission.status can be a string like 'undetermined' | 'granted' | 'denied'
    const status = permission?.status;
    if (!permission || status === "undetermined" || status === undefined) {
      const granted = await requestPermission();
      if (!granted?.granted) {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a la cámara para escanear el QR."
        );
        return;
      }
    } else if (status === "denied") {
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
    // prevent re-entrancy
    if (processingFlagRef.current) return;

    // Cerrar la cámara inmediatamente al recibir cualquier escaneo
    setModalVisible(false);
    setScanning(false);

    const rawValue =
      typeof result?.data === "string"
        ? result.data
        : Array.isArray(result?.data?.barcodes)
        ? result.data.barcodes[0]?.data
        : result?.rawValue || "";

    const dataStrCheck = String(rawValue || "");
    const now = Date.now();
    // ignore duplicate scans of the same payload within 2.5s
    if (
      lastScanRef.current.hash === dataStrCheck &&
      lastScanRef.current.time &&
      now - lastScanRef.current.time < 2500
    ) {
      // already processing/processed recently -> ignore
      return;
    }

    // mark as processing and record last scan
    processingFlagRef.current = true;
    lastScanRef.current.hash = dataStrCheck;
    lastScanRef.current.time = now;

    setProcessing(true);

    try {
      const dataStr = String(rawValue || "");
      console.debug("[useScanner] scanned rawValue:", dataStr);
      const parsed = parseQrData(dataStr);
      console.debug("[useScanner] parsed QR:", parsed);

      if (!parsed) {
        setScanStatus("error");
        setScanMessage("Formato de QR inválido");
        setProcessing(false);
        return;
      }

      const apiResp = await controlarEntrada(parsed);
      console.debug("[useScanner] apiResp:", apiResp);

      const valido =
        typeof apiResp === "boolean"
          ? apiResp
          : apiResp?.valido ?? apiResp?.isValid ?? apiResp?.ok ?? false;

      const mensaje = apiResp?.mensaje ?? apiResp?.message ?? apiResp?.status ?? (valido ? "Entrada válida" : "Entrada inválida");

      // extraer posible estado de la entrada desde varias formas (raw, estadoEntrada, estado)
      const estadoEntrada =
        apiResp?.raw?.estadoEntrada ?? apiResp?.estadoEntrada ?? apiResp?.data?.estadoEntrada ?? apiResp?.estado ?? apiResp?.status ?? undefined;

      // Detect responses that indicate the ticket was already controlled
      const statusText = String((apiResp?.estado || apiResp?.status || apiResp?.message || apiResp?.mensaje || estadoEntrada) || "").toLowerCase();
      const alreadyControlled = /controla|controlad|ya fue|already/i.test(statusText);

      setScanCount((c) => c + 1);
      setLastScans((prev) => [
        {
          id: Date.now().toString(),
          title: parsed.idEntrada,
          subtitle: new Date().toLocaleTimeString(),
          valid: !!valido,
          status: valido ? "OK" : "ERROR",
          details: { raw: dataStr, parsed, apiResp },
        },
        ...prev.slice(0, 19),
      ]);

      if (valido) {
        setScanStatus("ok");
        setScanMessage(mensaje);
        processingFlagRef.current = false;
        setProcessing(false);
        return;
      }

      // Construir mensaje enriquecido con estado de entrada si existe
      const displayMessage = estadoEntrada
        ? `${mensaje} — Estado entrada: ${String(estadoEntrada)}`
        : mensaje;

      // If the backend reports the entry was already controlled, show that message
      if (alreadyControlled) {
        setScanStatus("error");
        setScanMessage(displayMessage || "Entrada ya controlada");
        processingFlagRef.current = false;
        setProcessing(false);
        return;
      }

      // generic invalid case: show enriched message inside modal
      setScanStatus("error");
      setScanMessage(displayMessage);
      processingFlagRef.current = false;
      setProcessing(false);
    } catch (e: any) {
      console.error("[useScanner] controlarEntrada error:", e);
      const statusCode = e?.response?.status;
      const respData = e?.response?.data;

      const serverMsg =
        respData?.mensaje ?? respData?.message ?? respData?.status ??
        (statusCode ? `HTTP ${statusCode}` : e?.message ?? "Error desconocido");

      const estadoEntradaError =
        respData?.raw?.estadoEntrada ?? respData?.estadoEntrada ?? respData?.data?.estadoEntrada ?? undefined;

      const displayMessageError = estadoEntradaError
        ? `${serverMsg} — Estado entrada: ${String(estadoEntradaError)}`
        : serverMsg;

      // ensure lastScans contains an entry for this failed attempt
      try {
        const dataStr = lastScanRef.current.hash ?? "";
        const parsed = dataStr ? parseQrData(String(dataStr)) : null;
        setLastScans((prev) => [
          {
            id: Date.now().toString(),
            title: parsed?.idEntrada ?? (dataStr || ""),
            subtitle: new Date().toLocaleTimeString(),
            valid: false,
            status: "ERROR",
            details: { raw: dataStr, parsed, apiError: { statusCode, respData, message: e?.message } },
          },
          ...prev.slice(0, 19),
        ]);
      } catch (_) {
        // ignore
      }

      setScanStatus("error");
      setScanMessage(displayMessageError);
    } finally {
      setProcessing(false);
      processingFlagRef.current = false;
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
