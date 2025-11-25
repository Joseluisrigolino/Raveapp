import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";
import { confirmarPagoMP } from "@/app/events/apis/entradaApi";
import ROUTES from "@/routes";

// Guard en memoria para evitar confirmar el mismo pago más de una vez
const processedPagoIds = new Set<string>();

export default function useBackBuy() {
  const router = useRouter();
  const {
    idPagoMP,
    payment_id,
    collection_id,
    paymentId,
    paymentid,
  } = useLocalSearchParams<{
    idPagoMP?: string;
    payment_id?: string;
    collection_id?: string;
    paymentId?: string;
    paymentid?: string;
  }>();

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pagoId =
          idPagoMP || payment_id || collection_id || paymentId || paymentid
            ? String(idPagoMP || payment_id || collection_id || paymentId || paymentid)
            : undefined;
        try {
          console.log("[useBackBuy] payment_id candidates:", {
            idPagoMP,
            payment_id,
            collection_id,
            paymentId,
            paymentid,
            chosen: pagoId,
          });
        } catch {}
        if (!pagoId) return;
        if (!mounted) return;
        // Protegemos contra confirmaciones repetidas desde el mismo cliente
        if (processedPagoIds.has(pagoId)) {
          try {
            console.log("[useBackBuy] pagoId ya procesado en esta sesión, saltando:", pagoId);
          } catch {}
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
  }, [idPagoMP, payment_id, collection_id, paymentId, paymentid]);

  const goToTickets = () => {
    try {
      router.replace(ROUTES.MAIN.TICKETS.MENU);
    } catch (e) {
      try {
        console.warn("[useBackBuy] router.replace failed", e);
      } catch {}
    }
  };

  return { processing, goToTickets } as const;
}
