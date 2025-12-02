// app/tickets/services/buy/useReservationAndPayment.ts
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import ROUTES from "@/routes";
import {
  cancelarReserva,
  createPago,
  fetchReservaActiva,
  reservarEntradas,
} from "@/app/events/apis/entradaApi";
import { SelectedTickets } from "@/app/tickets/types/BuyProps";

const RESERVATION_SECONDS = 10 * 60;

type Params = {
  user: any;
  router: any;
  navigation: any;
  selectedTickets: SelectedTickets;
  entradasIndex: Record<
    string,
    {
      idEntrada: string;
      idFecha: string;
      cdTipo: number;
      precio: number;
      nombreTipo: string;
    }
  >;
  compIndex: Record<
    string,
    {
      idFecha: string;
      cdTipo: number;
      precio: number;
      nombreTipo: string;
    }
  >;
  subtotal: number;
  cargoServicio: number;
  activeReservas: string[];
  setActiveReservas: React.Dispatch<React.SetStateAction<string[]>>;
  persistBillingBeforeConfirm: () => Promise<boolean>;
};

export function useReservationAndPayment({
  user,
  router,
  navigation,
  selectedTickets,
  entradasIndex,
  compIndex,
  subtotal,
  cargoServicio,
  activeReservas,
  setActiveReservas,
  persistBillingBeforeConfirm,
}: Params) {
  const [expiryTs, setExpiryTs] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] =
    useState<number>(RESERVATION_SECONDS);
  const [hasCanceledOnExpire, setHasCanceledOnExpire] =
    useState(false);

  const [acceptedTyc, setAcceptedTyc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer: compute a fixed target timestamp and close over it so the
  // remaining seconds decrease properly. Previously the interval used
  // the stale `expiryTs` state (or a fallback computed on each tick),
  // which caused the remaining seconds to reset and never decrement.
  useEffect(() => {
    // Determine a concrete target timestamp for this effect run
    let targetTs = expiryTs;
    if (!targetTs) {
      const now = Date.now();
      targetTs = now + RESERVATION_SECONDS * 1000;
      setExpiryTs(targetTs);
      setRemainingSec(RESERVATION_SECONDS);
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const rem = Math.max(0, Math.round((targetTs! - now) / 1000));
      setRemainingSec(rem);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTs]);

  const isExpired = remainingSec <= 0;
  const progress = Math.max(
    0,
    Math.min(1, remainingSec / RESERVATION_SECONDS)
  );
  const mm = String(Math.floor(remainingSec / 60)).padStart(
    2,
    "0"
  );
  const ss = String(remainingSec % 60).padStart(2, "0");
  const timerLabel = `${mm}:${ss}`;

  // Cancelar todas las reservas
  const cancelAllReservations = useCallback(async () => {
    try {
      if (activeReservas.length) {
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

      const uid: string | null =
        user?.id ?? user?.idUsuario ?? null;
      if (!uid) return;
      const reserva = await fetchReservaActiva(String(uid)).catch(
        () => null
      );
      if (reserva?.idCompra) {
        try {
          await cancelarReserva(reserva.idCompra);
        } catch (e) {
          console.log(
            "[BuyTicketScreen] cancelarReserva fallback fallo:",
            e
          );
        }
      }
    } catch (e) {
      console.log(
        "[BuyTicketScreen] Error en cancelAllReservations:",
        e
      );
    }
  }, [activeReservas, setActiveReservas, user]);

  // Confirmar al salir de pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener(
      "beforeRemove",
      (e: any) => {
        e.preventDefault();
        Alert.alert(
          "Cancelar compra",
          "¿Querés cancelar la compra? Se liberarán las entradas reservadas.",
          [
            { text: "Seguir aquí", style: "cancel" },
            {
              text: "Sí, cancelar",
              style: "destructive",
              onPress: async () => {
                await cancelAllReservations();
                unsubscribe();
                navigation.dispatch(e.data.action);
              },
            },
          ]
        );
      }
    );

    return unsubscribe;
  }, [navigation, cancelAllReservations]);

  // Cancelar automáticamente cuando expira
  useEffect(() => {
    (async () => {
      if (remainingSec > 0) return;
      if (hasCanceledOnExpire) return;
      setHasCanceledOnExpire(true);

      await cancelAllReservations();

      Alert.alert(
        "Tiempo agotado",
        "Su límite de tiempo para realizar la compra ha terminado, su reserva se canceló.",
        [
          {
            text: "OK",
            onPress: () => {
              try {
                router.back();
              } catch {}
            },
          },
        ],
        { cancelable: false }
      );
    })();
  }, [remainingSec, hasCanceledOnExpire, cancelAllReservations, router]);

  // Deep link de vuelta desde MercadoPago
  useEffect(() => {
    const sub = Linking.addEventListener("url", async (event: any) => {
      try {
        const url: string | undefined = event?.url;
        if (!url) return;

        if (url.includes(ROUTES.MAIN.TICKETS.RETURN)) {
          try {
            await WebBrowser.dismissAuthSession();
          } catch {}
          try {
            await WebBrowser.dismissBrowser();
          } catch {}

          try {
            const parsed = Linking.parse(url) as any;
            const qp = parsed?.queryParams || {};
            const idParam = qp?.id;
            const idPagoMP =
              qp?.idPagoMP ||
              qp?.payment_id ||
              qp?.collection_id ||
              qp?.paymentId ||
              qp?.paymentid;
            const params: any = {};
            if (idParam) params.id = String(idParam);
            if (idPagoMP) params.idPagoMP = String(idPagoMP);

            router.replace({
              pathname: ROUTES.MAIN.TICKETS.RETURN as any,
              params: Object.keys(params).length ? params : undefined,
            });
          } catch (e) {
            console.warn(
              "[BuyTicketScreen] error parsing deep link:",
              e
            );
          }
        }
      } catch (e) {
        console.warn(
          "[BuyTicketScreen] Linking event handler error:",
          e
        );
      }
    });

    return () => {
      try {
        sub.remove();
      } catch {}
    };
  }, [router]);

  const toggleAcceptedTyc = () =>
    setAcceptedTyc((v) => !v);

  // Confirmar compra
  const handleConfirmPurchase = useCallback(async () => {
    if (isExpired) return;
    if (!acceptedTyc) return;

    const billingOk = await persistBillingBeforeConfirm();
    if (!billingOk) return;

    try {
      setIsSubmitting(true);

      const uid: string | null =
        user?.id ?? user?.idUsuario ?? null;
      if (!uid) {
        Alert.alert(
          "Error",
          "No se detectó el usuario. Iniciá sesión nuevamente."
        );
        return;
      }

      // agrupamos por fecha / tipo
      const byFechaTipo = new Map<string, Map<number, number>>();

      for (const [k, qty] of Object.entries(selectedTickets)) {
        if (!qty || qty <= 0) continue;

        let key = k;
        if (key.startsWith("entrada-")) {
          key = key.replace("entrada-", "");
        }

        let idFecha: string | null = null;
        let cdTipo: number | null = null;

        const info = entradasIndex[key];
        if (info) {
          idFecha = info.idFecha;
          cdTipo = info.cdTipo;
        } else if (key.startsWith("gen-")) {
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

        if (!idFecha || !Number.isFinite(cdTipo as number)) continue;

        const mapTipo =
          byFechaTipo.get(idFecha) ?? new Map<number, number>();
        mapTipo.set(
          cdTipo as number,
          (mapTipo.get(cdTipo as number) ?? 0) + qty
        );
        byFechaTipo.set(idFecha, mapTipo);
      }

      if (!byFechaTipo.size) {
        Alert.alert(
          "Sin entradas",
          "No hay entradas seleccionadas para comprar."
        );
        return;
      }

      let collectedCompras: string[] = [];

      // Usar reservas pre-creadas si existen
      if (activeReservas.length) {
        collectedCompras = [...activeReservas];
      } else {
        // Crear reservas por fecha
        try {
          for (const [idFecha, mapTipo] of byFechaTipo.entries()) {
            const entradas = Array.from(mapTipo.entries()).map(
              ([tipoEntrada, cantidad]) => ({
                tipoEntrada,
                cantidad,
              })
            );

            const resp = await reservarEntradas({
              idUsuario: String(uid),
              idFecha: String(idFecha),
              entradas,
            });

            if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
              console.warn("[BuyTicket] reservarEntradas resp:", resp);
            }

            const idCompra =
              (resp as any)?.idCompra ||
              (resp as any)?.body?.idCompra ||
              null;

            if (!idCompra) {
              Alert.alert(
                "Error",
                "No se pudo generar la reserva. Intentá nuevamente."
              );
              // Intentamos limpiar cualquier reserva parcial creada
              if (collectedCompras.length) {
                for (const partial of collectedCompras) {
                  try {
                    await cancelarReserva(partial);
                  } catch (err) {
                    console.warn(
                      "[BuyTicket] fallo al cancelar reserva parcial:",
                      partial,
                      err
                    );
                  }
                }
                setActiveReservas([]);
              }
              return;
            }

            collectedCompras.push(String(idCompra));
          }

          setActiveReservas(collectedCompras);
          if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
            console.warn("[BuyTicket] collectedCompras:", collectedCompras);
          }
        } catch (err: any) {
          console.warn("[BuyTicket] error creating reservas:", err);
          // Intentamos limpiar reservas parciales si existieron
          if (collectedCompras.length) {
            for (const partial of collectedCompras) {
              try {
                await cancelarReserva(partial);
              } catch (e) {
                console.warn(
                  "[BuyTicket] fallo al cancelar reserva parcial tras error:",
                  partial,
                  e
                );
              }
            }
            setActiveReservas([]);
          }

          Alert.alert(
            "Error",
            "Ocurrió un error al generar las reservas. Intentá nuevamente."
          );
          return;
        }
      }

      const idCompra = collectedCompras[collectedCompras.length - 1];
      if (!idCompra) {
        Alert.alert(
          "Error",
          "No se pudo determinar el ID de compra."
        );
        return;
      }

      const buildBackUrl = (id: string) => {
        // 1) Preferir valor público si está seteado en app.json -> expo.extra
        try {
          const cfg = (Constants as any)?.expoConfig ?? (Constants as any)?.manifest ?? {};
          const extra = (cfg && cfg.extra) || (Constants as any)?.extra || {};
          const publicBack =
            extra?.EXPO_PUBLIC_BACK_URL || extra?.PUBLIC_BACK_URL || extra?.BACK_URL || null;
          if (publicBack && typeof publicBack === "string") {
            const sep = publicBack.includes("?") ? "&" : "?";
            return `${publicBack}${sep}id=${encodeURIComponent(id)}`;
          }
        } catch (e) {
          // ignore
        }

        // 2) Si estamos en web, usar origin + ruta
        try {
          // @ts-ignore
          if (typeof window !== "undefined" && window.location && window.location.origin) {
            const origin = window.location.origin; // no trailing slash
            let path = String(ROUTES.MAIN.TICKETS.RETURN || "");
            if (!path.startsWith("/")) path = `/${path}`;
            return `${origin}${path}?id=${encodeURIComponent(id)}`;
          }
        } catch (e) {
          // ignore
        }

        // 3) Si no hay `window`, intentar detectar el host del packager (emulador)
        try {
          const manifest = (Constants as any)?.manifest || (Constants as any)?.expoConfig || {};
          // debuggerHost suele venir como '10.0.2.2:8081' o '192.168.x.y:8081'
          const debuggerHost = manifest?.debuggerHost || manifest?.packagerHost || manifest?.hostUri || null;
          if (debuggerHost && typeof debuggerHost === "string") {
            const hostOnly = debuggerHost.split("/").pop();
            const origin = hostOnly && hostOnly.includes(":") ? `http://${hostOnly}` : `http://${hostOnly}:8081`;
            let path = String(ROUTES.MAIN.TICKETS.RETURN || "");
            if (!path.startsWith("/")) path = `/${path}`;
            const url = `${origin}${path}?id=${encodeURIComponent(id)}`;
            if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
              console.warn("[BuyTicket] detected packager host, using emulator origin:", origin, "-> backUrl:", url);
            }
            return url;
          }

          // 4) fallback a Linking.createURL (scheme/app link)
          try {
            return Linking.createURL(ROUTES.MAIN.TICKETS.RETURN, { queryParams: { id: String(id) } });
          } catch (e) {
            return String(id);
          }
        } catch (e) {
          try {
            return Linking.createURL(ROUTES.MAIN.TICKETS.RETURN, { queryParams: { id: String(id) } });
          } catch {
            return String(id);
          }
        }
      };

      const backUrl = buildBackUrl(String(idCompra));
      if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
        console.warn("[BuyTicket] backUrl chosen:", backUrl);
      }

      let pago: any = null;
      try {
        const payload = {
          idCompra: String(idCompra),
          subtotal,
          cargoServicio,
          backUrl,
        };
        if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
          // usar warn para asegurar visibilidad en Metro/adb
          console.warn("[BuyTicket] createPago payload:", payload);
        }
        if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
          console.warn("[BuyTicket] sending createPago for idCompra:", String(idCompra));
          console.warn("[BuyTicket] backUrl:", backUrl);
        }
        pago = await createPago(payload);
      } catch (e: any) {
        // Extraer info útil del error para debugging
        const status = e?.response?.status;
        let respData: any = e?.response?.data;
        // Si viene como string JSON, intentar parsearlo
        if (typeof respData === "string") {
          try {
            respData = JSON.parse(respData);
          } catch {}
        }

        // Log completo para Metro / adb
        console.warn("[BuyTicket] createPago error:", {
          status,
          data: respData,
          error: e?.message || e,
        });

        // Construir mensaje legible para el usuario
        const prettyMsg =
          (respData && (respData.title || respData.message || respData.detail)) ||
          (typeof respData === "string" ? respData : undefined) ||
          e?.message ||
          "Error creando el pago.";

        // Si hay traceId o status, añadirlos para correlación
        const trace = respData?.traceId ? `\nTraceId: ${respData.traceId}` : "";
        const statusSuffix = status ? ` (status ${status})` : "";

        Alert.alert(
          "Error al crear pago",
          String(prettyMsg) + statusSuffix + trace
        );
        return;
      }

      let mpUrl: string | undefined;

      if (typeof pago === "string") {
        mpUrl = pago;
      } else if (pago) {
        mpUrl =
          (pago as any).initPoint ||
          (pago as any).init_point ||
          (pago as any).url ||
          (pago as any).initUrl ||
          (pago as any).init_url ||
          (pago as any).sandboxInitPoint ||
          (pago as any).sandbox_init_point;

        if (!mpUrl) {
          let inner: any = (pago as any).body;
          if (typeof inner === "string") {
            try {
              inner = JSON.parse(inner);
            } catch {}
          }
          if (inner) {
            mpUrl =
              inner.initPoint ||
              inner.init_point ||
              inner.url ||
              inner.initUrl ||
              inner.init_url ||
              inner.sandboxInitPoint ||
              inner.sandbox_init_point ||
              (inner.preference &&
                (inner.preference.init_point ||
                  inner.preference.sandbox_init_point));
          }
        }
      }

      if (!mpUrl) {
        Alert.alert(
          "Error",
          "No se recibió la URL de MercadoPago."
        );
        return;
      }

      try {
        await WebBrowser.openAuthSessionAsync(mpUrl, backUrl);
      } catch (e) {
        console.log(
          "[BuyTicketScreen] openAuthSessionAsync fallo, probando openURL:",
          e
        );
        try {
          await Linking.openURL(mpUrl);
        } catch (e2) {
          console.log("[BuyTicketScreen] openURL fallo:", e2);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isExpired,
    acceptedTyc,
    persistBillingBeforeConfirm,
    user,
    selectedTickets,
    entradasIndex,
    compIndex,
    activeReservas.length,
    subtotal,
    cargoServicio,
    setActiveReservas,
  ]);

  const canConfirm =
    !isExpired && acceptedTyc && !isSubmitting;

  return {
    isExpired,
    progress,
    timerLabel,
    acceptedTyc,
    toggleAcceptedTyc,
    isSubmitting,
    canConfirm,
    handleConfirmPurchase,
  };
}
