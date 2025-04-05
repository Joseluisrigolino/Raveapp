// app/main/MenuScreen.tsx
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

import { useMenuFilters } from "@/hooks/filters/useMenuFilters";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function MenuScreen() {
  const router = useRouter();
  const {
    searchText, setSearchText,
    dateFilterOpen, setDateFilterOpen,
    startDate, endDate,
    showStartPicker, setShowStartPicker,
    showEndPicker, setShowEndPicker,
    locationFilterOpen, setLocationFilterOpen,
    provinceText,
    onProvinceTextChange,
    provinceSuggestions,
    onPickProvince,
    municipalityText,
    onMunicipalityTextChange,
    municipalitySuggestions,
    onPickMunicipality,
    localityText,
    onLocalityTextChange,
    localitySuggestions,
    onPickLocality,
    onClearLocation,
    weekActive, setWeekActive,
    afterActive, setAfterActive,
    lgbtActive, setLgbtActive,
    genreFilterOpen, setGenreFilterOpen,
    selectedGenres,
    onStartDateChange,
    onEndDateChange,
    onClearDates,
    onToggleGenre,
    onClearGenres,
    filteredEvents,
  } = useMenuFilters();

  const handleToggleDateFilter = () => {
    setDateFilterOpen(!dateFilterOpen);
    setLocationFilterOpen(false);
    setGenreFilterOpen(false);
  };

  const handleToggleLocationFilter = () => {
    setLocationFilterOpen(!locationFilterOpen);
    setDateFilterOpen(false);
    setGenreFilterOpen(false);
  };

  const handleToggleGenreFilter = () => {
    setGenreFilterOpen(!genreFilterOpen);
    setDateFilterOpen(false);
    setLocationFilterOpen(false);
  };

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
          isDateActive={Boolean(startDate && endDate)}
          isLocationActive={Boolean(provinceText || municipalityText || localityText)}
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
          onToggleDateFilter={handleToggleDateFilter}
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
          onToggleLocationFilter={handleToggleLocationFilter}
          provinceText={provinceText}
          onProvinceTextChange={onProvinceTextChange}
          provinceSuggestions={provinceSuggestions}
          onPickProvince={onPickProvince}
          municipalityText={municipalityText}
          onMunicipalityTextChange={onMunicipalityTextChange}
          municipalitySuggestions={municipalitySuggestions}
          onPickMunicipality={onPickMunicipality}
          localityText={localityText}
          onLocalityTextChange={onLocalityTextChange}
          localitySuggestions={localitySuggestions}
          onPickLocality={onPickLocality}
          onClearLocation={onClearLocation}
          genreFilterOpen={genreFilterOpen}
          onToggleGenreFilter={handleToggleGenreFilter}
          selectedGenres={selectedGenres}
          onToggleGenre={onToggleGenre}
          onClearGenres={onClearGenres}
          nestedScrollEnabled
        />

        <View style={styles.containerCards}>
          {filteredEvents.length === 0 ? (
            <Text style={styles.noEventsText}>
              No existen eventos con esos filtros.
            </Text>
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
