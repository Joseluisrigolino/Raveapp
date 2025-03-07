// owner/ManageEventsScreen.tsx
import React, { useState, useMemo } from "react";
import { SafeAreaView, FlatList, StyleSheet, View } from "react-native";
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
  const [filterStatus, setFilterStatus] = useState("todos");
  const [orderBy, setOrderBy] = useState("asc");
  const [searchText, setSearchText] = useState("");

  const allEvents = getOwnerEvents();

  // Filtramos y ordenamos
  const filteredEvents = useMemo(() => {
    let events = [...allEvents];

    // Filtro por estado
    if (filterStatus !== "todos") {
      events = events.filter((ev) => ev.status === filterStatus);
    }

    // Búsqueda
    if (searchText.trim().length > 0) {
      const lowerSearch = searchText.toLowerCase();
      events = events.filter((ev) =>
        ev.eventName.toLowerCase().includes(lowerSearch)
      );
    }

    // Ordenar (ejemplo asc/desc por fecha)
    events.sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split("/").map(Number);
      const [dayB, monthB, yearB] = b.date.split("/").map(Number);

      const dateA = new Date(yearA, monthA - 1, dayA).getTime();
      const dateB = new Date(yearB, monthB - 1, dayB).getTime();

      return orderBy === "asc" ? dateA - dateB : dateB - dateA;
    });

    return events;
  }, [allEvents, filterStatus, orderBy, searchText]);

  // Handlers para botones
  const handleTicketsSold = (eventId: number) => {
    console.log("Ver entradas vendidas ID:", eventId);
    // Podrías navegar a /owner/TicketsSoldScreen?id=eventId
  };
  const handleModify = (eventId: number) => {
    console.log("Modificar evento ID:", eventId);
    // Podrías navegar a /owner/EditEventScreen?id=eventId
  };
  const handleCancel = (eventId: number) => {
    console.log("Cancelar evento ID:", eventId);
    // Popup de confirmación, etc.
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {/* Filtro, orden, búsqueda */}
      <FilterBar
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        orderBy={orderBy}
        onOrderByChange={setOrderBy}
        searchText={searchText}
        onSearchTextChange={setSearchText}
      />

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
