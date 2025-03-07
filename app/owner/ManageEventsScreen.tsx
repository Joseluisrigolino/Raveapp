import React, { useState, useMemo } from "react";
import { SafeAreaView, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import FilterBar from "@/components/FilterBar";
import OwnerEventCard from "@/components/OwnerEventCard";
import { getOwnerEvents } from "@/utils/ownerEventsHelper";
import { OwnerEventItem } from "@/interfaces/OwnerEventItem";

// Importa tus estilos globales
import { COLORS } from "@/styles/globalStyles";

export default function ManageEventsScreen() {
  const router = useRouter();

  // Filtros y búsqueda
  const [filterStatus, setFilterStatus] = useState("todos"); // "todos" | "vigente" | "pendiente" | "finalizado"
  const [orderBy, setOrderBy] = useState("asc"); // "asc" | "desc"
  const [searchText, setSearchText] = useState("");

  // Obtenemos todos los eventos (mock)
  const allEvents = getOwnerEvents();

  // Filtrar y ordenar usando useMemo
  const filteredEvents = useMemo(() => {
    let events = [...allEvents];

    // 1. Filtro por estado
    if (filterStatus !== "todos") {
      events = events.filter((ev) => ev.status === filterStatus);
    }

    // 2. Búsqueda por nombre
    if (searchText.trim().length > 0) {
      const lowerSearch = searchText.toLowerCase();
      events = events.filter((ev) =>
        ev.eventName.toLowerCase().includes(lowerSearch)
      );
    }

    // 3. Ordenar asc/desc por fecha (dd/mm/yyyy)
    events.sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split("/").map(Number);
      const [dayB, monthB, yearB] = b.date.split("/").map(Number);

      const dateA = new Date(yearA, monthA - 1, dayA).getTime();
      const dateB = new Date(yearB, monthB - 1, dayB).getTime();

      return orderBy === "asc" ? dateA - dateB : dateB - dateA;
    });

    return events;
  }, [allEvents, filterStatus, orderBy, searchText]);

  // Handlers para los botones en la card
  const handleTicketsSold = (eventId: number) => {
    console.log("Ver entradas vendidas ID:", eventId);
    // Navegar a la pantalla de entradas vendidas
    router.push(`/owner/TicketSoldScreen?id=${eventId}`);
  };

  const handleModify = (eventId: number) => {
    console.log("Modificar evento ID:", eventId);
    // Podrías navegar a /owner/EditEventScreen?id=eventId
  };

  const handleCancel = (eventId: number) => {
    console.log("Cancelar evento ID:", eventId);
    // Navegar a la pantalla de cancelación
    router.push(`/owner/CancelEventScreen?id=${eventId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {/* Barra de filtros (estado, orden, búsqueda) */}
      <FilterBar
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        orderBy={orderBy}
        onOrderByChange={setOrderBy}
        searchText={searchText}
        onSearchTextChange={setSearchText}
      />

      {/* Lista de eventos en tarjetas */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <OwnerEventCard
            item={item}
            onTicketsSold={handleTicketsSold}
            onModify={handleModify}
            onCancel={handleCancel}
          />
        )}
      />

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  listContent: {
    padding: 8,
  },
});
