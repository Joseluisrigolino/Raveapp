// screens/ManageEventsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import SearchBarComponent from "@/components/common/SearchBarComponent";
import OwnerEventCard from "@/components/OwnerEventCard";

import { getOwnerEvents } from "@/utils/owners/ownerEventsHelper";
import { OwnerEventItem } from "@/interfaces/OwnerEventItem";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function ManageEventsScreen() {
  const router = useRouter();

  // Estados disponibles (chips): "Todos", "Vigente", "Pendiente de aprobación", "Finalizado"
  const statusChips = [
    { label: "Todos", value: "todos" },
    { label: "Vigente", value: "vigente" },
    { label: "Pendiente de aprobación", value: "pendiente" },
    { label: "Finalizado", value: "finalizado" },
  ];

  // Estado seleccionado
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");

  // Texto de búsqueda
  const [searchText, setSearchText] = useState("");

  // Obtener eventos (mock o API)
  const allEvents = getOwnerEvents();

  // Filtrado y ordenado con useMemo
  const filteredEvents = useMemo(() => {
    let events = [...allEvents];

    // Filtrar por estado
    if (selectedStatus !== "todos") {
      events = events.filter((ev) => ev.status === selectedStatus);
    }

    // Búsqueda por nombre
    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      events = events.filter((ev) =>
        ev.eventName.toLowerCase().includes(lower)
      );
    }

    // Empujar "finalizado" al final, y luego ordenar por fecha asc (opcional)
    events.sort((a, b) => {
      if (a.status === "finalizado" && b.status !== "finalizado") return 1;
      if (b.status === "finalizado" && a.status !== "finalizado") return -1;
      // Si ambos finalizados o ambos no, podrías ordenar por fecha
      // (ej. ascendente). Ajusta si lo deseas
      const [dA, mA, yA] = a.date.split("/").map(Number);
      const [dB, mB, yB] = b.date.split("/").map(Number);
      const dateA = new Date(yA, mA - 1, dA).getTime();
      const dateB = new Date(yB, mB - 1, dB).getTime();
      return dateA - dateB;
    });

    return events;
  }, [allEvents, selectedStatus, searchText]);

  // Handlers para acciones en las cards
  const handleTicketsSold = (eventId: number) => {
    router.push(`/owner/TicketSoldScreen?id=${eventId}`);
  };
  const handleModify = (eventId: number) => {
    router.push(`/owner/ModifyEventScreen?id=${eventId}`);
  };
  const handleCancel = (eventId: number) => {
    router.push(`/owner/CancelEventScreen?id=${eventId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {/* Sección de filtros (chips horizontales) */}
      <View style={styles.chipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
        >
          {statusChips.map((chip, idx) => {
            const isActive = chip.value === selectedStatus;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.chip,
                  isActive && styles.chipActive,
                ]}
                onPress={() => setSelectedStatus(chip.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && styles.chipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search bar (separado de los eventos) */}
      <View style={styles.searchContainer}>
        <SearchBarComponent
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar por nombre..."
        />
      </View>

      {/* Lista de eventos filtrados */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredEvents.length === 0 ? (
          <Text style={styles.noEventsText}>
            No se encontraron eventos con esos filtros.
          </Text>
        ) : (
          filteredEvents.map((item) => (
            <OwnerEventCard
              key={item.id}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  // Contenedor de chips (filtros)
  chipsContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  chipsScroll: {
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    // Fondo blanco
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
  },
  chipActive: {
    // Fondo negro (o textoPrimario) cuando está activo
    backgroundColor: COLORS.textPrimary,
  },
  chipText: {
    // Texto negro
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
  chipTextActive: {
    // Texto blanco
    color: COLORS.cardBg,
  },

  // Search bar
  searchContainer: {
    marginHorizontal: 8,
    marginBottom: 8,
  },

  // Scroll principal
  scrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  noEventsText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    marginTop: 20,
    textAlign: "center",
  },
});
