import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import FilterCarousel from "@/components/FilterCarousel";
import CardComponent from "@/components/CardComponent";
import { getAllEvents, getEventsByType } from "@/utils/eventHelpers";
import { EventItem } from "@/interfaces/EventProps";

// Importa tus estilos globales
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

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
      setFilteredEvents(getAllEvents());
    } else {
      setFilteredEvents(getEventsByType(selectedFilter));
    }
  }, [selectedFilter]);

  const handleFilterPress = (filtro: string) => {
    // Si ya está seleccionado, lo des-seleccionamos
    if (filtro === selectedFilter) {
      setSelectedFilter("");
    } else {
      setSelectedFilter(filtro);
    }
  };

  const handleCardPress = (title = "", id?: number) => {
    if (id) {
      router.push(`/main/EventsScreens/EventScreen?id=${id}`);
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false}>
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
    backgroundColor: COLORS.backgroundLight, // Gris claro principal
  },
  containerCards: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 8, // Ejemplo de padding lateral
  },
});
