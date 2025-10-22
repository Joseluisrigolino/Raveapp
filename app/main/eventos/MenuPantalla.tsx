// app/main/MenuPantalla.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { ROUTES } from "../../../routes";
import * as nav from "@/utils/navigation";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import CardComponent from "@/components/events/CardComponent";
import FiltersSection from "@/components/filters/FiltersSection";

import { COLORS, FONT_SIZES } from "@/styles/globalStyles";
import { EventItem } from "@/interfaces/EventItem";
import { fetchEvents, fetchEventsByEstados, ESTADO_CODES } from "@/utils/events/eventApi";
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
  fetchLocalitiesByName,
} from "@/utils/georef/georefHelpers";

import { useAuth } from "@/context/AuthContext";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
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

function parseDateToTs(dateStr?: string) {
  if (!dateStr) return NaN;
  const [d, m, y] = dateStr.split("/").map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getTime();
}

export default function MenuPantalla() {
  const router = useRouter();
  const path = usePathname();
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const currentScreen = path?.split("/").pop() || "";

  const tabs = [
    {
      label: "EVENTOS A VALIDAR",
      route: ROUTES.ADMIN.EVENTS_VALIDATE.LIST,
      isActive: currentScreen === ROUTES.ADMIN.EVENTS_VALIDATE.LIST.split("/").pop(),
    },
    {
      label: "EVENTOS APROBADOS",
      route: ROUTES.MAIN.EVENTS.MENU,
      isActive: currentScreen === ROUTES.MAIN.EVENTS.MENU.split("/").pop(),
    },
  ];

  const userId: string | null =
    (user as any)?.idUsuario ?? (user as any)?.id ?? null;

  // Mantengo _ts en los eventos para evitar reparseos repetidos
  const [allEvents, setAllEvents] = useState<Array<EventItem & { _ts: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [favBusy, setFavBusy] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

  const eventsPromise = fetchEventsByEstados([ESTADO_CODES.APROBADO, ESTADO_CODES.EN_VENTA]);
        const favsPromise = userId
          ? getEventosFavoritos(String(userId))
          : Promise.resolve<string[]>([]);

        const [evts, favIds] = await Promise.all([eventsPromise, favsPromise]);

        if (!mounted) return;

        const enriched = evts
          .map((e) => ({ ...e, _ts: parseDateToTs(e.date) }))
          .sort((a, b) => (a._ts || 0) - (b._ts || 0));

        setAllEvents(enriched);
        setFavSet(new Set(favIds.map(String)));
      } catch (err) {
        console.error("[MenuPantalla] Error cargando eventos/favoritos:", err);
        if (mounted) setError("Error al cargar los eventos.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // --- estados y handlers de filtros ---
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

  const onProvinceTextChange = useCallback(async (v: string) => {
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
  }, []);

  const onPickProvince = useCallback((name: string) => {
    setProvinceText(name);
    setProvinceSuggestions([]);
  }, []);

  const onMunicipalityTextChange = useCallback(async (v: string) => {
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
  }, [provinceText]);

  const onPickMunicipality = useCallback((name: string) => {
    setMunicipalityText(name);
    setMunicipalitySuggestions([]);
  }, []);

  const onLocalityTextChange = useCallback(async (v: string) => {
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
  }, [provinceText, municipalityText]);

  const onPickLocality = useCallback((name: string) => {
    setLocalityText(name);
    setLocalitySuggestions([]);
  }, []);

  const onClearLocation = useCallback(() => {
    setProvinceText("");
    setMunicipalityText("");
    setLocalityText("");
    setProvinceSuggestions([]);
    setMunicipalitySuggestions([]);
    setLocalitySuggestions([]);
  }, []);

  const onToggleGenre = useCallback((g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }, []);

  const onClearGenres = useCallback(() => setSelectedGenres([]), []);

  // Filtrado de eventos (usa _ts cacheado cuando está disponible)
  const filteredEvents = useMemo(() => {
    let results = [...allEvents];
    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      results = results.filter((ev) => ev.title.toLowerCase().includes(lower));
    }
    if (startDate && endDate) {
      const s = startDate.getTime();
      const e = endDate.getTime();
      results = results.filter((ev) => {
        const t = ev._ts || parseDateToTs(ev.date);
        return t >= s && t <= e;
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
      const s = startOfWeek.getTime();
      const e = endOfWeek.getTime();
      results = results.filter((ev) => {
        const t = ev._ts || parseDateToTs(ev.date);
        return t >= s && t < e;
      });
    }
    if (afterActive) results = results.filter((ev) => (ev as any).isAfter);
    if (lgbtActive) results = results.filter((ev) => (ev as any).isLgbt);
    if (selectedGenres.length) {
      results = results.filter((ev) => selectedGenres.includes((ev as any).type));
    }
    // Ocultar eventos sin imagen
    results = results.filter((ev) => {
      const url = (ev as any).imageUrl;
      return typeof url === "string" && url.trim().length > 0;
    });
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

  const toggleDateFilter = useCallback(() => {
    setDateFilterOpen((v) => !v);
    setLocationFilterOpen(false);
    setGenreFilterOpen(false);
  }, []);

  const toggleLocationFilter = useCallback(() => {
    setLocationFilterOpen((v) => !v);
    setDateFilterOpen(false);
    setGenreFilterOpen(false);
  }, []);

  const toggleGenreFilter = useCallback(() => {
    setGenreFilterOpen((v) => !v);
    setDateFilterOpen(false);
    setLocationFilterOpen(false);
  }, []);

  const handleCardPress = useCallback((_: string, id?: string) => {
    if (id) nav.push(router, { pathname: ROUTES.MAIN.EVENTS.EVENT, params: { id } });
  }, [router]);

  const handleToggleFavorite = useCallback(async (eventId: string) => {
    if (!userId) {
      Alert.alert("Iniciá sesión", "Necesitás estar logueado para marcar favoritos.");
      return;
    }
    const wasFav = favSet.has(eventId);

    // Actualización optimista usando función de estado
    setFavSet((prev) => {
      const next = new Set(prev);
      if (wasFav) next.delete(eventId);
      else next.add(eventId);
      return next;
    });

    setFavBusy(eventId);

    try {
      await putEventoFavorito({ idUsuario: String(userId), idEvento: String(eventId) });
    } catch (e) {
      // Revertir si falla
      setFavSet((prev) => {
        const revert = new Set(prev);
        if (wasFav) revert.add(eventId);
        else revert.delete(eventId);
        return revert;
      });
      Alert.alert("Error", "No se pudo actualizar el favorito. Probá de nuevo.");
    } finally {
      setFavBusy(null);
    }
  }, [userId, favSet]);

  if (loading) {
    return (
      <SafeAreaView style={styles.mainContainer}>
  <Header title="EventApp" />
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
  <Header title="EventApp" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
        {isAdmin && <TabMenuComponent tabs={tabs} />}
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
                  isFavorite={ev.id ? favSet.has(String(ev.id)) : false}
                  onToggleFavorite={
                    ev.id ? () => handleToggleFavorite(String(ev.id)) : undefined
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
    rowGap: 8,
  },
  noEventsText: {
    marginTop: 20,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontFamily: "Roboto-Regular",
  },
});
