// app/main/MenuScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import CardComponent from "@/components/events/CardComponent";
import FiltersSection from "@/components/filters/FiltersSection";

import { COLORS, FONT_SIZES } from "@/styles/globalStyles";
import { EventItem } from "@/interfaces/EventItem";
import { fetchEvents } from "@/utils/events/eventApi";
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
  fetchLocalitiesByName,
} from "@/utils/georef/georefHelpers";

// Helper para rango de semana
function getWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Domingo = 0
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return { startOfWeek, endOfWeek };
}

export default function MenuScreen() {
  const router = useRouter();

  // Estados para eventos y carga
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Carga de eventos desde API
  useEffect(() => {
    fetchEvents()
      .then(evts => setAllEvents(evts))
      .catch(err => console.error("Error cargando eventos:", err))
      .finally(() => setLoading(false));
  }, []);

  // Estados de filtros
  const [searchText, setSearchText] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  const [provinceText, setProvinceText] = useState("");
  const [provinceSuggestions, setProvinceSuggestions] = useState<{ id: string; nombre: string }[]>([]);
  const [municipalityText, setMunicipalityText] = useState("");
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<{ id: string; nombre: string }[]>([]);
  const [localityText, setLocalityText] = useState("");
  const [localitySuggestions, setLocalitySuggestions] = useState<{ id: string; nombre: string }[]>([]);

  const [weekActive, setWeekActive] = useState(false);
  const [afterActive, setAfterActive] = useState(false);
  const [lgbtActive, setLgbtActive] = useState(false);
  const [genreFilterOpen, setGenreFilterOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Handlers de ubicación
  async function onProvinceTextChange(value: string) {
    setProvinceText(value);
    if (value.trim().length < 3) {
      setProvinceSuggestions([]);
      return;
    }
    try {
      const results = await fetchProvinces();
      setProvinceSuggestions(
        results.filter(p => p.nombre.toLowerCase().includes(value.toLowerCase()))
      );
    } catch {
      setProvinceSuggestions([]);
    }
  }
  function onPickProvince(name: string) {
    setProvinceText(name);
    setProvinceSuggestions([]);
  }

  async function onMunicipalityTextChange(value: string) {
    setMunicipalityText(value);
    if (value.trim().length < 3 || !provinceText) {
      setMunicipalitySuggestions([]);
      return;
    }
    try {
      const results = await fetchMunicipalities(provinceText);
      setMunicipalitySuggestions(
        results.filter(m => m.nombre.toLowerCase().includes(value.toLowerCase()))
      );
    } catch {
      setMunicipalitySuggestions([]);
    }
  }
  function onPickMunicipality(name: string) {
    setMunicipalityText(name);
    setMunicipalitySuggestions([]);
  }

  async function onLocalityTextChange(value: string) {
    setLocalityText(value);
    if (value.trim().length < 3) {
      setLocalitySuggestions([]);
      return;
    }
    try {
      if (provinceText && municipalityText) {
        const results = await fetchLocalities(provinceText, municipalityText);
        setLocalitySuggestions(
          results.filter(l => l.nombre.toLowerCase().includes(value.toLowerCase()))
        );
      } else {
        const results = await fetchLocalitiesByName(value);
        setLocalitySuggestions(results);
      }
    } catch {
      setLocalitySuggestions([]);
    }
  }
  function onPickLocality(name: string) {
    setLocalityText(name);
    setLocalitySuggestions([]);
  }

  function onClearLocation() {
    setProvinceText("");
    setMunicipalityText("");
    setLocalityText("");
    setProvinceSuggestions([]);
    setMunicipalitySuggestions([]);
    setLocalitySuggestions([]);
  }

  function onToggleGenre(g: string) {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(item => item !== g) : [...prev, g]
    );
  }
  function onClearGenres() {
    setSelectedGenres([]);
  }

  // Filtrado de eventos
  const filteredEvents = useMemo(() => {
    let results = [...allEvents];

    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      results = results.filter(ev => ev.title.toLowerCase().includes(lower));
    }
    if (startDate && endDate) {
      results = results.filter(ev => {
        const [d,m,y] = ev.date.split("/").map(Number);
        const t = new Date(y, m-1, d).getTime();
        return t >= startDate.getTime() && t <= endDate.getTime();
      });
    }
    if (provinceText.trim()) {
      results = results.filter(ev => ev.address.toLowerCase().includes(provinceText.toLowerCase()));
    }
    if (municipalityText.trim()) {
      results = results.filter(ev => ev.address.toLowerCase().includes(municipalityText.toLowerCase()));
    }
    if (localityText.trim()) {
      results = results.filter(ev => ev.address.toLowerCase().includes(localityText.toLowerCase()));
    }
    if (weekActive) {
      const { startOfWeek, endOfWeek } = getWeekRange();
      results = results.filter(ev => {
        const [d,m,y] = ev.date.split("/").map(Number);
        const t = new Date(y, m-1, d).getTime();
        return t >= startOfWeek.getTime() && t < endOfWeek.getTime();
      });
    }
    if (afterActive) results = results.filter(ev => (ev as any).isAfter);
    if (lgbtActive) results = results.filter(ev => (ev as any).isLgbt);
    if (selectedGenres.length) results = results.filter(ev => selectedGenres.includes((ev as any).type));

    return results;
  }, [allEvents, searchText, startDate, endDate, provinceText, municipalityText, localityText, weekActive, afterActive, lgbtActive, selectedGenres]);

  // UI Handlers
  const toggleDateFilter = () => {
    setDateFilterOpen(prev => !prev);
    setLocationFilterOpen(false);
    setGenreFilterOpen(false);
  };
  const toggleLocationFilter = () => {
    setLocationFilterOpen(prev => !prev);
    setDateFilterOpen(false);
    setGenreFilterOpen(false);
  };
  const toggleGenreFilter = () => {
    setGenreFilterOpen(prev => !prev);
    setDateFilterOpen(false);
    setLocationFilterOpen(false);
  };

  const handleCardPress = (_: string, id?: string) => {
    if (id) router.push(`/main/EventsScreens/EventScreen?id=${id}`);
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" />
      ) : (
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
            onToggleWeek={() => setWeekActive(prev => !prev)}
            onToggleAfter={() => setAfterActive(prev => !prev)}
            onToggleLgbt={() => setLgbtActive(prev => !prev)}
            searchText={searchText}
            onSearchTextChange={setSearchText}
            dateFilterOpen={dateFilterOpen}
            onToggleDateFilter={toggleDateFilter}
            startDate={startDate}
            endDate={endDate}
            showStartPicker={showStartPicker}
            showEndPicker={showEndPicker}
            onShowStartPicker={setShowStartPicker}
            onShowEndPicker={setShowEndPicker}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClearDates={() => { setStartDate(null); setEndDate(null); }}
            locationFilterOpen={locationFilterOpen}
            onToggleLocationFilter={toggleLocationFilter}
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
            onToggleGenreFilter={toggleGenreFilter}
            selectedGenres={selectedGenres}
            onToggleGenre={onToggleGenre}
            onClearGenres={onClearGenres}
            nestedScrollEnabled
          />

          <View style={styles.containerCards}>
            {filteredEvents.length === 0 ? (
              <Text style={styles.noEventsText}>No existen eventos con esos filtros.</Text>
            ) : (
              filteredEvents.map(ev => (
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
      )}
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
