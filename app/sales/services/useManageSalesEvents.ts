// app/sales/services/manage/useManageSalesEvents.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ESTADO_CODES,
  EventItemWithExtras,
  fetchEventsByEstados,
} from "@/app/events/apis/eventApi";

export type ManageFilterStatus = "en_venta" | "fin_venta" | "finalizado" | "todos";

const STATUS_MAP: Record<ManageFilterStatus, number[]> = {
  en_venta: [ESTADO_CODES.EN_VENTA],
  fin_venta: [ESTADO_CODES.FIN_VENTA],
  finalizado: [ESTADO_CODES.FINALIZADO],
  todos: [
    ESTADO_CODES.EN_VENTA,
    ESTADO_CODES.FIN_VENTA,
    ESTADO_CODES.FINALIZADO,
  ],
};

function parseDateToTs(d?: string): number {
  if (!d) return 0;
  const [dd, mm, yy] = String(d).split("/").map(Number);
  return new Date(yy || 0, (mm || 1) - 1, dd || 1).getTime();
}

export default function useManageSalesEvents(ownerId?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItemWithExtras[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ManageFilterStatus>("en_venta");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const estados = [
        ESTADO_CODES.EN_VENTA,
        ESTADO_CODES.FIN_VENTA,
        ESTADO_CODES.FINALIZADO,
      ];

      let list = await fetchEventsByEstados(estados);

      // filtrar por owner si viene por params
      if (ownerId) {
        list = list.filter(
          (e) => String(e.ownerId ?? "") === String(ownerId)
        );
      }

      // ordenar por fecha dd/mm/yyyy
      const sorted = list
        .slice()
        .sort((a, b) => parseDateToTs(a.date) - parseDateToTs(b.date));

      setEvents(sorted);
    } catch (e) {
      setError("No se pudieron cargar los eventos.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredEvents = useMemo(() => {
    let arr = [...events];

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((e) => e.title.toLowerCase().includes(q));
    }

    const allowedCodes =
      STATUS_MAP[filterStatus] || STATUS_MAP.en_venta;

    arr = arr.filter((e) => {
      const code = Number(
        (e as any).cdEstado ?? (e as any).estado ?? NaN
      );
      return allowedCodes.includes(code);
    });

    return arr;
  }, [events, search, filterStatus]);

  return {
    // state
    loading,
    error,
    events,
    filteredEvents,
    search,
    filterStatus,

    // setters
    setSearch,
    setFilterStatus,

    // actions
    reload: load,
  };
}
