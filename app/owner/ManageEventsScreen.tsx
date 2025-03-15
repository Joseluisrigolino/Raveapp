// screens/ManageEventsScreen.tsx
import React, { useState, useMemo } from "react";
import { SafeAreaView, FlatList, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import FilterBar from "@/components/FilterBar";
import OwnerEventCard from "@/components/OwnerEventCard";
import { getOwnerEvents } from "@/utils/ownerEventsHelper";
import { OwnerEventItem } from "@/interfaces/OwnerEventItem";
import { COLORS } from "@/styles/globalStyles";

export default function ManageEventsScreen() {
  const router = useRouter();

  const [filterStatus, setFilterStatus] = useState("todos");
  const [orderBy, setOrderBy] = useState("asc");
  const [searchText, setSearchText] = useState("");

  const allEvents = getOwnerEvents();

  const filteredEvents = useMemo(() => {
    let events = [...allEvents];

    // 1. Filtrar por estado
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

    // 3. Ordenar: finalizados al final, y luego por fecha asc/desc
    events.sort((a, b) => {
      // Primero, empujamos "finalizado" al final
      if (a.status === "finalizado" && b.status !== "finalizado") {
        return 1; // a va después
      }
      if (b.status === "finalizado" && a.status !== "finalizado") {
        return -1; // b va después

      } else {
        // Si ambos son finalizados o ambos no lo son, ordenamos por fecha
        const [dayA, monthA, yearA] = a.date.split("/").map(Number);
        const [dayB, monthB, yearB] = b.date.split("/").map(Number);

        const dateA = new Date(yearA, monthA - 1, dayA).getTime();
        const dateB = new Date(yearB, monthB - 1, dayB).getTime();

        return orderBy === "asc" ? dateA - dateB : dateB - dateA;
      }
    });

    return events;
  }, [allEvents, filterStatus, orderBy, searchText]);

  // Handlers
  const handleTicketsSold = (eventId: number) => {
    router.push(`/owner/TicketsSoldScreen?id=${eventId}`);
  };
  const handleModify = (eventId: number) => {
    router.push(`/owner/ModifyEventScreen?id=${eventId}`);
  };
  const handleCancel = (eventId: number) => {
    router.push(`/owner/CancelEventScreen?id=${eventId}`);
  };

  // RENDER HEADER
  const renderHeader = () => {
    return (
      <View style={{ paddingHorizontal: 8 }}>
        <FilterBar
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          orderBy={orderBy}
          onOrderByChange={setOrderBy}
          searchText={searchText}
          onSearchTextChange={setSearchText}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
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
    paddingBottom: 16,
  },
});
