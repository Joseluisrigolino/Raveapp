// app/main/EventsScreens/FavEventScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";

import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import CardComponent from "@/app/events/components/CardComponent";
import FiltersSection from "@/components/filters/FiltersSection";

import { useAuth } from "@/app/auth/AuthContext";
import { fetchEvents } from "@/app/events/apis/eventApi";
import { getEventosFavoritos, putEventoFavorito } from "@/app/auth/userHelpers";

import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
  fetchLocalitiesByName,
} from "@/app/apis/georefApi";
import { getEventFlags } from "@/app/events/apis/eventApi";

import { COLORS, FONT_SIZES } from "@/styles/globalStyles";
import { EventItem } from "@/interfaces/EventItem";

// Rango de semana (igual que en MenuScreen)
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

function normalizeText(s?: string | null) {
  if (!s) return "";
  try {
    return String(s)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  } catch {
    return String(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }
}

function provinceMatchesAddress(prov?: string, address?: string) {
  const p = normalizeText(prov);
  const a = normalizeText(address);
  if (!p) return false;
  if (a.includes(p)) return true;
  const isProvCaba = p.includes("caba") || p.includes("ciudad") || p.includes("autonom") || p.includes("buenos");
  const hasCabaInAddr = a.includes("caba") || a.includes("ciudad") || a.includes("capital");
  if (isProvCaba && hasCabaInAddr) return true;
  return false;
}

function getEventLocationString(ev: any) {
  const parts: Array<string> = [];
  if (ev?.address) parts.push(String(ev.address));
  const dom = ev?.domicilio;
  if (dom) {
    if (dom.provincia?.nombre) parts.push(String(dom.provincia.nombre));
    if (dom.municipio?.nombre) parts.push(String(dom.municipio.nombre));
    if (dom.localidad?.nombre) parts.push(String(dom.localidad.nombre));
    if (dom.direccion) parts.push(String(dom.direccion));
  }
  return parts.join(" ").trim();
}

export default function FavEventScreen() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  // Normalizo ID de usuario
  const userId: string | null =
    (user as any)?.idUsuario ?? (user as any)?.id ?? null;

  // Estado base
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sólo eventos favoritos del usuario
  const [favEvents, setFavEvents] = useState<EventItem[]>([]);

  // Corazones
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [favBusy, setFavBusy] = useState<string | null>(null);

  // Carga: trae IDs de favoritos del user + todos los eventos, y filtra
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (!userId) {
          setFavEvents([]);
          setFavSet(new Set());
          return;
        }

        const [all, favIds] = await Promise.all([
          fetchEvents(),
          getEventosFavoritos(String(userId)),
        ]);

        // Ordenar como en MenuScreen
        const sortedAll = all
          .map((e) => ({
            ...e,
            _ts: (() => {
              const [d, m, y] = e.date.split("/").map(Number);
              return new Date(y, m - 1, d).getTime();
            })(),
          }))
          .sort((a, b) => a._ts - b._ts)
          .map(({ _ts, ...rest }) => rest);

        // Filtrar sólo favoritos
        const favIdSet = new Set(favIds.map(String));
        const onlyFavs = sortedAll.filter(
          (e) => e.id && favIdSet.has(String(e.id))
        );

        if (!mounted) return;
        setFavEvents(onlyFavs);
        setFavSet(favIdSet);
      } catch (err) {
        console.error("[FavEventScreen] Error cargando favoritos:", err);
        if (mounted) setError("Error al cargar tus eventos favoritos.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // --- filtros (idénticos a MenuScreen) ---
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

  // Helpers ubicación (igual que en MenuScreen)
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

  // Filtrado final: igual que en MenuPantalla pero aplicado sobre favEvents
  const filteredEvents = useMemo(() => {
    let results = [...favEvents];

    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      results = results.filter((ev) => ev.title.toLowerCase().includes(lower));
    }
    if (startDate && endDate) {
      const s = startDate.getTime();
      const e = endDate.getTime();
      results = results.filter((ev) => {
        const t = parseDateToTs(ev.date);
        return t >= s && t <= e;
      });
    }
    if (provinceText) {
      results = results.filter((ev) => provinceMatchesAddress(provinceText, getEventLocationString(ev)));
    }
    if (municipalityText) {
      const mNorm = normalizeText(municipalityText);
      results = results.filter((ev) => normalizeText(getEventLocationString(ev)).includes(mNorm));
    }
    if (localityText) {
      const lNorm = normalizeText(localityText);
      results = results.filter((ev) => normalizeText(getEventLocationString(ev)).includes(lNorm));
    }
    if (weekActive) {
      const { startOfWeek, endOfWeek } = getWeekRange();
      const s = startOfWeek.getTime();
      const e = endOfWeek.getTime();
      results = results.filter((ev) => {
        const t = parseDateToTs(ev.date);
        return t >= s && t < e;
      });
    }
    if (afterActive) results = results.filter((ev) => getEventFlags(ev).isAfter);
    if (lgbtActive) results = results.filter((ev) => getEventFlags(ev).isLGBT);
    if (selectedGenres.length) {
      results = results.filter((ev) => selectedGenres.includes((ev as any).type));
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

  // Navegación card
  function handleCardPress(_title: string, id?: string) {
    if (id)
      nav.push(router, { pathname: ROUTES.MAIN.EVENTS.EVENT, params: { id } });
  }

  // Toggle favorito (optimista). En esta pantalla, si se desmarca, se remueve del listado.
  const handleToggleFavorite = async (eventId: string) => {
    if (!userId) {
      Alert.alert(
        "Iniciá sesión",
        "Necesitás estar logueado para gestionar favoritos."
      );
      return;
    }
    const wasFav = favSet.has(eventId);

    // Estados previos para revertir en caso de error
    const prevFavSet = new Set(favSet);
    const prevFavEvents = [...favEvents];

    // Optimista: si estaba marcado, lo saco del set y de la lista
    const nextFavSet = new Set(favSet);
    if (wasFav) {
      nextFavSet.delete(eventId);
      setFavEvents((current) =>
        current.filter((e) => String(e.id) !== String(eventId))
      );
    } else {
      // En esta pantalla rara vez vas a "agregar", pero contemplado por consistencia
      nextFavSet.add(eventId);
      // (Si quisieras agregar de nuevo, deberíamos traer los datos del evento; omitido a propósito)
    }
    setFavSet(nextFavSet);
    setFavBusy(eventId);

    try {
      await putEventoFavorito({
        idUsuario: String(userId),
        idEvento: String(eventId),
      });
    } catch (e) {
      // Revertimos
      setFavSet(prevFavSet);
      setFavEvents(prevFavEvents);
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
      <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
        <SafeAreaView style={styles.mainContainer}>
          <Header />
          <TabMenuComponent
            tabs={[
              {
                label: "Mis entradas",
                route: ROUTES.MAIN.TICKETS.MENU,
                isActive: false,
              },
              {
                label: "Eventos favoritos",
                route: ROUTES.MAIN.EVENTS.FAV,
                isActive: true,
              },
            ]}
          />
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Footer />
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
        <SafeAreaView style={styles.mainContainer}>
          <Header />
          <TabMenuComponent
            tabs={[
              {
                label: "Mis entradas",
                route: ROUTES.MAIN.TICKETS.MENU,
                isActive: false,
              },
              {
                label: "Eventos favoritos",
                route: ROUTES.MAIN.EVENTS.FAV,
                isActive: true,
              },
            ]}
          />
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: COLORS.negative }}>{error}</Text>
          </View>
          <Footer />
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <SafeAreaView style={styles.mainContainer}>
        <Header />

        <TabMenuComponent
          tabs={[
            {
              label: "Mis entradas",
              route: ROUTES.MAIN.TICKETS.MENU,
              isActive: false,
            },
            {
              label: "Eventos favoritos",
              route: ROUTES.MAIN.EVENTS.FAV,
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
            onToggleWeek={() => setWeekActive((v) => !v)}
            onToggleAfter={() => setAfterActive((v) => !v)}
            onToggleLgbt={() => setLgbtActive((v) => !v)}
            searchText={searchText}
            onSearchTextChange={setSearchText}
            dateFilterOpen={dateFilterOpen}
            onToggleDateFilter={() => {
              setDateFilterOpen((v) => !v);
              setLocationFilterOpen(false);
              setGenreFilterOpen(false);
            }}
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
            onToggleLocationFilter={() => {
              setLocationFilterOpen((v) => !v);
              setDateFilterOpen(false);
              setGenreFilterOpen(false);
            }}
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
            onToggleGenreFilter={() => {
              setGenreFilterOpen((v) => !v);
              setDateFilterOpen(false);
              setLocationFilterOpen(false);
            }}
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
                  isFavorite={ev.id ? favSet.has(String(ev.id)) : false}
                  onToggleFavorite={
                    !isAdmin && ev.id
                      ? () => handleToggleFavorite(String(ev.id))
                      : undefined
                  }
                  hideFavorite={isAdmin}
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
