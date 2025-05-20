// app/main/EventsScreens/FavEventScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import CardComponent from "@/components/events/CardComponent";
import FiltersSection from "@/components/filters/FiltersSection";

import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
  fetchLocalitiesByName,
} from "@/utils/georef/georefHelpers";
import {
  getAllFavEvents,
  ExtendedEventItem,
} from "@/utils/events/eventFavHelpers";
import { COLORS, FONT_SIZES } from "@/styles/globalStyles";

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return { startOfWeek, endOfWeek };
}

export default function FavEventScreen() {
  const router = useRouter();

  // base de eventos favoritos
  const [favEvents, setFavEvents] = useState<ExtendedEventItem[]>([]);
  useEffect(() => {
    const events = getAllFavEvents();
    setFavEvents(events);
  }, []);

  // filtros de texto y fecha
  const [searchText, setSearchText] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // filtros de ubicación
  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  const [provinceText, setProvinceText] = useState("");
  const [provinceSuggestions, setProvinceSuggestions] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [municipalityText, setMunicipalityText] = useState("");
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [localityText, setLocalityText] = useState("");
  const [localitySuggestions, setLocalitySuggestions] = useState<
    { id: string; nombre: string }[]
  >([]);

  // otros filtros
  const [weekActive, setWeekActive] = useState(false);
  const [afterActive, setAfterActive] = useState(false);
  const [lgbtActive, setLgbtActive] = useState(false);
  const [genreFilterOpen, setGenreFilterOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // handlers ubicación
  async function onProvinceTextChange(value: string) {
    setProvinceText(value);
    if (value.trim().length < 3) {
      setProvinceSuggestions([]);
      return;
    }
    try {
      const results = await fetchProvinces();
      setProvinceSuggestions(
        results.filter((prov) =>
          prov.nombre.toLowerCase().includes(value.toLowerCase())
        )
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
        results.filter((mun) =>
          mun.nombre.toLowerCase().includes(value.toLowerCase())
        )
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
      let results = [];
      if (provinceText && municipalityText) {
        results = await fetchLocalities(provinceText, municipalityText);
      } else {
        results = await fetchLocalitiesByName(value);
      }
      setLocalitySuggestions(
        results.filter((loc) =>
          loc.nombre.toLowerCase().includes(value.toLowerCase())
        )
      );
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

  // handlers género
  function onToggleGenre(g: string) {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }
  function onClearGenres() {
    setSelectedGenres([]);
  }

  // filtrado final
  const filteredEvents = useMemo(() => {
    let results = [...favEvents];

    if (searchText.trim() !== "") {
      const lower = searchText.toLowerCase();
      results = results.filter((ev) => ev.title.toLowerCase().includes(lower));
    }

    if (startDate && endDate) {
      results = results.filter((ev) => {
        const [d, m, y] = ev.date.split("/").map(Number);
        const t = new Date(y, m - 1, d).getTime();
        return t >= startDate.getTime() && t <= endDate.getTime();
      });
    }

    if (provinceText) {
      results = results.filter((ev) =>
        ev.province?.toLowerCase().includes(provinceText.toLowerCase())
      );
    }
    if (municipalityText) {
      results = results.filter((ev) =>
        ev.municipality?.toLowerCase().includes(municipalityText.toLowerCase())
      );
    }
    if (localityText) {
      results = results.filter((ev) =>
        ev.address?.toLowerCase().includes(localityText.toLowerCase())
      );
    }

    if (weekActive) {
      const { startOfWeek, endOfWeek } = getWeekRange();
      results = results.filter((ev) => {
        const [d, m, y] = ev.date.split("/").map(Number);
        const t = new Date(y, m - 1, d).getTime();
        return t >= startOfWeek.getTime() && t < endOfWeek.getTime();
      });
    }
    if (afterActive) results = results.filter((ev) => ev.isAfter);
    if (lgbtActive) results = results.filter((ev) => ev.isLGBT);
    if (selectedGenres.length) {
      results = results.filter((ev) => selectedGenres.includes(ev.type));
    }

    return results;
  }, [
    favEvents,
    searchText,
    startDate,
    endDate,
    provinceText,
    municipalityText,
    localityText,
    weekActive,
    afterActive,
    lgbtActive,
    selectedGenres,
  ]);

  // toggles filtros
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
    if (id) {
      router.push(`/main/EventsScreens/EventScreen?id=${id}`);
    }
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <FiltersSection
          isDateActive={Boolean(startDate && endDate)}
          isLocationActive={Boolean(
            provinceText || municipalityText || localityText
          )}
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
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClearDates={() => {
            setStartDate(null);
            setEndDate(null);
          }}
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
              <View key={ev.id} style={styles.cardContainer}>
                <CardComponent
                  title={ev.title}
                  text={ev.description}
                  date={ev.date}
                  foto={ev.imageUrl}
                  onPress={() => handleCardPress(ev.title, ev.id)}
                />
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

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollContent: { paddingBottom: 16 },
  containerCards: { marginTop: 10, paddingHorizontal: 8 },
  cardContainer: { position: "relative", marginBottom: 10 },
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
