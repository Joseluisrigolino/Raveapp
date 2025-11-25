// app/sales/services/manage/useTicketsSoldByEvent.ts
import { useEffect, useState } from "react";
import { OwnerEventTicketsSoldData } from "@/app/events/types/OwnerEventTicketsSold";

type State = {
  loading: boolean;
  error: string | null;
  data: OwnerEventTicketsSoldData | null;
};

export const formatTicketsMoney = (n: number | undefined) =>
  typeof n === "number" && isFinite(n) ? `$${n.toLocaleString()}` : "$0";

export default function useTicketsSoldByEvent(eventId?: string) {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    if (!eventId) {
      setState({
        loading: false,
        error: "No se recibió el id del evento.",
        data: null,
      });
      return;
    }

    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // TODO: reemplazar esto por llamada real a la API
        const mock: OwnerEventTicketsSoldData = {
          eventId: Number(eventId),
          eventName: `Evento #${eventId}`,
          lastUpdate: new Date().toLocaleString(),
          rows: [
            {
              type: "General",
              price: 5000,
              quantity: 120,
              total: 600000,
              inStock: 30,
            },
            {
              type: "VIP",
              price: 12000,
              quantity: 40,
              total: 480000,
              inStock: 10,
            },
          ],
          totalTickets: 160,
          totalRevenue: 1080000,
        };

        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            data: mock,
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          setState({
            loading: false,
            error: e?.message || "No se pudo obtener el reporte de entradas.",
            data: null,
          });
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return {
    loading: state.loading,
    error: state.error,
    data: state.data,
  };
}
