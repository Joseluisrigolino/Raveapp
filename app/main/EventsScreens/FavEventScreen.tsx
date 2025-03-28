// app/main/EventsScreens/FavEventScreen.tsx
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";  // <-- Se importa para el submenú
import CardComponent from "@/components/events/CardComponent";
import FiltersSection from "@/components/filters/FiltersSection";

// Hook personalizado de filtros de "favoritos"
import { useFavFilters } from "@/hooks/filters/useFavFilters";

import { COLORS, FONT_SIZES } from "@/styles/globalStyles";

export default function FavEventScreen() {
  const router = useRouter();

  // Obtenemos todas las variables y handlers desde el hook
  const {
    // Estados/handlers de texto de búsqueda, fechas, ubicación, géneros, etc.
    searchText, setSearchText,
    dateFilterOpen, setDateFilterOpen,
    startDate, endDate,
    showStartPicker, setShowStartPicker,
    showEndPicker, setShowEndPicker,
    locationFilterOpen, setLocationFilterOpen,
    locationText,
    locationSuggestions,
    weekActive, setWeekActive,
    afterActive, setAfterActive,
    lgbtActive, setLgbtActive,
    genreFilterOpen, setGenreFilterOpen,
    selectedGenres,
    handleLocationTextChange,
    handlePickLocation,
    onStartDateChange,
    onEndDateChange,
    onClearDates,
    onClearLocation,
    onToggleGenre,
    onClearGenres,

    // Lista de eventos favoritos tras aplicar filtros
    filteredEvents,
  } = useFavFilters();

  // Navegar al detalle del evento
  function handleCardPress(_title: string, id?: number) {
    if (id) {
      router.push(`/main/EventsScreens/EventScreen?id=${id}`);
    }
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />

      {/* Submenú igual que en TicketsPurchasedMenu */}
      <TabMenuComponent
        tabs={[
          {
            label: "Mis tickets",
            route: "/main/TicketsScreens/TicketPurchasedMenu",
            isActive: false,
          },
          {
            label: "Eventos favoritos",
            route: "/main/EventsScreens/FavEventScreen",
            isActive: true,
          },
        ]}
      />

      {/* Contenido principal con scroll y filtros */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {/* Sección de filtros (igual que antes) */}
        <FiltersSection
          isDateActive={Boolean(startDate && endDate)}
          isLocationActive={Boolean(locationText.trim() !== "")}
          isGenreActive={selectedGenres.length > 0}
          weekActive={weekActive}
          afterActive={afterActive}
          lgbtActive={lgbtActive}
          onToggleWeek={() => setWeekActive(!weekActive)}
          onToggleAfter={() => setAfterActive(!afterActive)}
          onToggleLgbt={() => setLgbtActive(!lgbtActive)}

          searchText={searchText}
          onSearchTextChange={setSearchText}

          dateFilterOpen={dateFilterOpen}
          onToggleDateFilter={() => setDateFilterOpen(!dateFilterOpen)}
          startDate={startDate}
          endDate={endDate}
          showStartPicker={showStartPicker}
          showEndPicker={showEndPicker}
          onShowStartPicker={setShowStartPicker}
          onShowEndPicker={setShowEndPicker}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onClearDates={onClearDates}

          locationFilterOpen={locationFilterOpen}
          onToggleLocationFilter={() => setLocationFilterOpen(!locationFilterOpen)}
          locationText={locationText}
          onLocationTextChange={handleLocationTextChange}
          locationSuggestions={locationSuggestions}
          onPickLocation={handlePickLocation}
          onClearLocation={onClearLocation}

          genreFilterOpen={genreFilterOpen}
          onToggleGenreFilter={() => setGenreFilterOpen(!genreFilterOpen)}
          selectedGenres={selectedGenres}
          onToggleGenre={onToggleGenre}
          onClearGenres={onClearGenres}

          nestedScrollEnabled
        />

        {/* Render de los eventos filtrados */}
        <View style={styles.containerCards}>
          {filteredEvents.length === 0 ? (
            <Text style={styles.noEventsText}>
              No existen eventos con esos filtros.
            </Text>
          ) : (
            filteredEvents.map((ev) => (
              <View key={ev.id} style={styles.cardContainer}>
                <CardComponent
                  title={ev.title}
                  text={ev.description}
                  date={ev.date}
                  foto={ev.imageUrl}
                  onPress={() => handleCardPress(ev.title, ev.id)}
                />
                {/* Botón de "Quitar de favoritos" (simulado) */}
                <IconButton
                  icon="heart"
                  size={24}
                  iconColor={COLORS.negative}
                  style={styles.heartIcon}
                  onPress={() => console.log("Quitar de favoritos:", ev.id)}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  containerCards: {
    marginTop: 10,
    paddingHorizontal: 8,
  },
  cardContainer: {
    position: "relative",
    marginBottom: 10,
  },
  heartIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "transparent",
  },
  noEventsText: {
    marginTop: 20,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
});
