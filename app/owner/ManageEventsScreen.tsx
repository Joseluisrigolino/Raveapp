// screens/ManageEventsScreen.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import SearchBarComponent from "@/components/common/SearchBarComponent";
import OwnerEventCard from "@/components/OwnerEventCard";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { useAuth } from "@/context/AuthContext";
import { fetchEvents } from "@/utils/events/eventApi";
import { OwnerEventItem } from "@/interfaces/OwnerEventItem";

/** mapa código → etiqueta oficial (de GetEstadosEvento) */
const STATE_LABEL: Record<number, string> = {
  0: "Por Aprobar",
  1: "Aprobado",
  2: "En venta",
  3: "Fin Venta",
  4: "Finalizado",
  5: "Cancelado",
  6: "Rechazado",
};

type ChipValue = "todos" | "vigente" | "pendiente" | "finalizado";
function mapCodeToChip(code: number): ChipValue {
  if (code === 2) return "vigente";   // En venta
  if (code === 0) return "pendiente"; // Por Aprobar
  // Aprobado (1), Fin Venta (3), Finalizado (4), Cancelado (5), Rechazado (6)
  return "finalizado";
}

export default function ManageEventsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const statusChips: { label: string; value: ChipValue }[] = [
    { label: "Todos", value: "todos" },
    { label: "Vigente", value: "vigente" },
    { label: "Pendiente de aprobación", value: "pendiente" },
    { label: "Finalizado", value: "finalizado" },
  ];

  const [selectedStatus, setSelectedStatus] = useState<ChipValue>("todos");
  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<
    (OwnerEventItem & { statusCode: number; statusLabel: string })[]
  >([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const codes = [0, 1, 2, 3, 4, 5, 6];

        // 🔐 Cada pedido aislado: si falla (404 incluidos), se ignora ese lote.
        const batches = await Promise.all(
          codes.map(async (code) => {
            try {
              const arr = await fetchEvents(code);
              return arr.map((e) => ({
                __raw: e,
                statusCode: code,
                statusLabel: STATE_LABEL[code] ?? "—",
              }));
            } catch (err: any) {
              // 404 u otro error -> tratamos como vacío
              console.warn(`[GetEventos Estado=${code}]`, err?.response?.status || err?.message);
              return [] as any[];
            }
          })
        );

        const mergedRaw = batches.flat();

        // Filtrar por propietario si podemos (id o email)
        const userId =
          (user as any)?.idUsuario ?? (user as any)?.id ?? null;
        const email = ((user as any)?.email ?? (user as any)?.correo ?? (user as any)?.mail ?? "")
          .toString()
          .toLowerCase();

        const mine = mergedRaw.filter(({ __raw }) => {
          const ownerId =
            (__raw as any)?.ownerId ??
            (__raw as any)?.propietario?.idUsuario ??
            (__raw as any)?.idUsuarioPropietario ??
            null;

          const ownerEmail = ((__raw as any)?.ownerEmail ?? (__raw as any)?.propietario?.correo ?? "")
            .toString()
            .toLowerCase();

          if (userId && ownerId) return String(ownerId) === String(userId);
          if (email && ownerEmail) return ownerEmail === email;
          return true; // si no sabemos, no excluir
        });

        const toOwnerItem = (x: any): OwnerEventItem & { statusCode: number; statusLabel: string } => {
          const e = x.__raw;
          return {
            id: String(e.id) as any,
            eventName: e.title ?? "",
            date: e.date ?? "",
            timeRange: e.timeRange ?? "",
            imageUrl: e.imageUrl || "", // si viene vacío, la card ya no rompe
            address: e.address ?? "",
            type: e.type ?? "Otros",
            status: mapCodeToChip(x.statusCode), // para el filtrado por chips
            statusCode: x.statusCode,
            statusLabel: x.statusLabel,
          };
        };

        if (mounted) setAllEvents(mine.map(toOwnerItem));
      } catch (err: any) {
        if (mounted) setErrorMsg(err?.message || "No se pudieron cargar tus eventos.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const filteredEvents = useMemo(() => {
    let events = [...allEvents];

    if (selectedStatus !== "todos") {
      events = events.filter((ev) => ev.status === selectedStatus);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      events = events.filter((ev) => ev.eventName.toLowerCase().includes(q));
    }

    // Empujar “finalizado” al fondo, ordenar por fecha asc (dd/mm/yyyy)
    events.sort((a, b) => {
      if (a.status === "finalizado" && b.status !== "finalizado") return 1;
      if (b.status === "finalizado" && a.status !== "finalizado") return -1;

      const [dA, mA, yA] = (a.date || "01/01/1970").split("/").map(Number);
      const [dB, mB, yB] = (b.date || "01/01/1970").split("/").map(Number);
      return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
    });

    return events;
  }, [allEvents, selectedStatus, searchText]);

  const handleTicketsSold = (eventId: string | number) => {
    router.push(`/owner/TicketSoldScreen?id=${eventId}`);
  };
  const handleModify = (eventId: string | number) => {
    router.push(`/owner/ModifyEventScreen?id=${eventId}`);
  };
  const handleCancel = (eventId: string | number) => {
    router.push(`/owner/CancelEventScreen?id=${eventId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {statusChips.map((chip) => {
            const isActive = chip.value === selectedStatus;
            return (
              <TouchableOpacity
                key={chip.value}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedStatus(chip.value)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.searchContainer}>
        <SearchBarComponent
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar por nombre..."
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={{ paddingTop: 24, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: COLORS.textSecondary }}>
              Cargando tus eventos…
            </Text>
          </View>
        ) : errorMsg ? (
          <Text style={styles.noEventsText}>{errorMsg}</Text>
        ) : filteredEvents.length === 0 ? (
          <Text style={styles.noEventsText}>No se encontraron eventos con esos filtros.</Text>
        ) : (
          filteredEvents.map((item) => (
            <OwnerEventCard
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
  chipsContainer: { paddingHorizontal: 8, paddingTop: 8 },
  chipsScroll: { marginBottom: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
  },
  chipActive: { backgroundColor: COLORS.textPrimary },
  chipText: { color: COLORS.textPrimary, fontWeight: "bold" },
  chipTextActive: { color: COLORS.cardBg },
  searchContainer: { marginHorizontal: 8, marginBottom: 8 },
  scrollContent: { paddingBottom: 16, paddingHorizontal: 8 },
  noEventsText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    marginTop: 20,
    textAlign: "center",
  },
});
