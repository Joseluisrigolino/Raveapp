import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import FilterCarousel from "@/components/FilterCarousel";
import CardComponent from "@/components/CardComponent";
import { getAllEvents, getEventsByType } from "@/utils/eventHelpers";
import { EventItem } from "@/interfaces/EventProps";

export default function MenuScreen() {
  const router = useRouter();

  // Los tipos de fiesta para el carrusel
  const fiestaTipos = ["Rave", "Techno", "House", "LGBT", "Pop", "Electrónica"];

  // Estado: qué filtro está seleccionado
  const [selectedFilter, setSelectedFilter] = useState<string>("");

  // Estado: los eventos que se mostrarán
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);

  // Al iniciar o cambiar el filtro, actualizamos la lista
  useEffect(() => {
    if (!selectedFilter) {
      // Si no hay filtro, mostramos todos
      setFilteredEvents(getAllEvents());
    } else {
      // Si hay filtro, mostramos solo los que coincidan
      setFilteredEvents(getEventsByType(selectedFilter));
    }
  }, [selectedFilter]);

  // Cuando pulsamos un filtro:
  const handleFilterPress = (filtro: string) => {
    // Si ya está seleccionado, lo des-seleccionamos
    if (filtro === selectedFilter) {
      setSelectedFilter("");
    } else {
      setSelectedFilter(filtro);
    }
  };

  // Al tocar una tarjeta, navegamos a EventScreen
  const handleCardPress = (title = "", id?: number) => {
    if (id) {
      router.push(`/main/EventsScreens/EventScreen?id=${id}`);
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Pasamos selectedFilter para que el carrusel sepa cuál está activo */}
        <FilterCarousel
          filtros={fiestaTipos}
          onFilterPress={handleFilterPress}
          selectedFilter={selectedFilter}
        />

        <View style={styles.containerCards}>
          {filteredEvents.map((ev) => (
            <CardComponent
              key={ev.id}
              title={ev.title}
              text="Diviértete con amigos"
              foto={ev.imageUrl}
              onPress={() => handleCardPress(ev.title, ev.id)}
            />
          ))}
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  containerCards: {
    flex: 1,
    marginTop: 10,
  },
});
