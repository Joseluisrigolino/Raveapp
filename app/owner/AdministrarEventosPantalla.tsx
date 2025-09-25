// screens/ManageEventsScreen.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ROUTES } from "../../routes";
import * as nav from "@/utils/navigation";
import { useFocusEffect } from "@react-navigation/native";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import SearchBarComponent from "@/components/common/SearchBarComponent";
import ManageEventFilters, {
  FilterValue,
} from "@/components/events/manage/Filters";
import CardsManageEvent, {
  ManageEventCardItem,
} from "@/components/events/manage/CardsManageEvent";

import { COLORS, FONT_SIZES } from "@/styles/globalStyles";
import { useAuth } from "@/context/AuthContext";
import { fetchEvents } from "@/utils/events/eventApi";

/** Etiquetas fallback si la API de estados no estuviera disponible */
const FALLBACK_STATE_LABEL: Record<number, string> = {
  0: "Por Aprobar",
  1: "Aprobado",
  2: "En venta",
  3: "Fin Venta",
  4: "Finalizado",
  5: "Cancelado",
  6: "Rechazado",
};

/**
 * Orden de prioridad requerido:
 * 1) Aprobado (1)
 * 2) En venta (2)
 * 3) Por Aprobar (0)
 * 4) Fin Venta (3)
 * 5) Finalizado (4)
 * 6) Cancelado (5)
 * 7) Rechazado (6)
 */
const STATUS_ORDER = [1, 2, 0, 3, 4, 5, 6];
const statusPriority = (code: number) => {
  const idx = STATUS_ORDER.indexOf(code);
  return idx === -1 ? 999 : idx;
};

/** Helper: compara fechas dd/mm/yyyy asc */
const compareDatesAsc = (a: string, b: string) => {
  const [dA, mA, yA] = (a || "01/01/1970").split("/").map(Number);
  const [dB, mB, yB] = (b || "01/01/1970").split("/").map(Number);
  const tA = new Date(yA, mA - 1, dA).getTime();
  const tB = new Date(yB, mB - 1, dB).getTime();
  return tA - tB;
};

export default function ManageEventsScreen() {
  const router = useRouter();
  // Usamos el contexto de autenticación. Además de `user` el contexto
  // expone helpers como `isAuthenticated`, `hasRole`, `hasAnyRole` que
  // permiten centralizar la lógica de permisos y evitar repetir checks
  // en cada componente.
  const { user, isAuthenticated, hasRole, hasAnyRole } = useAuth();

  /** Filtro seleccionado ("all" o código de estado) */
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>("all");

  /** Estados traídos por el componente Filters desde la API */
  const [eventStates, setEventStates] = useState<
    { code: number; label: string }[]
  >([]);

  /** Búsqueda por texto */
  const [searchText, setSearchText] = useState("");

  /** Datos */
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<ManageEventCardItem[]>([]);

  /** Cargador central de eventos (se usa en focus y pull-to-refresh) */
  const loadAllEvents = useCallback(async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const codes =
        eventStates.length > 0
          ? eventStates.map((s) => s.code)
          : [0, 1, 2, 3, 4, 5, 6];

      const batches = await Promise.all(
        codes.map(async (code) => {
          try {
            const arr = await fetchEvents(code); // normalizados por estado
            const label =
              eventStates.find((s) => s.code === code)?.label ??
              FALLBACK_STATE_LABEL[code] ??
              `Estado ${code}`;

            // Map a la forma que consume la Card
            return arr.map((e: any) => ({
              id: String(e.id),
              eventName: e.title ?? "",
              date: e.date ?? "",
              timeRange: e.timeRange ?? "",
              imageUrl: e.imageUrl || "",
              address: e.address ?? "",
              type: e.type ?? "Otros",
              statusCode: code,
              statusLabel: label,
              __raw: e, // por si en el futuro querés filtrar por propietario
            })) as ManageEventCardItem[];
          } catch (err: any) {
            console.warn(
              `[GetEventos Estado=${code}]`,
              err?.response?.status || err?.message
            );
            return [] as ManageEventCardItem[];
          }
        })
      );

      const merged = batches.flat();

      // Filtrar por propietario si se puede (por id o email).
      // El backend puede devolver distintos campos según el helper usado,
      // por eso intentamos varios nombres comunes. Idealmente el `AuthUser`
      // debería normalizar `id` y `username`.
      const userId = (user as any)?.idUsuario ?? (user as any)?.id ?? null;
      const email = (
        (user as any)?.email ?? (user as any)?.correo ?? (user as any)?.mail ?? ""
      )
        .toString()
        .toLowerCase();

      const mine = merged.filter((ev: any) => {
        const ownerId =
          ev?.__raw?.ownerId ??
          ev?.__raw?.propietario?.idUsuario ??
          ev?.__raw?.idUsuarioPropietario ??
          null;

        const ownerEmail = (
          ev?.__raw?.ownerEmail ?? ev?.__raw?.propietario?.correo ?? ""
        )
          .toString()
          .toLowerCase();

        // Solo mostrar eventos creados por el usuario logueado
        if (userId && ownerId) return String(ownerId) === String(userId);
        if (email && ownerEmail) return ownerEmail === email;
        return false; // No mostrar eventos de otros usuarios
      });

      setAllEvents(mine);
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudieron cargar tus eventos.");
    } finally {
      setLoading(false);
    }
  }, [user, eventStates]);

  /** Recarga cada vez que la pantalla vuelve a estar enfocada */
  useFocusEffect(
    useCallback(() => {
      loadAllEvents();
      return () => {};
    }, [loadAllEvents])
  );

  /** Pull-to-refresh */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAllEvents();
    } finally {
      setRefreshing(false);
    }
  }, [loadAllEvents]);

  /** Aplicación de filtros, búsqueda y ORDEN personalizado */
  const filteredEvents = useMemo(() => {
    let events = [...allEvents];

    if (selectedFilter !== "all") {
      events = events.filter((ev) => ev.statusCode === selectedFilter);
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      events = events.filter((ev) => ev.eventName.toLowerCase().includes(q));
    }

    events.sort((a, b) => {
      const pa = statusPriority(a.statusCode);
      const pb = statusPriority(b.statusCode);
      if (pa !== pb) return pa - pb;
      return compareDatesAsc(a.date, b.date);
    });

    return events;
  }, [allEvents, selectedFilter, searchText]);

  /** Navegaciones */
  const handleTicketsSold = (eventId: string | number) => {
    const id = String(eventId);
    nav.push(router, { pathname: ROUTES.OWNER.TICKET_SOLD, params: { id } });
  };

  const handleModify = (eventId: string | number) => {
    const id = String(eventId);
    nav.push(router, { pathname: ROUTES.OWNER.MODIFY_EVENT, params: { id } });
  };

  const handleCancel = (eventId: string | number) => {
    const id = String(eventId);
    nav.push(router, { pathname: ROUTES.OWNER.CANCEL_EVENT, params: { id } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {/* Filtros por estado desde API + "Todos" */}
      <ManageEventFilters
        value={selectedFilter}
        onChange={setSelectedFilter}
        onStatesLoaded={setEventStates}
      />

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <SearchBarComponent
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar por nombre..."
        />
      </View>

      {/* Lista */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Cargando tus eventos…</Text>
          </View>
        ) : errorMsg ? (
          <Text style={styles.noEventsText}>{errorMsg}</Text>
        ) : filteredEvents.length === 0 ? (
          <Text style={styles.noEventsText}>
            No se encontraron eventos con esos filtros.
          </Text>
        ) : (
          filteredEvents.map((item) => (
            <CardsManageEvent
              key={String(item.id)}
              item={item}
              onTicketsSold={handleTicketsSold}
              onModify={handleModify}
              onCancel={handleCancel}
            />
          ))
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  searchContainer: { marginHorizontal: 8, marginBottom: 8 },
  listContent: { paddingBottom: 16, paddingHorizontal: 8 },
  loadingBox: { paddingTop: 24, alignItems: "center" },
  loadingText: { marginTop: 8, color: COLORS.textSecondary },
  noEventsText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    marginTop: 20,
    textAlign: "center",
  },
});
