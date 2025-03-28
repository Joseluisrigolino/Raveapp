// MenuScreen.tsx
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import CardComponent from "@/components/events/CardComponent";
import FiltersSection from "@/components/filters/FiltersSection";

// <-- importamos nuestro custom hook
import { useMenuFilters } from "@/hooks/filters/useMenuFilters";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function MenuScreen() {
  const router = useRouter();

  // Extraemos todo desde el custom hook
  const {
    // Filtros
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

    // Handlers
    handleLocationTextChange,
    handlePickLocation,
    onStartDateChange,
    onEndDateChange,
    onClearDates,
    onClearLocation,
    onToggleGenre,
    onClearGenres,

    // Resultado final
    filteredEvents,
  } = useMenuFilters();

  // Función para navegar al detalle
  function handleCardPress(_title: string, id?: number) {
    if (id) router.push(`/main/EventsScreens/EventScreen?id=${id}`);
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <FiltersSection
          // 1) Chips horizontales
          isDateActive={Boolean(startDate && endDate)}
          isLocationActive={Boolean(locationText.trim() !== "")}
          isGenreActive={selectedGenres.length > 0}
          weekActive={weekActive}
          afterActive={afterActive}
          lgbtActive={lgbtActive}
          onToggleWeek={() => setWeekActive(!weekActive)}
          onToggleAfter={() => setAfterActive(!afterActive)}
          onToggleLgbt={() => setLgbtActive(!lgbtActive)}

          // 2) SearchBar
          searchText={searchText}
          onSearchTextChange={setSearchText}

          // 3) Date filter
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

          // 4) Location filter
          locationFilterOpen={locationFilterOpen}
          onToggleLocationFilter={() => setLocationFilterOpen(!locationFilterOpen)}
          locationText={locationText}
          onLocationTextChange={handleLocationTextChange}
          locationSuggestions={locationSuggestions}
          onPickLocation={handlePickLocation}
          onClearLocation={onClearLocation}

          // 5) Género filter
          genreFilterOpen={genreFilterOpen}
          onToggleGenreFilter={() => setGenreFilterOpen(!genreFilterOpen)}
          selectedGenres={selectedGenres}
          onToggleGenre={onToggleGenre}
          onClearGenres={onClearGenres}

          nestedScrollEnabled
        />

        {/* Lista de eventos (filtrados) */}
        <View style={styles.containerCards}>
          {filteredEvents.length === 0 ? (
            <Text style={styles.noEventsText}>No existen eventos con esos filtros.</Text>
          ) : (
            filteredEvents.map((ev) => (
              <CardComponent
                key={ev.id}
                title={ev.title}
                text={ev.description}
                date={ev.date}
                foto={ev.imageUrl}
                onPress={() => handleCardPress(ev.title, ev.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

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
  noEventsText: {
    marginTop: 20,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
});
