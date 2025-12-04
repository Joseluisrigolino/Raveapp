import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";
import { confirmarPagoMP } from "@/app/events/apis/entradaApi";
import ROUTES from "@/routes";

// Guard en memoria para evitar confirmar el mismo pago más de una vez
const processedPagoIds = new Set<string>();

export default function useBackBuy() {
  const router = useRouter();
  // Leer todos los posibles params en una sola llamada y luego parsear
  const params = useLocalSearchParams<{
    idPagoMP?: string;
    payment_id?: string;
    collection_id?: string;
    paymentId?: string;
    paymentid?: string;
    id?: string;
    status?: string;
    external_reference?: string;
  }>();

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Log params for debugging in dev only
        if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
          console.log("[useBackBuy] search params en BackBuy:", params);
        }

        // Extraer pagoId de forma centralizada
        const extractPagoId = (p: any): { pagoId?: string; source?: string } => {
          if (!p) return {};
          // prioridad: payment_id -> idPagoMP -> collection_id -> paymentId -> paymentid -> id
          const v = p.payment_id ?? p.idPagoMP ?? p.collection_id ?? p.paymentId ?? p.paymentid ?? p.id;
          return v ? { pagoId: String(v), source: Object.keys(p).find((k) => (p as any)[k] === v) } : {};
        };

        const { pagoId, source } = extractPagoId(params);
        if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
          console.log("[useBackBuy] search params en BackBuy:", params);
          console.log("[useBackBuy] pagoId resuelto:", { pagoId, source });
        }

        if (!pagoId) return;
        if (!mounted) return;
        // Protegemos contra confirmaciones repetidas desde el mismo cliente
        if (processedPagoIds.has(pagoId)) {
          if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
            console.log("[useBackBuy] pagoId ya procesado en esta sesión, saltando:", pagoId);
          }
          return;
        }
        setProcessing(true);
        try {
          await confirmarPagoMP(pagoId);
          // marcar como procesado para evitar reintentos desde el cliente
          processedPagoIds.add(pagoId);
        } catch (err) {
          console.warn("[useBackBuy] confirmarPagoMP fallo:", err);
          Alert.alert(
            "Pago recibido",
            "Tu pago fue recibido. Si no ves tu entrada en 'Mis entradas', contactá con soporte."
          );
        }
      } finally {
        if (mounted) setProcessing(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [params]);

  const goToTickets = () => {
    try {
      router.replace(ROUTES.MAIN.TICKETS.MENU);
    } catch (e) {
      console.warn("[useBackBuy] router.replace failed", e);
    }
  };

  return { processing, goToTickets } as const;
}
