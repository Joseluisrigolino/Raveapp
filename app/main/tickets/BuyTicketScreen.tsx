// src/screens/BuyTicketScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import ROUTES from "@/routes";
import { useNavigation } from "@react-navigation/native";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { fetchEventById, EventItemWithExtras } from "@/utils/events/eventApi";
import { fetchEntradasFechaRaw, ApiEntradaFechaRaw, getTipoMap, fetchTiposEntrada, reservarEntradas, cancelarReserva, fetchReservaActiva, createPago } from "@/utils/events/entradaApi";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { useAuth } from "@/context/AuthContext";
import { getUsuarioById } from "@/utils/auth/userHelpers";
import InputText from "@/components/common/inputText";

// Datos del comprador
interface BuyerInfo {
  firstName: string;
  lastName: string;
  idType: string;
  idNumber: string;
  email: string;
  phone: string;
  birthDate: string; // DD/MM/YYYY
}

/**
 * Ej: {
 *   "day1-genEarly": 2,
 *   "day1-vip": 1,
 *   "day2-gen": 3,
 *   ...
 * }
 */
interface SelectedTickets {
  [key: string]: number;
}

// Datos de domicilio de facturación
interface BillingAddress {
  direccion: string;
  localidad: string;
  municipio: string;
  provincia: string;
}

function BuyTicketScreenContent() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { id, selection } = useLocalSearchParams<{
    id?: string;
    selection?: string;
  }>();

  const [eventData, setEventData] = useState<EventItemWithExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    firstName: "",
    lastName: "",
    idType: "DNI",
    idNumber: "",
    email: "",
    phone: "",
    birthDate: "",
  });
  const [selectedTickets, setSelectedTickets] = useState<SelectedTickets>({});
  // cargo de servicio: 10% del subtotal (se calcula dinámicamente)
  const [serviceFeeFixed] = useState<number>(0); // no se usa más fijo, se deja para compatibilidad por ahora
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    direccion: "",
    localidad: "",
    municipio: "",
    provincia: "",
  });

  // Index de entradas por idEntrada para poder calcular subtotales y labels desde la API real
  const [entradasIndex, setEntradasIndex] = useState<Record<string, { idEntrada: string; idFecha: string; cdTipo: number; precio: number; nombreTipo: string }>>({});
  // Índice compuesto por fecha+tipo (para resolver keys sintéticas gen-{idFecha}-{cdTipo}-idx)
  const [compIndex, setCompIndex] = useState<Record<string, { idFecha: string; cdTipo: number; precio: number; nombreTipo: string }>>({});

  // Reserva: 10 minutos de expiración
  const RESERVATION_SECONDS = 10 * 60; // 600s
  const [expiryTs, setExpiryTs] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(RESERVATION_SECONDS);
  const [acceptedTyc, setAcceptedTyc] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeReservas, setActiveReservas] = useState<string[]>([]); // idCompra por cada fecha reservada
  const [hasCanceledOnExpire, setHasCanceledOnExpire] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 1) Parsear selección entrante
        if (selection) {
          try {
            const parsed = JSON.parse(decodeURIComponent(selection));
            setSelectedTickets(parsed);
          } catch (err) {
            console.log("Error al parsear selection:", err);
          }
        }

        // 2) Cargar evento REAL desde la API
        if (id) {
          try {
            const apiEv = await fetchEventById(String(id));
            setEventData(apiEv);
          } catch (e) {
            console.log("fetchEventById fallo:", e);
            setEventData(null);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, selection]);

  // Inicializar y correr el contador de reserva cuando entramos a la pantalla
  useEffect(() => {
    if (!expiryTs) {
      setExpiryTs(Date.now() + RESERVATION_SECONDS * 1000);
      setRemainingSec(RESERVATION_SECONDS);
    }
    const interval = setInterval(() => {
      setRemainingSec((prev) => {
        const target = expiryTs ?? (Date.now() + RESERVATION_SECONDS * 1000);
        const now = Date.now();
        const rem = Math.max(0, Math.round((target - now) / 1000));
        return rem;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiryTs]);

  // Al tener eventData.fechas, traemos las entradas por fecha y armamos un índice por idEntrada
  useEffect(() => {
    (async () => {
      try {
        if (!eventData || !Array.isArray(eventData.fechas) || eventData.fechas.length === 0) {
          setEntradasIndex({});
          return;
        }
        // Traer tipos para mapear cdTipo -> dsTipo si la API de entradas no trae el nombre
        await fetchTiposEntrada().catch(() => []);
        const tipoMap = await getTipoMap();

        const results = await Promise.all(
          eventData.fechas.map(async (f) => {
            try {
              const raw = await fetchEntradasFechaRaw(String(f.idFecha), 0).catch(() => [] as ApiEntradaFechaRaw[]);
              return [String(f.idFecha), raw] as const;
            } catch {
              return [String(f.idFecha), [] as ApiEntradaFechaRaw[]] as const;
            }
          })
        );

        const idx: Record<string, { idEntrada: string; idFecha: string; cdTipo: number; precio: number; nombreTipo: string }> = {};
        const cidx: Record<string, { idFecha: string; cdTipo: number; precio: number; nombreTipo: string }> = {};
        for (const [idFecha, raw] of results) {
          for (const r of raw) {
            const idEntrada = String(r.idEntrada ?? "");
            const cd = Number(r?.tipo?.cdTipo ?? NaN);
            const nombreTipo = (r?.tipo?.dsTipo && String(r.tipo.dsTipo)) || (Number.isFinite(cd) ? (tipoMap.get(cd) ?? "") : "") || "Entrada";
            const precio = Number(r?.precio ?? 0);
            // Sólo indexamos por idEntrada si el backend lo provee
            if (idEntrada) {
              idx[idEntrada] = { idEntrada, idFecha, cdTipo: Number.isFinite(cd) ? cd : 0, precio, nombreTipo };
            }
            // Siempre construimos índice compuesto fecha+tipo si cdTipo es válido
            if (Number.isFinite(cd)) {
              const key = `${idFecha}#${cd}`;
              if (!cidx[key]) cidx[key] = { idFecha, cdTipo: cd, precio, nombreTipo };
            }
          }
        }
        setEntradasIndex(idx);
        setCompIndex(cidx);
      } catch (e) {
        console.warn("[BuyTicketScreen] Error cargando entradas por fecha:", e);
        setEntradasIndex({});
        setCompIndex({});
      }
    })();
  }, [eventData?.fechas]);

  // Prefill de "Tus datos" desde el usuario autenticado
  useEffect(() => {
    (async () => {
      try {
        const uid: string | null = (user as any)?.id ?? (user as any)?.idUsuario ?? null;
        if (!uid) return;
        const perfil = await getUsuarioById(String(uid)).catch(() => null);
        if (!perfil) return;
        // Formatear fecha de nacimiento a DD/MM/YYYY
        let birth = "";
        try {
          if (perfil.dtNacimiento) {
            const d = new Date(perfil.dtNacimiento);
            if (isFinite(d.getTime())) {
              birth = d.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
            }
          }
        } catch {}
        setBuyerInfo((prev) => ({
          ...prev,
          firstName: perfil.nombre || "",
          lastName: perfil.apellido || "",
          idType: prev.idType || "DNI",
          idNumber: perfil.dni || "",
          email: perfil.correo || "",
          phone: perfil.telefono || "",
          birthDate: birth,
        }));
        // Prefill domicilio de facturación
        const dom = perfil.domicilio as any;
        setBillingAddress({
          direccion: dom?.direccion || "",
          localidad: dom?.localidad?.nombre || "",
          municipio: dom?.municipio?.nombre || "",
          provincia: dom?.provincia?.nombre || "",
        });
      } catch (e) {
        console.log("[BuyTicketScreen] No se pudo precargar datos de usuario:", e);
      }
    })();
  }, [user]);

  // Al volver desde Mercado Pago (backUrl), cerrar la sesión del navegador y navegar a la pantalla de vuelta
  useEffect(() => {
    const sub = Linking.addEventListener("url", async (event: any) => {
      try {
        const url: string | undefined = event?.url;
        if (!url) return;
        // Si el deep link coincide con nuestra pantalla de retorno, cerramos el web browser
        if (url.includes(ROUTES.MAIN.TICKETS.RETURN)) {
          try { await WebBrowser.dismissAuthSession(); } catch {}
          try { await WebBrowser.dismissBrowser(); } catch {}
          // Navegar/asegurar estar en la pantalla de retorno con el id si viene
          try {
            const parsed = Linking.parse(url) as any;
            const idParam = parsed?.queryParams?.id;
            router.replace({ pathname: ROUTES.MAIN.TICKETS.RETURN, params: idParam ? { id: String(idParam) } : undefined });
          } catch {}
        }
      } catch {}
    });
    return () => {
      try { sub.remove(); } catch {}
    };
  }, [router]);

  // Función reutilizable para cancelar todas las reservas activas
  const cancelAllReservations = useCallback(async () => {
    try {
      if (activeReservas.length > 0) {
        for (const idCompra of activeReservas) {
          try {
            await cancelarReserva(idCompra);
          } catch (e) {
            console.log("[BuyTicketScreen] cancelarReserva fallo:", e);
          }
        }
        setActiveReservas([]);
        return true;
      }
      const uid: string | null = (user as any)?.id ?? (user as any)?.idUsuario ?? null;
      if (!uid) return false;
      const reserva = await fetchReservaActiva(String(uid)).catch(() => null);
      if (reserva?.idCompra) {
        try {
          await cancelarReserva(reserva.idCompra);
          return true;
        } catch (e) {
          console.log("[BuyTicketScreen] cancelarReserva (fallback) fallo:", e);
        }
      }
      return false;
    } catch (e) {
      console.log("[BuyTicketScreen] Error en cancelAllReservations:", e);
      return false;
    }
  }, [activeReservas, user]);

  // Confirmar al intentar salir de la pantalla (gesto/back/hardware)
  useEffect(() => {
    const sub = navigation.addListener("beforeRemove", (e: any) => {
      // Bloqueamos siempre la salida para confirmar
      e.preventDefault();
      Alert.alert(
        "Cancelar compra",
        "¿Querés cancelar la compra? Se liberarán las entradas reservadas.",
        [
          { text: "Seguir aquí", style: "cancel", onPress: () => {} },
          {
            text: "Sí, cancelar",
            style: "destructive",
            onPress: async () => {
              await cancelAllReservations();
              // Evitar loop del listener al continuar
              sub();
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });
    return sub;
  }, [navigation, cancelAllReservations]);

  // Al expirar el contador, cancelar reservas activas si las hubiera
  useEffect(() => {
    (async () => {
      if (remainingSec > 0) return;
      if (hasCanceledOnExpire) return;
      setHasCanceledOnExpire(true);
      try {
        // 1) Cancelar las reservas hechas en esta sesión si las tenemos
        if (activeReservas.length > 0) {
          for (const idCompra of activeReservas) {
            try {
              await cancelarReserva(idCompra);
            } catch (e) {
              console.log("[BuyTicketScreen] cancelarReserva fallo:", e);
            }
          }
          setActiveReservas([]);
          return;
        }
        // 2) Fallback: si no tenemos ids locales, intentar cancelar la reserva activa del usuario
        const uid: string | null = (user as any)?.id ?? (user as any)?.idUsuario ?? null;
        if (!uid) return;
        const reserva = await fetchReservaActiva(String(uid)).catch(() => null);
        if (reserva?.idCompra) {
          try {
            await cancelarReserva(reserva.idCompra);
          } catch (e) {
            console.log("[BuyTicketScreen] cancelarReserva (fallback) fallo:", e);
          }
        }
      } catch (e) {
        console.log("[BuyTicketScreen] Error al cancelar por expiración:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSec]);

  const handleChangeBuyerInfo = (field: keyof BuyerInfo, value: string) => {
    setBuyerInfo((prev) => ({ ...prev, [field]: value }));
  };

  // Group selección por idFecha usando el índice de entradas
  const groupedSelection = useMemo(() => {
    const byFecha: Record<string, Array<{ idEntrada: string; label: string; qty: number; price: number }>> = {};
    Object.entries(selectedTickets).forEach(([k, qty]) => {
      if (!qty || qty <= 0) return;
      // soportar varias formas de clave: "entrada-{idEntrada}" (preferida) o directamente "{idEntrada}"
      let idEntrada: string | null = null;
      if (k.startsWith("entrada-")) {
        idEntrada = k.replace("entrada-", "");
      } else if (!k.startsWith("day")) {
        // si no empieza con day, interpretamos que la clave ES el idEntrada
        idEntrada = k;
      }
      if (!idEntrada) return;

      // 1) Caso idEntrada real
      let idFecha = "";
      let label = "Entrada";
      let price = 0;
      const info = entradasIndex[idEntrada];
      if (info) {
        idFecha = info.idFecha;
        label = info.nombreTipo ?? label;
        price = info.precio ?? price;
      } else if (idEntrada.startsWith("gen-")) {
        // 2) Caso clave sintética generada en EventoPantalla: gen-{idFecha}-{cdTipo}-{idx}
        // Parseamos tomando el último token como idx y el penúltimo como cdTipo; el resto (entre gen- y antes de cdTipo) es idFecha
        const parts = idEntrada.split("-");
        if (parts.length >= 4) {
          // quitar 'gen'
          const core = parts.slice(1); // [idFecha possibly hyphenated..., cdTipo, idx]
          const idxToken = core.pop(); // remove idx
          const cdTipoToken = core.pop(); // remove cdTipo
          const idFechaToken = core.join("-");
          const cdTipoNum = Number(cdTipoToken);
          if (idFechaToken && Number.isFinite(cdTipoNum)) {
            const c = compIndex[`${idFechaToken}#${cdTipoNum}`];
            if (c) {
              idFecha = c.idFecha;
              label = c.nombreTipo ?? label;
              price = c.precio ?? price;
            }
          }
        }
      }

      const fKey = idFecha || "";
      if (!byFecha[fKey]) byFecha[fKey] = [];
      byFecha[fKey].push({ idEntrada, label, qty, price });
    });
    return byFecha;
  }, [selectedTickets, entradasIndex, compIndex]);

  const subtotal = useMemo(() => {
    let sum = 0;
    for (const items of Object.values(groupedSelection)) {
      for (const it of items) sum += it.qty * it.price;
    }
    return sum;
  }, [groupedSelection]);
  const cargoServicio = useMemo(() => Math.round(subtotal * 0.1), [subtotal]);
  const total = subtotal + cargoServicio;
  

  const isExpired = remainingSec <= 0;
  const progress = Math.max(0, Math.min(1, remainingSec / RESERVATION_SECONDS));
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const ss = String(remainingSec % 60).padStart(2, "0");

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.notFoundContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>No se encontró el evento.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  const handleConfirmPurchase = async () => {
    if (isExpired) return;
    if (!acceptedTyc) return;
    try {
      setIsSubmitting(true);
      try { console.log("========================== selectedTickets:", JSON.stringify(selectedTickets)); } catch {}
      // Obtener idUsuario
      const uid: string | null = (user as any)?.id ?? (user as any)?.idUsuario ?? null;
      if (!uid) {
        alert("No se detectó el usuario. Iniciá sesión nuevamente.");
        return;
      }

      // Armar acumulador por fecha -> (cdTipo -> cantidad)
      const byFechaTipo = new Map<string, Map<number, number>>();
      for (const [k, qty] of Object.entries(selectedTickets)) {
        if (!qty || qty <= 0) { try { console.log("-------------------------- skip qty<=0", k, qty); } catch {}; continue; }
        let key = k;
        if (key.startsWith("entrada-")) key = key.replace("entrada-", "");

        let idFecha: string | null = null;
        let cdTipo: number | null = null;

        // Caso idEntrada real
        const info = entradasIndex[key];
        if (info) {
          idFecha = info.idFecha;
          cdTipo = info.cdTipo;
        } else if (key.startsWith("gen-")) {
          // Caso sintético: gen-{idFecha}-{cdTipo}-{idx}
          const parts = key.split("-");
          if (parts.length >= 4) {
            const core = parts.slice(1);
            core.pop(); // idx
            const cdTipoToken = core.pop();
            const idFechaToken = core.join("-");
            const cdTipoNum = Number(cdTipoToken);
            if (idFechaToken && Number.isFinite(cdTipoNum)) {
              const c = compIndex[`${idFechaToken}#${cdTipoNum}`];
              if (c) {
                idFecha = c.idFecha;
                cdTipo = c.cdTipo;
              }
            }
          }
        }

        if (!idFecha || !Number.isFinite(cdTipo as number)) { try { console.log("-------------------------- no-resolve", { key, qty, idFecha, cdTipo }); } catch {}; continue; }
        try { console.log("-------------------------- add", { idFecha, cdTipo, qty }); } catch {}
        const mapTipo = byFechaTipo.get(idFecha) ?? new Map<number, number>();
        mapTipo.set(cdTipo as number, (mapTipo.get(cdTipo as number) ?? 0) + qty);
        byFechaTipo.set(idFecha, mapTipo);
      }

      if (byFechaTipo.size === 0) {
        try { console.log("========================== byFechaTipo.size == 0 (no hay payloads)"); } catch {}
        alert("No hay entradas seleccionadas.");
        return;
      }

      // Debug: mostrar payloads que vamos a enviar a ReservarEntradas
      try {
        const debugPayloads = Array.from(byFechaTipo.entries()).map(([idF, mapTipo]) => ({
          idUsuario: String(uid),
          idFecha: String(idF),
          entradas: Array.from(mapTipo.entries()).map(([tipoEntrada, cantidad]) => ({ tipoEntrada, cantidad })),
        }));
        console.log("========================== Reservas a enviar:", JSON.stringify(debugPayloads));
      } catch {}

      // Realizar 1 reserva por fecha
      const results: Array<{ idFecha: string; ok: boolean; idCompra?: string; error?: any }> = [];
      const collectedCompras: string[] = [];
      for (const [idF, mapTipo] of byFechaTipo.entries()) {
        const entradas = Array.from(mapTipo.entries()).map(([tipoEntrada, cantidad]) => ({ tipoEntrada, cantidad }));
        try {
          const resp = await reservarEntradas({ idUsuario: String(uid), idFecha: String(idF), entradas });
          // Debug: log respuesta completa
          try { console.log("<<< ReservarEntradas resp:", typeof resp === 'string' ? resp : JSON.stringify(resp)); } catch {}
          // Obtener idCompra: soporte texto plano o objeto normalizado
          let idCompraResp: string | undefined;
          if (typeof resp === 'string') {
            const text = resp as string;
            // 1) id compra etiquetado
            let m = text.match(/id\s*compra[^A-Za-z0-9]*([A-Za-z0-9-]+)/i);
            if (m && m[1]) idCompraResp = String(m[1]);
            // 2) UUID
            if (!idCompraResp) {
              m = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
              if (m && m[0]) idCompraResp = String(m[0]);
            }
            // 3) número largo (6+ dígitos)
            if (!idCompraResp) {
              m = text.match(/\b\d{6,}\b/);
              if (m && m[0]) idCompraResp = String(m[0]);
            }
          } else {
            let bodyAny: any = (resp as any)?.body ?? (resp as any)?.Body;
            if (typeof bodyAny === "string") {
              try { bodyAny = JSON.parse(bodyAny); } catch {}
            }
            idCompraResp = (bodyAny as any)?.idCompra
              ?? (bodyAny as any)?.IdCompra
              ?? (resp as any)?.idCompra
              ?? (resp as any)?.IdCompra;
          }

          // Debug: loggear idCompra capturado
          console.log("--------------------------", idCompraResp);

          if (idCompraResp) {
            setActiveReservas((prev) => Array.from(new Set([...prev, String(idCompraResp)])));
            collectedCompras.push(String(idCompraResp));
          }
          results.push({ idFecha: idF, ok: true, idCompra: idCompraResp ? String(idCompraResp) : undefined });
        } catch (e: any) {
          results.push({ idFecha: idF, ok: false, error: e });
        }
      }

      const failed = results.filter((r) => !r.ok);
      if (failed.length) {
        const first = failed[0];
        const msg = first?.error?.response?.data?.message || first?.error?.message || "No se pudo reservar algunas entradas.";
        alert(msg);
        return;
      }

      // Éxito: crear pago
      const successIds = results
        .filter((r) => r.ok && r.idCompra)
        .map((r) => String(r.idCompra));
      const idCompra = collectedCompras[collectedCompras.length - 1] || successIds[successIds.length - 1];
      // Debug: loggear idCompra final usado para el pago
      console.log("--------------------------", idCompra);
      if (!idCompra) {
        alert("No se obtuvo id de compra para crear el pago.");
        return;
      }
      // backUrl: deep link a la pantalla de "vuelta" (agradecimiento) usando el scheme de la app
      const backUrl = Linking.createURL(ROUTES.MAIN.TICKETS.RETURN, {
        queryParams: { id: String(idCompra) },
      });
      try {
        const pago = await createPago({
          idCompra: String(idCompra),
          subtotal,
          cargoServicio,
          backUrl,
        });
        try { console.log("[BuyTicketScreen] createPago resp:", typeof pago === 'string' ? pago : JSON.stringify(pago)); } catch {}
        // Si el backend devuelve la URL de Mercado Pago, abrirla
        let mpUrl: string | undefined;
        if (typeof pago === "string") {
          mpUrl = pago;
        } else if (pago) {
          mpUrl =
            (pago as any).initPoint ||
            (pago as any).init_point ||
            (pago as any).InitPoint ||
            (pago as any).url ||
            (pago as any).initUrl ||
            (pago as any).init_url ||
            (pago as any).sandboxInitPoint ||
            (pago as any).sandbox_init_point;

          // intentar extraer de body anidado
          if (!mpUrl) {
            let inner: any = (pago as any).body || (pago as any).Body;
            if (typeof inner === "string") {
              try { inner = JSON.parse(inner); } catch {}
            }
            if (inner) {
              mpUrl =
                inner.initPoint ||
                inner.init_point ||
                inner.InitPoint ||
                inner.url ||
                inner.initUrl ||
                inner.init_url ||
                inner.sandboxInitPoint ||
                inner.sandbox_init_point ||
                (inner.preference && (inner.preference.init_point || inner.preference.sandbox_init_point));
            }
          }
        }

        if (mpUrl && typeof mpUrl === "string") {
          try {
            // Preferir sesión de autenticación para cerrar automáticamente cuando redirige al backUrl
            const res = await WebBrowser.openAuthSessionAsync(mpUrl, backUrl);
            try { console.log("[BuyTicketScreen] WebBrowser result:", res); } catch {}
            return; // MP redirigirá a backUrl y la app manejará el deep link
          } catch (openErr) {
            console.log("[BuyTicketScreen] openAuthSessionAsync fallo, probando openURL/openBrowser:", openErr);
            try {
              await Linking.openURL(mpUrl);
              return;
            } catch (linkErr) {
              console.log("[BuyTicketScreen] Linking.openURL fallo, probando openBrowserAsync:", linkErr);
              try {
                await WebBrowser.openBrowserAsync(mpUrl, { showInRecents: true });
                return;
              } catch (brErr) {
                console.log("[BuyTicketScreen] openBrowserAsync fallo:", brErr);
              }
            }
          }
        }

        // Si no obtuvimos una URL válida, avisar al usuario
        alert("No se pudo iniciar el pago: no se recibió URL de Mercado Pago.");
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Error creando el pago.";
        alert(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  function fechaLabel(idFecha: string): string {
    const f = eventData?.fechas?.find((x) => String(x.idFecha) === String(idFecha));
    if (!f) return "Seleccion";
    try {
      const d = f.inicio ? new Date(f.inicio) : null;
      if (!d || !isFinite(d.getTime())) return "Seleccion";
      return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "Seleccion";
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Barra de expiración de reserva */}
        <View style={styles.reserveHeader}>
          <Text style={styles.reserveText}>Tu reserva expira en</Text>
          <Text style={styles.reserveTimer}>{mm}:{ss}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: isExpired ? COLORS.negative : COLORS.primary }]} />
        </View>
        {isExpired && (
          <View style={styles.expiredBanner}>
            <Text style={styles.expiredText}>Tu reserva expiró. Volvé a seleccionar las entradas.</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.expiredBackBtn}>
              <Text style={styles.expiredBackBtnText}>Volver al evento</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.title}>Resumen de tu compra</Text>

        {/* Resumen con imagen + tarjeta */}
        <View style={styles.summaryBlock}>
          {eventData.imageUrl ? (
            <Image source={{ uri: eventData.imageUrl }} style={styles.summaryImage} />
          ) : null}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEventTitle}>Evento: {eventData.title}</Text>
            {Object.entries(groupedSelection).map(([idFecha, items]) => {
              if (!items.length) return null;
              const daySubtotal = items.reduce((acc, it) => acc + it.qty * it.price, 0);
              return (
                <View key={idFecha || "unknown"} style={styles.summaryDayGroup}>
                  {items.map((it) => (
                    <Text key={it.idEntrada} style={styles.summaryLine}>
                      <Text style={styles.summaryLineBold}>{it.qty} x {it.label}</Text> para el día {fechaLabel(idFecha)} a ${it.price} c/u
                    </Text>
                  ))}
                  <Text style={styles.summaryDaySubtotal}>Subtotal: ${daySubtotal}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Resumen de precios global */}
        <View style={styles.priceSummary}>
          <Text style={styles.priceLine}>
            Subtotal: <Text style={styles.priceValue}>${subtotal}</Text>
          </Text>
          <Text style={styles.priceLine}>
            Cargo por servicio (10%): <Text style={styles.serviceFee}>${cargoServicio}</Text>
          </Text>
          <Text style={[styles.priceLine, styles.priceTotal]}>Total: ${total}</Text>
        </View>

        <Text style={styles.sectionTitle}>Tus datos</Text>
        <View style={styles.buyerForm}>
          {/* Nombre / Apellido */}
          <View style={styles.formRow}>
            <View style={styles.halfInputContainer}>
              <InputText
                label="Nombre"
                value={buyerInfo.firstName}
                isEditing={true}
                editable={false}
                onBeginEdit={() => {}}
                onChangeText={() => {}}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputPaper}
                labelStyle={styles.inputLabel}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <InputText
                label="Apellido"
                value={buyerInfo.lastName}
                isEditing={true}
                editable={false}
                onBeginEdit={() => {}}
                onChangeText={() => {}}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputPaper}
                labelStyle={styles.inputLabel}
              />
            </View>
          </View>
          {/* ID Type / Number */}
          <View style={styles.formRow}>
            <View style={styles.halfInputContainer}>
              <InputText
                label="Tipo ID"
                value={buyerInfo.idType}
                isEditing={true}
                editable={false}
                onBeginEdit={() => {}}
                onChangeText={() => {}}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputPaper}
                labelStyle={styles.inputLabel}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <InputText
                label="Número ID"
                value={buyerInfo.idNumber}
                keyboardType="numeric"
                isEditing={true}
                editable={false}
                onBeginEdit={() => {}}
                onChangeText={() => {}}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputPaper}
                labelStyle={styles.inputLabel}
              />
            </View>
          </View>
          {/* Email / Fecha de nacimiento */}
          <View style={styles.formRow}>
            <View style={styles.halfInputContainer}>
              <InputText
                label="Email"
                value={buyerInfo.email}
                keyboardType="email-address"
                isEditing={true}
                editable={false}
                onBeginEdit={() => {}}
                onChangeText={() => {}}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputPaper}
                labelStyle={styles.inputLabel}
                labelNumberOfLines={1}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <InputText
                label="Fecha de nacimiento"
                value={buyerInfo.birthDate}
                isEditing={true}
                editable={false}
                onBeginEdit={() => {}}
                onChangeText={() => {}}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputPaper}
                labelStyle={[styles.inputLabel, { width: "100%" }]}
                labelNumberOfLines={1}
              />
            </View>
          </View>
          {/* Phone */}
          <View style={styles.formRow}>
            <View style={styles.fullInputContainer}>
              <InputText
                label="Teléfono"
                value={buyerInfo.phone}
                keyboardType="phone-pad"
                isEditing={true}
                editable={false}
                onBeginEdit={() => {}}
                onChangeText={() => {}}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputPaper}
                labelStyle={styles.inputLabel}
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Domicilio de facturación</Text>
        <View style={styles.buyerForm}>
          {/* Dirección */}
          <View style={styles.formRow}>
            <View style={styles.fullInputContainer}>
              <InputText
                label="Dirección"
                value={billingAddress.direccion}
                isEditing={true}
                editable={false}
                onBeginEdit={() => {}}
                onChangeText={() => {}}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputPaper}
                labelStyle={styles.inputLabel}
              />
            </View>
          </View>
          {/* Localidad / Municipio */}
          <View style={styles.formRow}>
            <View style={styles.halfInputContainer}>
              <InputText
                label="Localidad"
                value={billingAddress.localidad}
                isEditing={true}
                editable={false}
                onBeginEdit={() => {}}
                onChangeText={() => {}}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputPaper}
                labelStyle={styles.inputLabel}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <InputText
                label="Municipio"
                value={billingAddress.municipio}
                isEditing={true}
                editable={false}
                onBeginEdit={() => {}}
                onChangeText={() => {}}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputPaper}
                labelStyle={styles.inputLabel}
              />
            </View>
          </View>
          {/* Provincia */}
          <View style={styles.formRow}>
            <View style={styles.fullInputContainer}>
              <InputText
                label="Provincia"
                value={billingAddress.provincia}
                isEditing={true}
                editable={false}
                onBeginEdit={() => {}}
                onChangeText={() => {}}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputPaper}
                labelStyle={styles.inputLabel}
              />
            </View>
          </View>
        </View>

        {/* Aceptación de TyC */}
        <View style={styles.tycRow}>
          <TouchableOpacity
            onPress={() => setAcceptedTyc((v) => !v)}
            style={[styles.checkbox, acceptedTyc && styles.checkboxChecked]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTyc }}
          >
            {acceptedTyc ? <Text style={styles.checkboxTick}>✓</Text> : null}
          </TouchableOpacity>
          <Text style={styles.tycText}>
            Acepto los Términos y Condiciones y la Política de Privacidad.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, (isExpired || !acceptedTyc || isSubmitting) && styles.confirmButtonDisabled]}
          onPress={handleConfirmPurchase}
          disabled={isExpired || !acceptedTyc || isSubmitting}
        >
          <Text style={styles.confirmButtonText}>{isSubmitting ? "PROCESANDO…" : "CONFIRMAR COMPRA"}</Text>
        </TouchableOpacity>

        <Text style={styles.notice}>
          Al confirmar compra, se te mostrará una confirmación antes de redirigirte a MercadoPago.
        </Text>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

export default function BuyTicketScreen() {
  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <BuyTicketScreenContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  /* Reserva */
  reserveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  reserveText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.smallText,
  },
  reserveTimer: {
    color: COLORS.info,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.borderInput,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  expiredBanner: {
    backgroundColor: "#FFF4F4",
    borderColor: COLORS.negative,
    borderWidth: 1,
    padding: 10,
    borderRadius: RADIUS.card,
    marginTop: 8,
    marginBottom: 8,
  },
  expiredText: {
    color: COLORS.negative,
    marginBottom: 6,
  },
  expiredBackBtn: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.negative,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  expiredBackBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  title: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginVertical: 12,
    textAlign: "center",
  },
  eventName: {
    textAlign: "center",
    fontSize: FONT_SIZES.body,
    color: COLORS.info,
    marginBottom: 16,
  },
  /* Resumen superior */
  summaryBlock: {
    flexDirection: "column",
    gap: 10,
    marginBottom: 12,
  },
  summaryImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: RADIUS.card,
    backgroundColor: "#eee",
  },
  summaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    elevation: 2,
  },
  summaryEventTitle: {
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
    fontSize: FONT_SIZES.body,
  },
  summaryDayGroup: {
    marginBottom: 6,
  },
  summaryLine: {
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  summaryLineBold: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
  summaryDaySubtotal: {
    marginTop: 4,
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: FONT_SIZES.smallText,
    textAlign: "right",
  },
  ticketSummary: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
    fontSize: FONT_SIZES.body,
  },
  daySummaryBlock: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    padding: 10,
    marginBottom: 8,
  },
  daySummaryTitle: {
    fontWeight: "bold",
    color: COLORS.info,
    marginBottom: 4,
  },
  ticketLine: {
    color: COLORS.textSecondary,
    marginLeft: 4,
    marginVertical: 2,
  },
  daySubtotal: {
    marginTop: 4,
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: FONT_SIZES.smallText,
    textAlign: "right",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  buyerForm: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  halfInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  fullInputContainer: {
    flex: 1,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.smallText,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: COLORS.textPrimary,
  },
  // Extras para InputField (react-native-paper)
  inputContainer: {
    alignItems: "stretch",
    marginBottom: 0,
  },
  inputPaper: {
    width: "100%",
    opacity: 0.7, // grisado visual
  },
  inputLabel: {
    opacity: 0.7,
  },
  priceSummary: {
    marginVertical: 12,
    padding: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
  },
  priceLine: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  priceValue: {
    fontWeight: "bold",
  },
  serviceFee: {
    color: COLORS.positive,
    fontWeight: "bold",
  },
  priceTotal: {
    marginTop: 6,
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: FONT_SIZES.button,
  },
  tycRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardBg,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxTick: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: 14,
  },
  tycText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.smallText,
  },
  notice: {
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
});
