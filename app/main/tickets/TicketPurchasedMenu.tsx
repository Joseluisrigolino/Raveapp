// app/main/TicketsScreens/TicketsPurchasedMenu.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ROUTES } from "../../../routes";
import * as nav from "@/utils/navigation";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import CardComponent from "@/components/events/CardComponent";

import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";
import { useAuth } from "@/context/AuthContext";
import { getEntradasUsuario } from "@/utils/auth/userHelpers";
import { fetchEventById, EventItemWithExtras, ESTADO_CODES } from "@/utils/events/eventApi";

function TicketsPurchasedMenuContent() {
  const router = useRouter();
  const { user } = useAuth();

  const userId: string | null = (user as any)?.id ?? (user as any)?.idUsuario ?? null;

  const [items, setItems] = useState<TicketPurchasedMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // 2) Reunir todos los eventIds necesarios (aunque agrupemos por compra)
        const uniqueEventIds = Array.from(
          new Set(
            list
              .map(getEventId)
              .filter((v): v is string => Boolean(v))
          )
        );

        // 3) Buscar detalles de eventos por cada id
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

        // 4) Agrupar entradas por idCompra
        type Group = {
          count: number;
          compraId: string;
          eventId: string | null;
          evt: EventItemWithExtras | null;
          fallbackEvent: any;
          anyRaw: any;
        };
        const groups = new Map<string, Group>();
        list.forEach((r: any) => {
          const compraId = getCompraId(r);
          const eid = getEventId(r);
          const fallbackEvent = r?.evento ?? r?.event ?? {};
          if (!compraId && !eid) return; // si no hay compraId ni eventId, salteamos
          const key = compraId ? String(compraId) : String(eid);
          const prev = groups.get(key);
          if (prev) {
            prev.count += 1;
            // si no teníamos eventId, tomar la primera aparición
            if (!prev.eventId && eid) {
              prev.eventId = eid;
              prev.evt = (eid && eventMap.get(eid)) || prev.evt;
            }
          } else {
            groups.set(key, {
              count: 1,
              compraId: compraId || key,
              eventId: eid || null,
              evt: (eid && eventMap.get(eid)) || null,
              fallbackEvent,
              anyRaw: r,
            });
          }
        });

        // 5) Construir las cards usando datos del evento real; agregar indicador "xN entradas"
        const mapped: TicketPurchasedMenuItem[] = Array.from(groups.values()).map((g, idx) => {
          const ev = g.evt;
          const fb = g.fallbackEvent || {};
          const name = ev?.title ?? fb?.title ?? fb?.nombre ?? fb?.eventoNombre ?? "Evento";
          const date = ev?.date ?? fb?.date ?? fb?.fecha ?? "";
          const baseDesc = ev?.description ?? fb?.description ?? "";
          const desc = g.count > 1 ? `${baseDesc ? baseDesc + ' · ' : ''}x${g.count} entradas` : baseDesc;
          const imageUrl = ev?.imageUrl ?? fb?.imageUrl ?? fb?.imagen ?? "";
          const estado = ev?.estado ?? ev?.cdEstado ?? fb?.estado ?? fb?.cdEstado ?? g.anyRaw?.estado;
          const estadoNum = Number(estado);
          const isFinished = estadoNum === ESTADO_CODES.FINALIZADO || estadoNum === ESTADO_CODES.CANCELADO;

          return ({
            id: idx + 1,
            imageUrl: String(imageUrl || ""),
            eventName: String(name || "Evento"),
            date: String(date || ""),
            description: String(desc || ""),
            isFinished,
            // extras para navegación
            eventId: g.eventId ?? undefined,
            idCompra: g.compraId,
            ticketsCount: g.count,
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

  const sortedTickets = useMemo(() => (
    [...items].sort((a, b) =>
    a.isFinished === b.isFinished ? 0 : a.isFinished ? 1 : -1
  )
  ), [items]);

  const handlePress = (item: TicketPurchasedMenuItem) => {
    const anyItem: any = item as any;
    const eventId = anyItem?.eventId ? String(anyItem.eventId) : undefined;
    const ticketsCount = typeof anyItem?.ticketsCount === 'number' ? anyItem.ticketsCount : undefined;
    const idCompra = anyItem?.idCompra ? String(anyItem.idCompra) : undefined;
    const route = item.isFinished
      ? { pathname: ROUTES.MAIN.TICKETS.FINALIZED, params: { id: item.id, eventId, count: ticketsCount, idCompra } }
      : { pathname: ROUTES.MAIN.TICKETS.PURCHASED, params: { id: item.id, eventId, count: ticketsCount, idCompra } };
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
            {sortedTickets.map((item) => (
              <CardComponent
                key={item.id}
                title={item.eventName}
                text={item.description}
                date={item.date}
                foto={item.imageUrl}
                hideFavorite
                onPress={() => handlePress(item)}
              />
            ))}
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
});
