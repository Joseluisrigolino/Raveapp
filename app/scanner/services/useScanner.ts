import { useEffect, useRef, useState, useCallback } from "react";
import { Alert, BackHandler } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";

import ROUTES from "@/routes";
import { useAuth } from "@/app/auth/AuthContext";
import { getProfile } from "@/app/auth/userApi";
import { getControllerUsers } from "@/app/auth/apis/user-controller/controllerUserApi";
import { controlarEntrada, type ControlarEntradaPayload } from "@/app/scanner/apis/ScannerApi";
import { fetchEventById } from "@/app/events/apis/eventApi";
import { getUsuarioById } from "@/app/auth/userApi";
import { mediaApi } from "@/app/apis/mediaApi";

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

  function parseQrData(data: string): ControlarEntradaPayload | null {
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

  // --- Helper para enriquecer datos del resultado ---
  async function buildScanExtras(raw: any, parsed: ControlarEntradaPayload) {
    const extras: {
      dateTime?: string;
      eventName?: string;
      ticketType?: string;
      price?: string;
      customerName?: string;
      customerEmail?: string;
      customerAvatarUrl?: string;
    } = {};

    try {
      // Fecha y hora del escaneo
      const now = new Date();
      extras.dateTime = now.toLocaleString("es-AR", { hour12: false });

      // Resolver idEvento
      const idEvento = raw?.idEvento ?? raw?.evento?.idEvento ?? raw?.IdEvento ?? raw?.Evento?.IdEvento ?? undefined;

      // Nombre de evento: preferir raw.nombreEvento, luego raw.evento.nombre / raw.Evento.Nombre, luego fetchEventById
      try {
        if (raw?.nombreEvento) {
          extras.eventName = String(raw.nombreEvento).trim() || undefined;
        } else if (raw?.evento?.nombre || raw?.Evento?.Nombre) {
          extras.eventName = String(raw?.evento?.nombre ?? raw?.Evento?.Nombre ?? "").trim() || undefined;
        } else if (idEvento) {
          const ev = await fetchEventById(String(idEvento));
          extras.eventName = String(ev?.title || ev?.__raw?.nombre || ev?.__raw?.titulo || "").trim() || undefined;
        }
      } catch {}

      // Tipo de entrada
      try {
        const tipoRaw = raw?.tipoEntrada ?? raw?.dsTipoEntrada ?? raw?.tipo ?? raw?.entrada?.tipo ?? raw?.Entrada?.Tipo ?? raw?.tipoEntrada?.dsTipo;
        if (tipoRaw != null) extras.ticketType = String(tipoRaw);
      } catch {}

      // Precio
      try {
        const p = raw?.precio ?? raw?.precioEntrada ?? raw?.monto ?? raw?.precioUnitario ?? raw?.Precio ?? raw?.Entrada?.Precio ?? undefined;
        if (p != null) {
          const num = Number(p);
          const amount = Number.isFinite(num) ? num : Number(String(p).replace(/[^\d.,-]/g, '').replace(',', '.'));
          if (Number.isFinite(amount)) {
            extras.price = `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          } else {
            const txt = String(p).trim();
            extras.price = txt.startsWith('$') ? txt : `$${txt}`;
          }
        }
      } catch {}

      // Usuario comprador
      try {
        const idUsuario = raw?.idUsuario ?? raw?.usuario?.idUsuario ?? raw?.Usuario?.IdUsuario ?? raw?.compra?.idUsuario ?? undefined;
        if (idUsuario) {
          try { console.debug('[useScanner] buildScanExtras:idUsuario detectado', { idUsuario }); } catch {}
          try {
            const u = await getUsuarioById(String(idUsuario));
            const fullName = [u?.nombre, u?.apellido].filter(Boolean).join(' ').trim();
            const fantasia = String((u as any)?.nombreFantasia || '').trim();
            const correo = String((u as any)?.correo || '').trim();
            try {
              console.debug('[getUsuarioById] raw response', u);
              console.debug('[getUsuarioById] parsed user', { nombre: u?.nombre, apellido: u?.apellido, correo });
            } catch {}
            extras.customerName = fullName || fantasia || correo || extras.customerName;
            extras.customerEmail = correo || extras.customerEmail;
            try {
              console.debug('[useScanner] buildScanExtras:getUsuarioById OK', { fullName, correo });
            } catch {}
          } catch {}
          try {
            const avatar = await mediaApi.getFirstImage(String(idUsuario));
            try {
              console.debug('[useScanner] buildScanExtras:getFirstImage', { idUsuario, avatar });
            } catch {}
            if (avatar && typeof avatar === 'string' && avatar.trim().length > 0) {
              extras.customerAvatarUrl = avatar;
            }
          } catch {}
        } else if (raw?.usuario?.nombre || raw?.Usuario?.Nombre || raw?.usuario?.apellido || raw?.Usuario?.Apellido) {
          const nombre = [raw?.usuario?.nombre ?? raw?.Usuario?.Nombre, raw?.usuario?.apellido ?? raw?.Usuario?.Apellido]
            .filter(Boolean)
            .join(' ')
            .trim();
          try {
            console.debug('[useScanner] buildScanExtras:raw.usuario', { rawUsuario: raw?.usuario ?? raw?.Usuario, nombre });
          } catch {}
          extras.customerName = nombre || extras.customerName;
        } else {
          try { console.debug('[useScanner] buildScanExtras:sin idUsuario ni raw.usuario — no se puede resolver usuario'); } catch {}
        }
      } catch {}

    } catch {
      // Ignorar errores del helper, devolver lo que se haya podido resolver
    }

    return extras;
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

    // Abrimos el modal pero no activamos el escaneo automático.
    // Limpiamos cachés de la última lectura para evitar bloquear el próximo escaneo.
    try {
      lastScanRef.current = {};
      processingFlagRef.current = false;
    } catch {}
    setScanning(false);
    setModalVisible(true);
    setScanMessage("");
    setScanStatus(null);
  }, [permission, requestPermission]);

  const handleStartScan = useCallback(() => {
    // Activa una única lectura: CameraView usará onBarcodeScanned solo mientras scanning===true
    // Limpiamos cachés previos para que no quede "pegado" el último QR
    try {
      lastScanRef.current = {};
      processingFlagRef.current = false;
    } catch {}
    setScanMessage("");
    setScanStatus(null);
    setScanning(true);
  }, []);

  const handleBarCodeScanned = async (result: any) => {
    // 1) Guard contra reentradas
    if (processingFlagRef.current) return;
    // 2) Marcamos procesamiento YA
    processingFlagRef.current = true;
    // 3) Cortar escaneo inmediato para evitar múltiples lecturas del mismo QR
    try { setScanning(false); } catch {}

    // Calcular rawValue y actualizar lastScanRef antes de cualquier await
    const rawValue =
      typeof result?.data === "string"
        ? result.data
        : Array.isArray(result?.data?.barcodes)
        ? result.data.barcodes[0]?.data
        : result?.rawValue || "";

    const dataStrCheck = String(rawValue || "");
    const now = Date.now();
    if (
      lastScanRef.current.hash === dataStrCheck &&
      lastScanRef.current.time &&
      now - lastScanRef.current.time < 5000
    ) {
      setProcessing(false);
      processingFlagRef.current = false;
      return;
    }

    lastScanRef.current.hash = dataStrCheck;
    lastScanRef.current.time = now;

    setProcessing(true);

    try {
      const dataStr = String(rawValue || "");
      console.debug("[useScanner] scanned rawValue:", dataStr);
      const parsed = parseQrData(dataStr);
      console.debug("[useScanner] parsed QR:", parsed);

      if (!parsed) {
        const msg = "Formato de QR inválido";
        setScanStatus("error");
        setScanMessage(msg);
        try { setModalVisible(false); } catch {}
        try {
          setLastScans((prev) => [
            {
              id: Date.now().toString(),
              title: String(dataStr || ""),
              subtitle: new Date().toLocaleTimeString(),
              valid: false,
              status: "ERROR",
              details: { raw: String(dataStr || ""), parsed: null },
            },
            ...prev.slice(0, 19),
          ]);
        } catch (_) {}
        return;
      }

      const apiResp = await controlarEntrada(parsed);
      console.debug("[useScanner] apiResp:", apiResp);

      // Nueva lógica de validación priorizando raw.isOk
      const rawIsOk = apiResp?.raw?.isOk;

      let valido: boolean;
      if (rawIsOk === 1) {
        valido = true;
      } else if (rawIsOk === 0) {
        valido = false;
      } else if (typeof apiResp?.valido === "boolean") {
        valido = apiResp.valido;
      } else {
        valido = false;
      }

      const mensaje = apiResp?.mensaje ?? (valido ? "Entrada válida" : "Entrada inválida");

      const estadoEntrada: string | undefined =
        apiResp?.raw?.estadoEntrada ??
        (apiResp as any)?.estadoEntrada ??
        undefined;

      const estadoLc = (estadoEntrada || "").toLowerCase();

      // Normalizar raw una vez y reutilizar en todas las ramas
      const raw =
        apiResp && typeof apiResp === "object" && "raw" in (apiResp as any) && (apiResp as any).raw
          ? (apiResp as any).raw
          : (apiResp as any) ?? {};

      const statusText = String(estadoEntrada ?? apiResp?.mensaje ?? "").toLowerCase();
      const alreadyControlled =
        !valido &&
        (
          estadoLc === "controlada" ||
          /controla|controlad|ya fue|ya escanead|ya fue escanead|already/i.test(statusText)
        );

      // Caso: ya controlada -> siempre error
      if (alreadyControlled) {
        const displayMessage = "Entrada inválida — Estado entrada: Controlada (ya fue escaneada)";
        setScanStatus("error");
        setScanMessage(displayMessage);
        try { setModalVisible(false); } catch {}

        // registrar en lastScans como ERROR
        try {
          setLastScans((prev) => [
            {
              id: Date.now().toString(),
              title: parsed.idEntrada,
              subtitle: new Date().toLocaleTimeString(),
              valid: false,
              status: "ERROR",
              details: { raw: dataStr, parsed, apiResp },
            },
            ...prev.slice(0, 19),
          ]);
        } catch (_) {}
        // Navegar a pantalla de resultado en caso de controlada/ya escaneada
        try {
          // Permitir salir de la pantalla del scanner para navegar
          allowExitRef.current = true;
          const ticketId = parsed.idEntrada;
          const estadoEntradaNav = estadoEntrada ?? raw?.estadoEntrada ?? undefined;

          const extras = await buildScanExtras(raw, parsed);

          const nav = require("@/utils/navigation");
          nav.push(router, {
            pathname: ROUTES.CONTROLLER.SCAN_RESULT,
            params: {
              status: "error",
              message: displayMessage,
              ticketId,
              estadoEntrada: estadoEntradaNav ? String(estadoEntradaNav) : undefined,
              ...extras,
            },
          });
        } catch (navErr) {
          console.warn("[useScanner] error navegando (alreadyControlled) a SCAN_RESULT:", navErr);
        }
        return;
      }

      // Caso OK real
      if (valido) {
        const okMsg = mensaje || "Entrada escaneada con éxito";
        setScanStatus("ok");
        setScanMessage(okMsg);

        setScanCount((c) => c + 1);
        try {
          setLastScans((prev) => [
            {
              id: Date.now().toString(),
              title: parsed.idEntrada,
              subtitle: new Date().toLocaleTimeString(),
              valid: true,
              status: "OK",
              details: { raw: dataStr, parsed, apiResp },
            },
            ...prev.slice(0, 19),
          ]);
        } catch (_) {}

        // cortar escaneo y cerrar cámara
        try { setModalVisible(false); } catch {}
        // Navegar a pantalla de resultado con info válida
        try {
          // Permitir salir de la pantalla del scanner para navegar
          allowExitRef.current = true;
          const status = "ok";
          const message = okMsg;
          const ticketId = parsed.idEntrada;
          const estadoEntradaNav = raw?.estadoEntrada ?? undefined;
          const extras = await buildScanExtras(raw, parsed);

          const nav = require("@/utils/navigation");
          nav.push(router, {
            pathname: ROUTES.CONTROLLER.SCAN_RESULT,
            params: {
              status,
              message,
              ticketId,
              estadoEntrada: estadoEntradaNav ? String(estadoEntradaNav) : undefined,
              ...extras,
            },
          });
        } catch (navErr) {
          console.warn("[useScanner] error navegando a SCAN_RESULT:", navErr);
        }
        return;
      }

      // Caso inválido genérico
      const estadoEntradaInv = raw?.estadoEntrada ? String(raw.estadoEntrada) : undefined;
      const estadoLcInv = (estadoEntradaInv || "").toLowerCase();
      let reasonByEstado = "";
      if (estadoLcInv) {
        if (/controlad/.test(estadoLcInv)) reasonByEstado = "La entrada ya fue escaneada";
        else if (/anulad/.test(estadoLcInv)) reasonByEstado = "La entrada está anulada";
        else if (/cancelad/.test(estadoLcInv)) reasonByEstado = "La entrada está cancelada";
        else if (/vencid|expir/.test(estadoLcInv)) reasonByEstado = "La entrada está vencida";
        else if (/nofound|no exist|not found|404/.test(estadoLcInv)) reasonByEstado = "La entrada no existe";
      }
      const fallbackMsg = reasonByEstado || mensaje || "Entrada inválida";
      setScanStatus("error");
      setScanMessage(fallbackMsg);
      try { setModalVisible(false); } catch {}
      try {
        setLastScans((prev) => [
          {
            id: Date.now().toString(),
            title: parsed.idEntrada,
            subtitle: new Date().toLocaleTimeString(),
            valid: false,
            status: "ERROR",
            details: { raw: dataStr, parsed, apiResp },
          },
          ...prev.slice(0, 19),
        ]);
      } catch (_) {}
      // Navegar a pantalla de resultado en caso inválido
      try {
        // Permitir salir de la pantalla del scanner para navegar
        allowExitRef.current = true;
        const estadoEntradaNav = raw?.estadoEntrada ?? undefined;

        const extras = await buildScanExtras(raw, parsed);

        const nav = require("@/utils/navigation");
        nav.push(router, {
          pathname: ROUTES.CONTROLLER.SCAN_RESULT,
          params: {
            status: "error",
            message: fallbackMsg,
            ticketId: parsed.idEntrada,
            estadoEntrada: estadoEntradaNav ? String(estadoEntradaNav) : undefined,
            ...extras,
          },
        });
      } catch (navErr) {
        console.warn("[useScanner] error navegando inválido a SCAN_RESULT:", navErr);
      }
      return;
    } catch (e: any) {
      console.error("[useScanner] controlarEntrada error:", e);
      const statusCode = e?.response?.status;
      const respData = e?.response?.data;

      const serverMsg =
        respData?.mensaje ?? respData?.message ?? respData?.status ??
        (statusCode ? `HTTP ${statusCode}` : e?.message ?? "Error desconocido");

      const estadoEntradaError =
        respData?.raw?.estadoEntrada ?? respData?.estadoEntrada ?? respData?.data?.estadoEntrada ?? undefined;

      let displayMessageError = estadoEntradaError
        ? `${serverMsg} — Estado entrada: ${String(estadoEntradaError)}`
        : serverMsg;

      // Caso HTTP 404: mensaje fijo solicitado
      if (statusCode === 404) {
        displayMessageError = "Hubo un error al escanear la entrada, o entrada inexistente";
      }

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

      // Cerrar cámara y avisar al usuario sobre el error
      try { setModalVisible(false); } catch {}

      setScanStatus("error");
      setScanMessage(displayMessageError);

      // Navegar a pantalla de resultado en caso de error (incluye 404)
      try {
        // Permitir salir de la pantalla del scanner para navegar
        allowExitRef.current = true;
        const dataStr = lastScanRef.current.hash ?? "";
        const parsed = dataStr ? parseQrData(String(dataStr)) : null;
        const estadoEntradaNav =
          respData?.raw?.estadoEntrada ??
          respData?.estadoEntrada ??
          respData?.data?.estadoEntrada ??
          undefined;

        // Si es 404, mensaje pedido: "la entrada no existe"
        const messageNav = statusCode === 404
          ? "La entrada no existe"
          : displayMessageError;

        const nav = require("@/utils/navigation");
        nav.push(router, {
          pathname: ROUTES.CONTROLLER.SCAN_RESULT,
          params: {
            status: "error",
            message: messageNav,
            ticketId: parsed?.idEntrada,
            estadoEntrada: estadoEntradaNav ? String(estadoEntradaNav) : undefined,
          },
        });
      } catch (navErr) {
        console.warn("[useScanner] error navegando error a SCAN_RESULT:", navErr);
      }
    } finally {
      setProcessing(false);
      processingFlagRef.current = false;
      // NO reabrir la cámara ni setear scanning=true aquí. La única forma de reabrir
      // es mediante la acción del usuario (botón).
    }
  };

  const handleReScan = () => {
    // Volvemos al estado listo para escanear manualmente: limpiamos mensajes
    // Limpiar caché de última lectura para que no se considere duplicado
    try {
      lastScanRef.current = {};
      processingFlagRef.current = false;
    } catch {}
    setScanStatus(null);
    setScanMessage("");
    // Habilitamos el escaneo inmediato sin cerrar el modal
    setScanning(true);
    setModalVisible(true);
  };

  const closeModal = () => {
    // Al cerrar, limpiar caché para próxima sesión de cámara
    try {
      lastScanRef.current = {};
      processingFlagRef.current = false;
    } catch {}
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
    handleStartScan,
    handleReScan,
    closeModal,
    handleLogout,
  };
}
