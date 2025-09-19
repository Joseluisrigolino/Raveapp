// screens/ManageEventsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

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

export default function ManageEventsScreen() {
  const router = useRouter();
  const { user } = useAuth();

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<ManageEventCardItem[]>([]);

  /**
   * Carga inicial y cada vez que cambian los estados disponibles.
   * Pide a la API los eventos por cada estado, los mergea y normaliza.
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErrorMsg(null);

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

        // Filtrar por propietario si se puede (por id o email)
        const userId = (user as any)?.idUsuario ?? (user as any)?.id ?? null;
        const email = (
          (user as any)?.email ??
          (user as any)?.correo ??
          (user as any)?.mail ??
          ""
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

          if (userId && ownerId) return String(ownerId) === String(userId);
          if (email && ownerEmail) return ownerEmail === email;
          return true;
        });

        if (mounted) setAllEvents(mine);
      } catch (err: any) {
        if (mounted)
          setErrorMsg(err?.message || "No se pudieron cargar tus eventos.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, eventStates]);

  /** Aplicación de filtros y búsqueda */
  const filteredEvents = useMemo(() => {
    let events = [...allEvents];

    if (selectedFilter !== "all") {
      events = events.filter((ev) => ev.statusCode === selectedFilter);
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      events = events.filter((ev) => ev.eventName.toLowerCase().includes(q));
    }

    // Orden por fecha asc (formato dd/mm/yyyy)
    events.sort((a, b) => {
      const [dA, mA, yA] = (a.date || "01/01/1970").split("/").map(Number);
      const [dB, mB, yB] = (b.date || "01/01/1970").split("/").map(Number);
      return (
        new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime()
      );
    });

    return events;
  }, [allEvents, selectedFilter, searchText]);

  /** Navegaciones */
  const handleTicketsSold = (eventId: string | number) => {
    router.push({
      pathname: "/owner/TicketSoldScreen",
      params: { id: String(eventId) },
    });
  };

  const handleModify = (eventId: string | number) => {
    router.push({
      pathname: "/owner/ModifyEventScreen",
      params: { id: String(eventId) },
    });
  };

  const handleCancel = (eventId: string | number) => {
    // ✅ Navegación robusta: id siempre como string + encoding
    router.push({
      pathname: "/owner/CancelEventScreen",
      params: { id: String(eventId) },
    });
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
      <ScrollView contentContainerStyle={styles.listContent}>
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
