// app/sales/services/event/useEventSalesReport.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import {
  ReporteVentasDia,
  ReporteVentasEvento,
  ReporteVentasItem,
  fetchReporteVentasEvento,
} from "@/app/events/apis/entradaApi";
import { fetchEventById } from "@/app/events/apis/eventApi";
import { ApiUserFull, getUsuarioById } from "@/app/auth/userApi";

export type EventSalesTotals = {
  vendidos: number;
  recEntradas: number;
  cargo: number;
  total: number;
};

export const formatMoney = (n: number | undefined) =>
  typeof n === "number" && isFinite(n) ? `$${n.toFixed(2)}` : "$0.00";

// --- helpers internos de formato de fecha ---
function formatNowHuman(d: Date) {
  try {
    const dateFmt = new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeFmt = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${dateFmt.format(d)} a las ${timeFmt.format(d)} hs`;
  } catch {
    const pad = (x: number) => String(x).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} a las ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())} hs`;
  }
}

// --- helpers de cálculo, reutilizados en los componentes ---
export function computeItemDerived(i: ReporteVentasItem) {
  const cantidadInicial = i.cantidadInicial ?? 0;
  const cantidadVendida = i.cantidadVendida ?? 0;
  const precioUnitario = i.precioUnitario ?? 0;
  const cargoServicioUnitario = i.cargoServicioUnitario ?? 0;

  const subtotal =
    typeof i.subtotal === "number" ? i.subtotal : precioUnitario * cantidadVendida;

  const cargoServicio =
    typeof i.cargoServicio === "number"
      ? i.cargoServicio
      : cargoServicioUnitario * cantidadVendida;

  const total = typeof i.total === "number" ? i.total : subtotal + cargoServicio;

  const stock =
    typeof i.stock === "number"
      ? i.stock
      : Math.max(0, cantidadInicial - cantidadVendida);

  return {
    cantidadInicial,
    cantidadVendida,
    precioUnitario,
    cargoServicioUnitario,
    subtotal,
    cargoServicio,
    total,
    stock,
  };
}

export function computeDayTotals(d: ReporteVentasDia): EventSalesTotals {
  const isTotal = (it: any) =>
    String(it?.tipo || it?.entrada || "").trim().toUpperCase() === "TOTAL";

  const totalLine = Array.isArray(d.items) ? d.items.find(isTotal) : undefined;
  const baseItems = Array.isArray(d.items)
    ? d.items.filter((it) => !isTotal(it))
    : [];

  // si viene línea TOTAL, preferimos esos valores
  if (totalLine) {
    const der = computeItemDerived(totalLine);

    const vendidos =
      typeof d.totalEntradasVendidas === "number"
        ? d.totalEntradasVendidas
        : typeof totalLine.cantidadVendida === "number"
        ? totalLine.cantidadVendida
        : baseItems.reduce((acc, it) => acc + (it.cantidadVendida ?? 0), 0);

    const recEntradas =
      typeof d.totalRecaudado === "number"
        ? d.totalRecaudado
        : typeof der.subtotal === "number"
        ? der.subtotal
        : baseItems.reduce(
            (acc, it) => acc + computeItemDerived(it).subtotal,
            0
          );

    const cargo =
      typeof d.totalCargoServicio === "number"
        ? d.totalCargoServicio
        : typeof der.cargoServicio === "number"
        ? der.cargoServicio
        : baseItems.reduce(
            (acc, it) => acc + computeItemDerived(it).cargoServicio,
            0
          );

    return { vendidos, recEntradas, cargo, total: recEntradas + cargo };
  }

  // si no hay línea TOTAL, sumamos todo
  const vendidos =
    typeof d.totalEntradasVendidas === "number"
      ? d.totalEntradasVendidas
      : baseItems.reduce((acc, it) => acc + (it.cantidadVendida ?? 0), 0);

  const recEntradas =
    typeof d.totalRecaudado === "number"
      ? d.totalRecaudado
      : baseItems.reduce(
          (acc, it) => acc + computeItemDerived(it).subtotal,
          0
        );

  const cargo =
    typeof d.totalCargoServicio === "number"
      ? d.totalCargoServicio
      : baseItems.reduce(
          (acc, it) => acc + computeItemDerived(it).cargoServicio,
          0
        );

  return { vendidos, recEntradas, cargo, total: recEntradas + cargo };
}

export default function useEventSalesReport(eventId?: string) {
  const { user, hasRole } = useAuth();
  const idEvento = eventId ? String(eventId) : "";

  const baseUserId = String(
    (user as any)?.id ?? (user as any)?.idUsuario ?? ""
  );
  const isAdmin = !!hasRole?.("admin");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReporteVentasEvento>({ dias: [] } as any);
  const [now, setNow] = useState<Date>(new Date());

  const [ownerUser, setOwnerUser] = useState<ApiUserFull | null>(null);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!idEvento) {
      setError("Falta el id del evento.");
      setReport({ dias: [] } as any);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1) evento para saber organizador
      const ev = await fetchEventById(idEvento).catch(() => null as any);

      const pickOwnerId = (e: any): string | null =>
        (e?.ownerId && String(e.ownerId)) ||
        (e?.__raw?.propietario?.idUsuario &&
          String(e.__raw.propietario.idUsuario)) ||
        (e?.__raw?.usuario?.idUsuario &&
          String(e.__raw.usuario.idUsuario)) ||
        null;

      const orgForReport = isAdmin ? pickOwnerId(ev) || baseUserId : baseUserId;

      if (!orgForReport) {
        setError("No se pudo determinar el organizador para este evento.");
        setReport({ dias: [] } as any);
        setLoading(false);
        return;
      }

      // 2) reporte
      const rep = await fetchReporteVentasEvento(
        idEvento,
        String(orgForReport)
      );

      // 2.1) info del dueño (solo admin)
      if (isAdmin) {
        setOwnerError(null);
        setOwnerUser(null);
        try {
          const ownerId = pickOwnerId(ev);
          if (ownerId) {
            const u = await getUsuarioById(String(ownerId));
            setOwnerUser(u);
          } else {
            setOwnerError("No se encontró el ID del organizador del evento.");
          }
        } catch (e: any) {
          setOwnerError(
            e?.message || "Error al obtener datos del dueño del evento."
          );
        }
      }

      // 3) mapear idFecha -> fecha dd/mm/yyyy
      const idFechaToDate = new Map<string, string>();
      try {
        const pad = (n: number) => String(n).padStart(2, "0");
        const toDDMMYYYY = (iso?: string) => {
          if (!iso) return "";
          const d = new Date(iso);
          if (isNaN(d.getTime())) return "";
          return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
        };
        if (ev && Array.isArray(ev.fechas)) {
          for (const f of ev.fechas) {
            const label = toDDMMYYYY(f?.inicio);
            if (f?.idFecha) idFechaToDate.set(String(f.idFecha), label);
          }
        }
      } catch {}

      const dias: ReporteVentasDia[] = (rep?.dias ?? []).map((d) => {
        const idF = (d as any).idFecha ?? d.items?.[0]?.idFecha;
        const label =
          (idF && idFechaToDate.get(String(idF))) ||
          d.fecha ||
          (d as any).numFecha ||
          "";
        return { ...d, fecha: String(label || d.fecha || "") } as ReporteVentasDia;
      });

      const merged: ReporteVentasEvento = {
        ...rep,
        evento: {
          idEvento,
          nombre:
            ev?.title || ev?.nombre || rep?.evento?.nombre || undefined,
          creadoPor:
            ev?.ownerName || rep?.evento?.creadoPor || undefined,
        },
        dias,
      };

      setReport(merged);
    } catch (e: any) {
      setError(e?.message || "No se pudo obtener el reporte.");
    } finally {
      setLoading(false);
    }
  }, [idEvento, baseUserId, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  // actualizar hora cada 30s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const grandTotals = useMemo<EventSalesTotals>(() => {
    const vendidos = report.dias.reduce(
      (acc, d) => acc + computeDayTotals(d).vendidos,
      0
    );
    const recEntradas = report.dias.reduce(
      (acc, d) => acc + computeDayTotals(d).recEntradas,
      0
    );
    const cargo = report.dias.reduce(
      (acc, d) => acc + computeDayTotals(d).cargo,
      0
    );
    return { vendidos, recEntradas, cargo, total: recEntradas + cargo };
  }, [report]);

  const infoText = useMemo(
    () => `Información al ${formatNowHuman(now)}`,
    [now]
  );

  // domicilio simplificado para admins
  const domicilioFmt = useMemo(() => {
    if (!ownerUser?.domicilio) return "";
    const d = ownerUser.domicilio;
    const raw = String(d?.direccion || "");
    let base = raw.split(",")[0] || raw;
    base = base.replace(/\s*\d+.*$/, "").trim();
    if (!base) return "";
    const prov = (d?.provincia?.nombre || "").toLowerCase();
    const isCaba =
      prov.includes("ciudad autónoma de buenos aires") ||
      prov.includes("ciudad autonoma de buenos aires") ||
      prov === "caba";
    return isCaba ? `${base} - CABA` : base;
  }, [ownerUser]);

  return {
    // estados
    loading,
    refreshing,
    error,
    report,
    infoText,
    isAdmin,
    grandTotals,
    ownerUser,
    ownerError,
    domicilioFmt,

    // acciones
    onRefresh,
    reload: load,
  };
}
