// app/tickets/services/buy/useTicketData.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  fetchEventById,
  EventItemWithExtras,
} from "@/app/events/apis/eventApi";
import {
  fetchEntradasFechaRaw,
  ApiEntradaFechaRaw,
  getTipoMap,
  fetchTiposEntrada,
  fetchReservaActiva,
} from "@/app/events/apis/entradaApi";
import {
  GroupedSelectionMap,
  SelectedTickets,
} from "@/app/tickets/types/BuyProps";

type Params = {
  user: any;
  id?: string;
  selection?: string;
  reservas?: string;
};

type EntradasIndex = Record<
  string,
  {
    idEntrada: string;
    idFecha: string;
    cdTipo: number;
    precio: number;
    nombreTipo: string;
  }
>;

type CompIndex = Record<
  string,
  {
    idFecha: string;
    cdTipo: number;
    precio: number;
    nombreTipo: string;
  }
>;

export function useTicketData({
  user,
  id,
  selection,
  reservas,
}: Params) {
  const [eventData, setEventData] =
    useState<EventItemWithExtras | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTickets, setSelectedTickets] =
    useState<SelectedTickets>({});

  const [entradasIndex, setEntradasIndex] =
    useState<EntradasIndex>({});
  const [compIndex, setCompIndex] = useState<CompIndex>({});

  const [activeReservas, setActiveReservas] = useState<string[]>(() => {
    if (!reservas) return [];
    try {
      const parsed = JSON.parse(decodeURIComponent(reservas));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // 1) Evento + selection de params
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (selection) {
          try {
            const parsed = JSON.parse(decodeURIComponent(selection));
            setSelectedTickets(parsed || {});
          } catch (err) {
            console.log("Error al parsear selection:", err);
          }
        }

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

  // 2) Entradas por fecha + índices
  useEffect(() => {
    (async () => {
      try {
        if (!eventData?.fechas?.length) {
          setEntradasIndex({});
          setCompIndex({});
          return;
        }

        await fetchTiposEntrada().catch(() => []);
        const tipoMap = await getTipoMap();

        const results = await Promise.all(
          eventData.fechas.map(async (f) => {
            try {
              const raw = await fetchEntradasFechaRaw(
                String(f.idFecha),
                0
              ).catch(() => [] as ApiEntradaFechaRaw[]);
              return [String(f.idFecha), raw] as const;
            } catch {
              return [String(f.idFecha), [] as ApiEntradaFechaRaw[]] as const;
            }
          })
        );

        const idx: EntradasIndex = {};
        const cidx: CompIndex = {};

        for (const [idFecha, raw] of results) {
          for (let i = 0; i < raw.length; i++) {
            const r = raw[i];
            const cd = Number(r?.tipo?.cdTipo ?? NaN);
            const idEntrada = String(
              r.idEntrada ?? `gen-${idFecha}-${Number.isFinite(cd) ? cd : 0}-${i}`
            );
            const nombreTipo =
              (r?.tipo?.dsTipo && String(r.tipo.dsTipo)) ||
              (Number.isFinite(cd) ? tipoMap.get(cd) ?? "" : "") ||
              "Entrada";
            const precio = Number(r?.precio ?? 0);

            idx[idEntrada] = {
              idEntrada,
              idFecha,
              cdTipo: Number.isFinite(cd) ? cd : 0,
              precio,
              nombreTipo,
            };

            if (Number.isFinite(cd)) {
              const key = `${idFecha}#${cd}`;
              if (!cidx[key]) {
                cidx[key] = { idFecha, cdTipo: cd, precio, nombreTipo };
              }
            }
          }
        }

        setEntradasIndex(idx);
        setCompIndex(cidx);
      } catch (e) {
        console.warn("[BuyTicketScreen] Error cargando entradas:", e);
        setEntradasIndex({});
        setCompIndex({});
      }
    })();
  }, [eventData?.fechas]);

  // 3) Poblar selección desde reserva activa (cuando viene desde EventScreen)
  useEffect(() => {
    (async () => {
      try {
        if (!activeReservas.length) return;
        if (!Object.keys(entradasIndex).length) return;
        if (Object.keys(selectedTickets).length) return;

        const uid: string | null =
          user?.id ?? user?.idUsuario ?? null;
        if (!uid) return;

        const reserva = await fetchReservaActiva(String(uid)).catch(
          () => null
        );
        if (!reserva) return;

        const items: any[] = Array.isArray(reserva)
          ? reserva
          : Array.isArray((reserva as any).items)
          ? (reserva as any).items
          : [];
        if (!items.length) return;

        const newSel: SelectedTickets = {};
        for (const it of items) {
          const tipo =
            it?.tipoEntrada ??
            it?.tipo ??
            it?.cdTipo ??
            it?.cd_tipo ??
            it?.cdTipoEntrada;
          const cantidad = Number(
            it?.cantidad ?? it?.qty ?? it?.cantidadEntradas ?? 0
          );
          const idFecha =
            it?.idFecha ??
            it?.IdFecha ??
            it?.fecha ??
            it?.id_evento_fecha ??
            null;
          if (!tipo || !idFecha || !cantidad) continue;

          const found = Object.values(entradasIndex).find(
            (v) =>
              String(v.idFecha) === String(idFecha) &&
              Number(v.cdTipo) === Number(tipo)
          );
          if (found?.idEntrada) {
            const key = `entrada-${found.idEntrada}`;
            newSel[key] = (newSel[key] || 0) + cantidad;
          }
        }

        if (Object.keys(newSel).length) {
          setSelectedTickets((prev) => ({ ...newSel, ...prev }));
        }
      } catch (e) {
        console.log(
          "[BuyTicketScreen] Error poblando selección desde reserva:",
          e
        );
      }
    })();
  }, [activeReservas, entradasIndex, selectedTickets, user]);

  // 4) Agrupar selección por fecha para UI
  const groupedSelection: GroupedSelectionMap = useMemo(() => {
    const byFecha: GroupedSelectionMap = {};

    Object.entries(selectedTickets).forEach(([key, qty]) => {
      if (!qty || qty <= 0) return;

      let idEntrada: string | null = null;
      if (key.startsWith("entrada-")) {
        idEntrada = key.replace("entrada-", "");
      } else if (!key.startsWith("day")) {
        idEntrada = key;
      }
      if (!idEntrada) return;

      let idFecha = "";
      let label = "Entrada";
      let price = 0;

      const info = entradasIndex[idEntrada];
      if (info) {
        idFecha = info.idFecha;
        label = info.nombreTipo ?? label;
        price = info.precio ?? price;
      } else if (idEntrada.startsWith("gen-")) {
        const parts = idEntrada.split("-");
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
              label = c.nombreTipo ?? label;
              price = c.precio ?? price;
            }
          }
        }
      }

      const fKey = idFecha || "unknown";
      if (!byFecha[fKey]) byFecha[fKey] = [];
      byFecha[fKey].push({ idEntrada, label, qty, price });
    });

    return byFecha;
  }, [selectedTickets, entradasIndex, compIndex]);

  const subtotal = useMemo(() => {
    let s = 0;
    Object.values(groupedSelection).forEach((items) => {
      items.forEach((it) => {
        s += it.qty * it.price;
      });
    });
    return s;
  }, [groupedSelection]);

  const cargoServicio = useMemo(
    () => Math.round(subtotal * 0.1),
    [subtotal]
  );

  const total = subtotal + cargoServicio;

  const fechaLabel = useCallback(
    (idFecha: string): string => {
      const f = eventData?.fechas?.find(
        (x) => String(x.idFecha) === String(idFecha)
      );
      if (!f) return "Selección";
      try {
        const d = f.inicio ? new Date(f.inicio) : null;
        if (!d || !isFinite(d.getTime())) return "Selección";
        return d.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } catch {
        return "Selección";
      }
    },
    [eventData?.fechas]
  );

  return {
    loading,
    eventData,
    groupedSelection,
    subtotal,
    cargoServicio,
    total,
    fechaLabel,
    selectedTickets,
    entradasIndex,
    compIndex,
    activeReservas,
    setActiveReservas,
  };
}
