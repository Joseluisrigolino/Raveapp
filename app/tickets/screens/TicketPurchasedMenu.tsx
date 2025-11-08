// app/main/TicketsScreens/TicketsPurchasedMenu.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";

import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import CardComponent from "@/app/events/components/CardComponent";

import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";
import { useAuth } from "@/app/auth/AuthContext";
import { getEntradasUsuario } from "@/app/auth/userHelpers";
import { fetchEventById, EventItemWithExtras, ESTADO_CODES } from "@/app/events/apis/eventApi";
import FiltroMisTickets from '@/components/filters/FiltroMisTickets';
import { getResenias } from "@/utils/reviewsApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Meta de estados de ENTRADAS (no confundir con estados de EVENTO). Los códigos
// provienen del endpoint de entradas y coinciden con los filtros estáticos.
// Ajusta colores si necesitas alinearlos con la paleta definitiva.
const ESTADO_ENTRADA_META: Record<number, { label: string; short?: string; bg: string; color: string }> = {
  2: { label: 'Pagada', short: 'Pagada', bg: '#D926AA', color: '#FFFFFF' },
  3: { label: 'Asignada', short: 'Asignada', bg: '#673AB7', color: '#FFFFFF' },
  4: { label: 'Controlada', short: 'Controlada', bg: '#2E7D32', color: '#FFFFFF' },
  5: { label: 'Cancelada', short: 'Cancelada', bg: '#B00020', color: '#FFFFFF' },
  6: { label: 'Transferida', short: 'Transferida', bg: '#0277BD', color: '#FFFFFF' },
};

function TicketsPurchasedMenuContent() {
  const router = useRouter();
  const { user } = useAuth();

  // Normalizar extracción de id de usuario desde el contexto (varios formatos observados)
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
  console.log('[TicketPurchasedMenu] fetching entradas for userId:', userId);
  const raw = await getEntradasUsuario(String(userId));
        const list = Array.isArray(raw) ? raw : [];


        // 1) Helpers para IDs
        const getEventId = (r: any): string | null => {
          const ev = r?.evento ?? r?.event ?? null;
          const id = ev?.idEvento ?? ev?.id ?? r?.idEvento ?? r?.eventId ?? r?.id_evento;
          const s = String(id ?? "").trim();
          return s ? s : null;
        };
        const getCompraId = (r: any): string | null => {
          const id = r?.idCompra ?? r?.IdCompra ?? r?.compraId ?? r?.purchaseId ?? r?.id_compra ?? r?.compra?.idCompra ?? r?.pago?.idCompra;
          const s = String(id ?? "").trim();
          return s ? s : null;
        };
        const getFiestaId = (r: any): string | null => {
          const f = r?.fiesta ?? r?.evento ?? r?.event ?? null;
          const id = f?.idFiesta ?? f?.id_fiesta ?? r?.idFiesta ?? r?.fiestaId ?? r?.id_fiesta ?? null;
          const s = String(id ?? "").trim();
          return s ? s : null;
        };
        // 2) Reunir todos los eventIds necesarios (aunque agrupemos por compra)
        const uniqueEventIds = Array.from(
          new Set(
            list
              .map(getEventId)
              .filter((v): v is string => Boolean(v))
          )
        );

        // 3) Buscar detalles de eventos por cada id (solo para datos visuales; no se usa para estado de la entrada)
        const eventMap = new Map<string, EventItemWithExtras>();
        await Promise.all(
          uniqueEventIds.map(async (eid) => {
            try {
              const evt = await fetchEventById(eid);
              if (evt?.id) eventMap.set(String(evt.id), evt);
            } catch (e) {
              // ignorar fallas individuales para no romper toda la lista
            }
          })
        );

        // 4) Construir items SIN agrupar: cada entrada individual muestra su estado real.
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
          // Buscar en distintas variantes y anidaciones
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
        const mapped: TicketPurchasedMenuItem[] = list.map((r: any, idx) => {
          const compraId = getCompraId(r);
          const eid = getEventId(r);
          const fid = getFiestaId(r);
          const fallbackEvent = r?.evento ?? r?.event ?? {};
          const ev = eid ? eventMap.get(eid) : null;
          const fiestaIdFinal = (fid && String(fid)) || getFiestaIdFromEvent(ev) || getFiestaIdFromEvent(fallbackEvent) || undefined;
          const name = ev?.title ?? fallbackEvent?.title ?? fallbackEvent?.nombre ?? fallbackEvent?.eventoNombre ?? 'Evento';
          const date = ev?.date ?? fallbackEvent?.date ?? fallbackEvent?.fecha ?? '';
          const desc = ev?.description ?? fallbackEvent?.description ?? '';
          const imageUrl = ev?.imageUrl ?? fallbackEvent?.imageUrl ?? fallbackEvent?.imagen ?? '';
          let ticketEstadoCd: number | undefined = undefined;
          let ticketEstadoLabel: string | undefined = undefined;
          if (typeof r?.cdEstado !== 'undefined') {
            ticketEstadoCd = Number(r.cdEstado);
            ticketEstadoLabel = r?.dsEstado ?? `Estado ${ticketEstadoCd}`;
          } else if (r?.estado && typeof r.estado === 'object') {
            const st = r.estado;
            if (typeof st?.cdEstado !== 'undefined') ticketEstadoCd = Number(st.cdEstado);
            ticketEstadoLabel = st?.dsEstado ?? (typeof ticketEstadoCd !== 'undefined' ? `Estado ${ticketEstadoCd}` : undefined);
          }
          const eventEstadoCd = typeof ev?.cdEstado !== 'undefined' ? Number(ev.cdEstado) : undefined;
          const isFinished = typeof eventEstadoCd === 'number'
            ? (eventEstadoCd === ESTADO_CODES.FINALIZADO || eventEstadoCd === ESTADO_CODES.CANCELADO)
            : false;
          return ({
            id: idx + 1,
            imageUrl: String(imageUrl || ''),
            eventName: String(name || 'Evento'),
            date: String(date || ''),
            description: String(desc || ''),
            isFinished,
            estadoCd: ticketEstadoCd,
            estadoLabel: ticketEstadoLabel,
            eventId: eid ?? undefined,
            idCompra: compraId ?? undefined,
            ticketsCount: 1,
            fiestaId: fiestaIdFinal,
          } as any) as TicketPurchasedMenuItem;
        });

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

  // Cargar reseñas del usuario y construir set de idFiesta con reseña
  useEffect(() => {
    (async () => {
      try {
        if (!userId) return;
        const list = await getResenias({ idUsuario: String(userId) });
        const s = new Set<string>();
        for (const r of list) {
          const fid = (r && (r.idFiesta || (r as any).IdFiesta || (r as any).fiestaId)) as string | undefined;
          if (fid) s.add(String(fid));
        }
        setUserReviewsSet(s);
      } catch {}
    })();
  }, [userId]);

  const filteredItems = useMemo(() => {
    // 1) Filtrado por estado (si hay selección de filtros de estado de la entrada)
    let base = (!selectedEstadoIds || selectedEstadoIds.length === 0)
      ? items
      : items.filter((it: any) => {
          const estadoCd = typeof (it as any).estadoCd !== 'undefined' ? Number((it as any).estadoCd) : undefined;
          return typeof estadoCd === 'number' && selectedEstadoIds.includes(estadoCd);
        });

    // 2) Agrupación por eventId + idCompra + estadoCd (versión previa restaurada)
    //    Si varias entradas comparten los tres, se agrupan y se muestra el contador.
    const groups: Record<string, any[]> = {};
    const normalizeCompra = (v: any) => {
      const s = String(v ?? '').trim();
      if (!s) return 'SIN_COMPRA';
      return s.replace(/^0+/, '').toLowerCase();
    };
    const normalizeEstado = (v: any) => {
      if (v === null || v === undefined) return 'SIN_ESTADO';
      const n = Number(v);
      return isNaN(n) ? 'SIN_ESTADO' : String(n);
    };
    const normalizeEvent = (v: any) => {
      const s = String(v ?? '').trim();
      return s || 'SIN_EVENTO';
    };
    for (const it of base) {
      const anyIt: any = it as any;
      const idCompraNorm = normalizeCompra(anyIt.idCompra);
      const estadoNorm = normalizeEstado(anyIt.estadoCd);
      const eventNorm = normalizeEvent(anyIt.eventId);
      const key = eventNorm + '|' + idCompraNorm + '|' + estadoNorm;
      if (!groups[key]) groups[key] = [];
      groups[key].push(anyIt);
    }

    const aggregated: any[] = [];
    let autoId = 1;
    for (const key of Object.keys(groups)) {
      const list = groups[key];
      const first = list[0];
      const count = list.length;
      aggregated.push({
        ...first,
        id: autoId++,
        ticketsCount: count,
        description: count > 1 ? `${first.description || ''}\nEntradas en este estado: ${count}` : first.description,
      });
    }
    try {
      console.log('[TicketPurchasedMenu] grupos agrupados (revert):', Object.keys(groups));
    } catch {}
    return aggregated;
  }, [items, selectedEstadoIds]);

  const sortedTickets = useMemo(() => (
    [...filteredItems].sort((a, b) =>
      a.isFinished === b.isFinished ? 0 : a.isFinished ? 1 : -1
    )
  ), [filteredItems]);

  const controlledMatch = (s?: string) => {
    const t = (s || '').toLowerCase();
    return t.includes('controlada') || t.includes('controlado') || t.includes('verificada') || t.includes('escaneada') || t.includes('canjeada');
  };

  const handlePress = (item: TicketPurchasedMenuItem) => {
    const anyItem: any = item as any;
    const eventId = anyItem?.eventId ? String(anyItem.eventId) : undefined;
    const ticketsCount = typeof anyItem?.ticketsCount === 'number' ? anyItem.ticketsCount : undefined;
    const idCompra = anyItem?.idCompra ? String(anyItem.idCompra) : undefined;
    const estadoCd = typeof anyItem?.estadoCd === 'number' ? String(anyItem.estadoCd) : undefined;
    const route = item.isFinished
      ? { pathname: ROUTES.MAIN.TICKETS.FINALIZED, params: { id: item.id, eventId, count: ticketsCount, idCompra, estadoCd } }
      : { pathname: ROUTES.MAIN.TICKETS.PURCHASED, params: { id: item.id, eventId, count: ticketsCount, idCompra, estadoCd } };
    nav.push(router, route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <TabMenuComponent
        tabs={[
          {
            label: "Mis tickets",
            route: ROUTES.MAIN.TICKETS.MENU,
            isActive: true,
          },
          {
            label: "Eventos favoritos",
            route: ROUTES.MAIN.EVENTS.FAV,
            isActive: false,
          },
        ]}
      />

      {/* Filtro por estado de entradas */}
      <FiltroMisTickets
        selectedEstadoIds={selectedEstadoIds}
        onToggleEstado={(id: number) => setSelectedEstadoIds((s: number[]) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
        onClear={() => setSelectedEstadoIds([])}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={{ paddingTop: 20 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <Text style={styles.noItemsText}>{error}</Text>
        ) : sortedTickets.length === 0 ? (
          <Text style={styles.noItemsText}>
            No tienes tickets comprados.
          </Text>
        ) : (
          <View style={styles.containerCards}>
            {sortedTickets.map((item) => {
              const anyItem: any = item as any;
              const showReviewBtn = controlledMatch(anyItem?.estadoLabel) && anyItem?.eventId;
              const fiestaId = anyItem?.fiestaId ? String(anyItem.fiestaId) : undefined;
              const hasReview = fiestaId ? userReviewsSet.has(fiestaId) : false;
              const footer = showReviewBtn ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    const eventId = String(anyItem.eventId);
                    const estadoCd = typeof anyItem?.estadoCd === 'number' ? String(anyItem.estadoCd) : undefined;
                    nav.push(router, { pathname: ROUTES.MAIN.TICKETS.PURCHASED, params: { id: item.id, eventId, idCompra: anyItem.idCompra, estadoCd, openReview: '1' } });
                  }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="star" size={18} color={COLORS.backgroundLight} style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>
                    {hasReview ? 'Ver reseña' : 'Dejar reseña'}
                  </Text>
                </TouchableOpacity>
              ) : null;
              const estadoCd = typeof anyItem?.estadoCd === 'number' ? anyItem.estadoCd : undefined;
              const meta = (estadoCd !== undefined) ? ESTADO_ENTRADA_META[estadoCd] : undefined;
              const count = typeof anyItem.ticketsCount === 'number' ? anyItem.ticketsCount : 1;
              const badgeLabelBase = meta ? (anyItem?.estadoLabel || meta.short || meta.label) : undefined;
              const badgeLabel = badgeLabelBase ? (count > 1 ? `${badgeLabelBase} (${count})` : badgeLabelBase) : undefined;
              return (
                <CardComponent
                  key={item.id}
                  title={item.eventName}
                  text={item.description}
                  date={item.date}
                  foto={item.imageUrl}
                  hideFavorite
                  onPress={() => handlePress(item)}
                  footer={footer}
                  badgeLabel={badgeLabel}
                  badgeColor={meta?.bg}
                  badgeTextColor={meta?.color}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

export default function TicketsPurchasedMenu() {
  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <TicketsPurchasedMenuContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: COLORS.backgroundLight,
  },
  containerCards: {
    marginTop: 0,
    paddingHorizontal: 12,
    rowGap: 16,
  },
  noItemsText: {
    marginTop: 20,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  // Primary button identical to TicketPurchasedScreen
  primaryButton: {
    marginTop: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.backgroundLight,
    textAlign: 'center',
  },
});
