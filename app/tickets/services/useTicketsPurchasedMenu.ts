import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import { getEntradasUsuario } from "@/app/auth/userApi";
import { fetchEventById, EventItemWithExtras, ESTADO_CODES } from "@/app/events/apis/eventApi";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";
import { getResenias } from "@/utils/reviewsApi";

export function useTicketsPurchasedMenu() {
  const { user } = useAuth();

  const userId: string | null =
    (user as any)?.id ??
    (user as any)?.idUsuario ??
    (user as any)?.userId ??
    (user as any)?.uid ??
    null;

  const [items, setItems] = useState<TicketPurchasedMenuItem[]>([]);
  const [selectedEstadoIds, setSelectedEstadoIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userReviewsSet, setUserReviewsSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (!userId) {
          setItems([]);
          return;
        }

        console.log("[TicketPurchasedMenu] fetching entradas for userId:", userId);
        const raw = await getEntradasUsuario(String(userId));
        const list = Array.isArray(raw) ? raw : [];

        // Helpers IDs
        const getEventId = (r: any): string | null => {
          const ev = r?.evento ?? r?.event ?? null;
          const id =
            ev?.idEvento ?? ev?.id ?? r?.idEvento ?? r?.eventId ?? r?.id_evento;
          const s = String(id ?? "").trim();
          return s ? s : null;
        };

        const getCompraId = (r: any): string | null => {
          const id =
            r?.idCompra ??
            r?.IdCompra ??
            r?.compraId ??
            r?.purchaseId ??
            r?.id_compra ??
            r?.compra?.idCompra ??
            r?.pago?.idCompra;
          const s = String(id ?? "").trim();
          return s ? s : null;
        };

        const getFiestaId = (r: any): string | null => {
          const f = r?.fiesta ?? r?.evento ?? r?.event ?? null;
          const id =
            f?.idFiesta ??
            f?.id_fiesta ??
            r?.idFiesta ??
            r?.fiestaId ??
            r?.id_fiesta ??
            null;
          const s = String(id ?? "").trim();
          return s ? s : null;
        };

        const uniqueEventIds = Array.from(
          new Set(
            list
              .map(getEventId)
              .filter((v): v is string => Boolean(v))
          )
        );

        const eventMap = new Map<string, EventItemWithExtras>();
        await Promise.all(
          uniqueEventIds.map(async (eid) => {
            try {
              const evt = await fetchEventById(eid);
              if (evt?.id) eventMap.set(String(evt.id), evt);
            } catch {
              // ignorar error individual
            }
          })
        );

        const getFiestaIdFromEvent = (evLike: any): string | null => {
          if (!evLike) return null;
          const raw = (evLike as any).__raw ?? evLike;
          const tryGet = (...paths: any[]): string | null => {
            for (const p of paths) {
              const v = p;
              const s = String(v ?? "").trim();
              if (s) return s;
            }
            return null;
          };
          const fid = tryGet(
            raw?.fiesta?.idFiesta,
            raw?.fiesta?.IdFiesta,
            raw?.Fiesta?.idFiesta,
            raw?.Fiesta?.IdFiesta,
            raw?.idFiesta,
            raw?.IdFiesta,
            raw?.fiestaId,
            raw?.id_fiesta
          );
          return fid;
        };

        const parseDate = (v: any): number => {
          if (!v) return 0;
          const s = String(v);
          const d = new Date(s);
          const t = d.getTime();
          return isFinite(t) ? t : 0;
        };

        const withIndex = list.map((r: any, i: number) => ({ r, i }));
        withIndex.sort((a, b) => {
          const ar = a.r;
          const br = b.r;

          const aTs = parseDate(
            ar?.dtInsert ||
              ar?.DtInsert ||
              ar?.dt_insert ||
              ar?.compra?.dtInsert ||
              ar?.fechaCompra ||
              ar?.compraFecha ||
              ar?.fecha ||
              ar?.createdAt ||
              ar?.created_at ||
              ar?.creado ||
              ar?.purchaseDate ||
              ar?.purchasedAt ||
              ar?.purchased_at
          );

          const bTs = parseDate(
            br?.dtInsert ||
              br?.DtInsert ||
              br?.dt_insert ||
              br?.compra?.dtInsert ||
              br?.fechaCompra ||
              br?.compraFecha ||
              br?.fecha ||
              br?.createdAt ||
              br?.created_at ||
              br?.creado ||
              br?.purchaseDate ||
              br?.purchasedAt ||
              br?.purchased_at
          );

          if (bTs !== aTs) return bTs - aTs;
          return a.i - b.i;
        });

        const mapped: TicketPurchasedMenuItem[] = withIndex.map(
          ({ r }, idx) => {
            const compraId = getCompraId(r);
            const eid = getEventId(r);
            const fid = getFiestaId(r);

            const fallbackEvent = r?.evento ?? r?.event ?? {};
            const ev = eid ? eventMap.get(eid) : null;

            const fiestaIdFinal =
              (fid && String(fid)) ||
              getFiestaIdFromEvent(ev) ||
              getFiestaIdFromEvent(fallbackEvent) ||
              undefined;

            const name =
              ev?.title ??
              fallbackEvent?.title ??
              fallbackEvent?.nombre ??
              fallbackEvent?.eventoNombre ??
              "Evento";
            const date =
              ev?.date ?? fallbackEvent?.date ?? fallbackEvent?.fecha ?? "";
            const desc =
              ev?.description ?? fallbackEvent?.description ?? "";
            const imageUrl =
              ev?.imageUrl ??
              fallbackEvent?.imageUrl ??
              fallbackEvent?.imagen ??
              "";

            let ticketEstadoCd: number | undefined = undefined;
            let ticketEstadoLabel: string | undefined = undefined;

            if (typeof r?.cdEstado !== "undefined") {
              ticketEstadoCd = Number(r.cdEstado);
              ticketEstadoLabel = r?.dsEstado ?? `Estado ${ticketEstadoCd}`;
            } else if (r?.estado && typeof r.estado === "object") {
              const st = r.estado;
              if (typeof st?.cdEstado !== "undefined")
                ticketEstadoCd = Number(st.cdEstado);
              ticketEstadoLabel =
                st?.dsEstado ??
                (typeof ticketEstadoCd !== "undefined"
                  ? `Estado ${ticketEstadoCd}`
                  : undefined);
            }

            const eventEstadoCd =
              typeof ev?.cdEstado !== "undefined"
                ? Number(ev.cdEstado)
                : undefined;
            const isFinished =
              typeof eventEstadoCd === "number"
                ? eventEstadoCd === ESTADO_CODES.FINALIZADO ||
                  eventEstadoCd === ESTADO_CODES.CANCELADO
                : false;

            return {
              id: idx + 1,
              imageUrl: String(imageUrl || ""),
              eventName: String(name || "Evento"),
              date: String(date || ""),
              description: String(desc || ""),
              isFinished,
              estadoCd: ticketEstadoCd,
              estadoLabel: ticketEstadoLabel,
              eventId: eid ?? undefined,
              idCompra: compraId ?? undefined,
              ticketsCount: 1,
              fiestaId: fiestaIdFinal,
            } as TicketPurchasedMenuItem;
          }
        );

        if (mounted) setItems(mapped);
      } catch (e: any) {
        console.error("[TicketPurchasedMenu] Error cargando entradas:", e);
        if (mounted) setError("No se pudieron cargar tus tickets.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // Reseñas del usuario
  useEffect(() => {
    (async () => {
      try {
        if (!userId) return;
        const list = await getResenias({ idUsuario: String(userId) });
        const s = new Set<string>();
        for (const r of list) {
          const fid =
            (r && (r.idFiesta || (r as any).IdFiesta || (r as any).fiestaId)) as
              | string
              | undefined;
          if (fid) s.add(String(fid));
        }
        setUserReviewsSet(s);
      } catch {
        // ignorar
      }
    })();
  }, [userId]);

  const filteredItems = useMemo(() => {
    let base =
      !selectedEstadoIds || selectedEstadoIds.length === 0
        ? items
        : items.filter((it: any) => {
            const estadoCd =
              typeof (it as any).estadoCd !== "undefined"
                ? Number((it as any).estadoCd)
                : undefined;
            return (
              typeof estadoCd === "number" && selectedEstadoIds.includes(estadoCd)
            );
          });

    const groups: Record<string, any[]> = {};

    const normalizeCompra = (v: any) => {
      const s = String(v ?? "").trim();
      if (!s) return "SIN_COMPRA";
      return s.replace(/^0+/, "").toLowerCase();
    };

    const normalizeEstado = (v: any) => {
      if (v === null || v === undefined) return "SIN_ESTADO";
      const n = Number(v);
      return isNaN(n) ? "SIN_ESTADO" : String(n);
    };

    const normalizeEvent = (v: any) => {
      const s = String(v ?? "").trim();
      return s || "SIN_EVENTO";
    };

    for (const it of base) {
      const anyIt: any = it as any;
      const idCompraNorm = normalizeCompra(anyIt.idCompra);
      const estadoNorm = normalizeEstado(anyIt.estadoCd);
      const eventNorm = normalizeEvent(anyIt.eventId);
      const key = eventNorm + "|" + idCompraNorm + "|" + estadoNorm;
      if (!groups[key]) groups[key] = [];
      groups[key].push(anyIt);
    }

    const aggregated: any[] = [];
    let autoId = 1;
    for (const key of Object.keys(groups)) {
      const listGroup = groups[key];
      const first = listGroup[0];
      const count = listGroup.length;
      aggregated.push({
        ...first,
        id: autoId++,
        ticketsCount: count,
        description:
          count > 1
            ? `${first.description || ""}\nEntradas en este estado: ${count}`
            : first.description,
      });
    }

    try {
      console.log(
        "[TicketPurchasedMenu] grupos agrupados (revert):",
        Object.keys(groups)
      );
    } catch {}

    return aggregated as TicketPurchasedMenuItem[];
  }, [items, selectedEstadoIds]);

  const sortedTickets = useMemo(
    () =>
      [...filteredItems].sort((a, b) =>
        a.isFinished === b.isFinished ? 0 : a.isFinished ? 1 : -1
      ),
    [filteredItems]
  );

  const toggleEstadoFilter = (id: number) => {
    setSelectedEstadoIds((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  };

  const clearEstadoFilter = () => setSelectedEstadoIds([]);

  return {
    loading,
    error,
    sortedTickets,
    selectedEstadoIds,
    toggleEstadoFilter,
    clearEstadoFilter,
    userReviewsSet,
  };
}
