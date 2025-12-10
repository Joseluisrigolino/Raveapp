import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";
import { confirmarPagoMP } from "@/app/events/apis/entradaApi";
import ROUTES from "@/routes";

// Guard en memoria para evitar confirmar el mismo pago más de una vez
const processedPagoIds = new Set<string>();

export default function useBackBuy() {
  const router = useRouter();
  const isRunningRef = useRef(false);
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
        if (isRunningRef.current) {
          if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
            console.log("[useBackBuy] ya en ejecución, evitando duplicado");
          }
          return;
        }
        isRunningRef.current = true;
        // Protegemos contra confirmaciones repetidas desde el mismo cliente
        if (processedPagoIds.has(pagoId)) {
          if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
            console.log("[useBackBuy] pagoId ya procesado en esta sesión, saltando:", pagoId);
          }
          return;
        }
        // Confirmar únicamente si el status indica aprobación (si viene en los params)
        const status = (params as any)?.status ? String((params as any).status).toLowerCase() : undefined;
        if (status && !["approved", "accredited", "pagado", "aprobado"].includes(status)) {
          if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
            console.log("[useBackBuy] status no aprobado, no confirmo:", status);
          }
          isRunningRef.current = false;
          return;
        }

        setProcessing(true);
        try {
          // Marcar como procesado ANTES de llamar para evitar ráfagas duplicadas
          processedPagoIds.add(pagoId);
          await confirmarPagoMP(pagoId);
        } catch (err) {
          console.warn("[useBackBuy] confirmarPagoMP fallo:", err);
          Alert.alert(
            "Pago recibido",
            "Tu pago fue recibido. Si no ves tu entrada en 'Mis entradas', contactá con soporte."
          );
        }
      } finally {
        if (mounted) setProcessing(false);
        isRunningRef.current = false;
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
