// app/main/MenuScreen.tsx

import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
// Ajustá la ruta según dónde tengas el componente:
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

import { useAuth } from "@/context/AuthContext";
import {
  putEventoFavorito,
  getEventosFavoritos,
} from "@/utils/auth/userHelpers";

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
  const { user } = useAuth();

  // Normalizo ID de usuario (puede venir como id o idUsuario)
  const userId: string | null =
    (user as any)?.idUsuario ?? (user as any)?.id ?? null;

  // Eventos y carga
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Favoritos en memoria (ids) + busy por item
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [favBusy, setFavBusy] = useState<string | null>(null);

  // Trae eventos + (si hay user) favoritos, en paralelo
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const eventsPromise = fetchEvents();
        const favsPromise = userId
          ? getEventosFavoritos(String(userId))
          : Promise.resolve<string[]>([]);

        const [evts, favIds] = await Promise.all([eventsPromise, favsPromise]);

        const sorted = evts
          .map((e) => ({
            ...e,
            _ts: (() => {
              const [d, m, y] = e.date.split("/").map(Number);
              return new Date(y, m - 1, d).getTime();
            })(),
          }))
          .sort((a, b) => a._ts - b._ts)
          .map(({ _ts, ...rest }) => rest);

        if (!mounted) return;

        setAllEvents(sorted);
        setFavSet(new Set(favIds.map(String))); // hidrata corazones
      } catch (err) {
        console.error("[MenuScreen] Error cargando eventos/favoritos:", err);
        if (mounted) setError("Error al cargar los eventos.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // Reintenta si cambia el usuario logueado
  }, [userId]);

  // --- estados y handlers de filtros (idénticos a antes) ---
  const [searchText, setSearchText] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
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
  const [weekActive, setWeekActive] = useState(false);
  const [afterActive, setAfterActive] = useState(false);
  const [lgbtActive, setLgbtActive] = useState(false);
  const [genreFilterOpen, setGenreFilterOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  async function onProvinceTextChange(v: string) {
    setProvinceText(v);
    if (v.trim().length < 3) return setProvinceSuggestions([]);
    try {
      const results = await fetchProvinces();
      setProvinceSuggestions(
        results.filter((p) => p.nombre.toLowerCase().includes(v.toLowerCase()))
      );
    } catch {
      setProvinceSuggestions([]);
    }
  }
  function onPickProvince(name: string) {
    setProvinceText(name);
    setProvinceSuggestions([]);
  }

  async function onMunicipalityTextChange(v: string) {
    setMunicipalityText(v);
    if (v.trim().length < 3 || !provinceText)
      return setMunicipalitySuggestions([]);
    try {
      const results = await fetchMunicipalities(provinceText);
      setMunicipalitySuggestions(
        results.filter((m) => m.nombre.toLowerCase().includes(v.toLowerCase()))
      );
    } catch {
      setMunicipalitySuggestions([]);
    }
  }
  function onPickMunicipality(name: string) {
    setMunicipalityText(name);
    setMunicipalitySuggestions([]);
  }

  async function onLocalityTextChange(v: string) {
    setLocalityText(v);
    if (v.trim().length < 3) return setLocalitySuggestions([]);
    try {
      const results =
        provinceText && municipalityText
          ? await fetchLocalities(provinceText, municipalityText)
          : await fetchLocalitiesByName(v);
      setLocalitySuggestions(
        results.filter((l) => l.nombre.toLowerCase().includes(v.toLowerCase()))
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

  function onToggleGenre(g: string) {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
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
        ev.address.toLowerCase().includes(provinceText.toLowerCase())
      );
    }
    if (municipalityText) {
      results = results.filter((ev) =>
        ev.address.toLowerCase().includes(municipalityText.toLowerCase())
      );
    }
    if (localityText) {
      results = results.filter((ev) =>
        ev.address.toLowerCase().includes(localityText.toLowerCase())
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
    if (afterActive) results = results.filter((ev) => (ev as any).isAfter);
    if (lgbtActive) results = results.filter((ev) => (ev as any).isLgbt);
    if (selectedGenres.length) {
      results = results.filter((ev) =>
        selectedGenres.includes((ev as any).type)
      );
    }
    return results;
  }, [
    allEvents,
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

  // UI handlers
  const toggleDateFilter = () => {
    setDateFilterOpen((v) => !v);
    setLocationFilterOpen(false);
    setGenreFilterOpen(false);
  };
  const toggleLocationFilter = () => {
    setLocationFilterOpen((v) => !v);
    setDateFilterOpen(false);
    setGenreFilterOpen(false);
  };
  const toggleGenreFilter = () => {
    setGenreFilterOpen((v) => !v);
    setDateFilterOpen(false);
    setLocationFilterOpen(false);
  };

  const handleCardPress = (_: string, id?: string) => {
    if (id) router.push(`/main/EventsScreens/EventScreen?id=${id}`);
  };

  // Toggle favorito (optimista)
  const handleToggleFavorite = async (eventId: string) => {
    if (!userId) {
      Alert.alert(
        "Iniciá sesión",
        "Necesitás estar logueado para marcar favoritos."
      );
      return;
    }
    const wasFav = favSet.has(eventId);
    const next = new Set(favSet);
    if (wasFav) next.delete(eventId);
    else next.add(eventId);
    setFavSet(next);
    setFavBusy(eventId);

    try {
      await putEventoFavorito({
        idUsuario: String(userId),
        idEvento: String(eventId),
      });
    } catch (e) {
      // revertimos si falla
      const revert = new Set(next);
      if (wasFav) revert.add(eventId);
      else revert.delete(eventId);
      setFavSet(revert);
      Alert.alert(
        "Error",
        "No se pudo actualizar el favorito. Probá de nuevo."
      );
    } finally {
      setFavBusy(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <Header />
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <Header />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: COLORS.negative }}>{error}</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <SafeAreaView style={styles.mainContainer}>
        <Header />
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
            onToggleWeek={() => setWeekActive((v) => !v)}
            onToggleAfter={() => setAfterActive((v) => !v)}
            onToggleLgbt={() => setLgbtActive((v) => !v)}
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
            onClearDates={() => {
              setStartDate(null);
              setEndDate(null);
            }}
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
                  // Favoritos: pintado inicial según GET y toggle optimista
                  isFavorite={ev.id ? favSet.has(String(ev.id)) : false}
                  onToggleFavorite={
                    ev.id
                      ? () => handleToggleFavorite(String(ev.id))
                      : undefined
                  }
                  disableFavorite={favBusy === String(ev.id)}
                />
              ))
            )}
          </View>
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
  },
  scrollContent: {
    paddingBottom: 16,
    backgroundColor: COLORS.backgroundLight,
  },
  containerCards: {
    marginTop: 10,
    paddingHorizontal: 12,
    rowGap: 16,
  },
  noEventsText: {
    marginTop: 20,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontFamily: "Roboto-Regular",
  },
});
