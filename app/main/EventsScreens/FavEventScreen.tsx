import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import CardComponent from "@/components/CardComponent";
import SearchBarComponent from "@/components/SearchBarComponent";

// Helpers que traen SOLO favoritos
import { getAllFavEvents, ExtendedEventItem } from "@/utils/eventFavHelpers";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/** Función para determinar si el evento cae en la semana actual (mismo helper que en MenuScreen). */
function isInCurrentWeek(dateStr: string): boolean {
  const [day, month, year] = dateStr.split("/").map(Number);
  const eventDate = new Date(year, month - 1, day);

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Dom) ... 6 (Sáb)
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - dayOfWeek);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return eventDate >= startOfWeek && eventDate <= endOfWeek;
}

export default function FavEventScreen() {
  const router = useRouter();

  // Lista de favoritos (mismos campos y estilo que MenuScreen)
  const [favEvents, setFavEvents] = useState<ExtendedEventItem[]>([]);

  // Filtros
  const [searchText, setSearchText] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  const [locationText, setLocationText] = useState("");

  const [weekActive, setWeekActive] = useState(false);
  const [afterActive, setAfterActive] = useState(false);
  const [lgbtActive, setLgbtActive] = useState(false);

  // Cargamos los eventos FAVORITOS al montar
  useEffect(() => {
    const events = getAllFavEvents();
    setFavEvents(events);
  }, []);

  // Filtrado idéntico a MenuScreen
  const filteredFavs = useMemo(() => {
    let results = [...favEvents];

    // (a) Filtro por texto
    if (searchText.trim() !== "") {
      const lower = searchText.toLowerCase();
      results = results.filter((ev) => ev.title.toLowerCase().includes(lower));
    }

    // (b) Rango de fechas
    if (startDate && endDate) {
      results = results.filter((ev) => {
        const [day, month, year] = ev.date.split("/").map(Number);
        const eventTime = new Date(year, month - 1, day).getTime();
        return eventTime >= startDate.getTime() && eventTime <= endDate.getTime();
      });
    }

    // (c) Ubicación
    if (locationText.trim() !== "") {
      const locLower = locationText.toLowerCase();
      results = results.filter((ev) => ev.address.toLowerCase().includes(locLower));
    }

    // (d) "Esta semana"
    if (weekActive) {
      results = results.filter((ev) => isInCurrentWeek(ev.date));
    }

    // (e) After
    if (afterActive) {
      results = results.filter((ev) => ev.isAfter === true);
    }

    // (f) LGBT
    if (lgbtActive) {
      results = results.filter((ev) => ev.isLGBT === true);
    }

    return results;
  }, [
    favEvents,
    searchText,
    startDate,
    endDate,
    locationText,
    weekActive,
    afterActive,
    lgbtActive,
  ]);

  // Handlers para pickers
  const onStartDateChange = (_event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };
  const onEndDateChange = (_event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Cerrar paneles
  useEffect(() => {
    if (startDate && endDate) {
      setDateFilterOpen(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (locationText.trim() !== "") {
      setLocationFilterOpen(false);
    }
  }, [locationText]);

  // Toggle panel de fechas / ubicación
  const toggleDateFilter = () => {
    setDateFilterOpen(!dateFilterOpen);
    setLocationFilterOpen(false);
  };
  const toggleLocationFilter = () => {
    setLocationFilterOpen(!locationFilterOpen);
    setDateFilterOpen(false);
  };

  // Navegar al detalle
  const handleCardPress = (eventId?: number) => {
    if (!eventId) return;
    router.push(`/main/EventsScreens/EventScreen?id=${eventId}`);
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Filtros - mismos estilos que en MenuScreen */}
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {/* Botón Fecha */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                (dateFilterOpen || (startDate && endDate)) && styles.filterChipActive,
              ]}
              onPress={toggleDateFilter}
            >
              <IconButton
                icon="calendar"
                size={18}
                iconColor={COLORS.textPrimary}
                style={{ margin: 0 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  (dateFilterOpen || (startDate && endDate)) && styles.filterChipTextActive,
                ]}
              >
                Fecha
              </Text>
            </TouchableOpacity>

            {/* Botón Ubicación */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                (locationFilterOpen || locationText.trim() !== "") && styles.filterChipActive,
              ]}
              onPress={toggleLocationFilter}
            >
              <IconButton
                icon="map-marker"
                size={18}
                iconColor={COLORS.textPrimary}
                style={{ margin: 0 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  (locationFilterOpen || locationText.trim() !== "") && styles.filterChipTextActive,
                ]}
              >
                Ubicación
              </Text>
            </TouchableOpacity>

            {/* Botón Esta semana */}
            <TouchableOpacity
              style={[styles.filterChip, weekActive && styles.filterChipActive]}
              onPress={() => setWeekActive(!weekActive)}
            >
              <IconButton
                icon="newspaper-plus"
                size={18}
                iconColor={COLORS.textPrimary}
                style={{ margin: 0 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  weekActive && styles.filterChipTextActive,
                ]}
              >
                Esta semana
              </Text>
            </TouchableOpacity>

            {/* Botón After */}
            <TouchableOpacity
              style={[styles.filterChip, afterActive && styles.filterChipActive]}
              onPress={() => setAfterActive(!afterActive)}
            >
              <IconButton
                icon="moon-waning-crescent"
                size={18}
                iconColor={COLORS.textPrimary}
                style={{ margin: 0 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  afterActive && styles.filterChipTextActive,
                ]}
              >
                After
              </Text>
            </TouchableOpacity>

            {/* Botón LGBT */}
            <TouchableOpacity
              style={[styles.filterChip, lgbtActive && styles.filterChipActive]}
              onPress={() => setLgbtActive(!lgbtActive)}
            >
              <IconButton
                icon="gender-transgender"
                size={18}
                iconColor={COLORS.textPrimary}
                style={{ margin: 0 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  lgbtActive && styles.filterChipTextActive,
                ]}
              >
                LGBT
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* SearchBar */}
          <View style={styles.searchContainer}>
            <SearchBarComponent
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar evento..."
            />
          </View>

          {/* Panel de fechas */}
          {dateFilterOpen && (
            <View style={styles.dateFilterContainer}>
              <Text style={styles.dateFilterLabel}>Seleccionar rango de fechas:</Text>

              <TouchableOpacity style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.dateInputText}>
                  {startDate
                    ? `Desde: ${startDate.toLocaleDateString()}`
                    : "Desde: --/--/----"}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={onStartDateChange}
                />
              )}

              <TouchableOpacity style={styles.dateInput} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.dateInputText}>
                  {endDate
                    ? `Hasta: ${endDate.toLocaleDateString()}`
                    : "Hasta: --/--/----"}
                </Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={onEndDateChange}
                />
              )}

              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
              >
                <Text style={styles.clearButtonText}>Limpiar fechas</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Panel de ubicación */}
          {locationFilterOpen && (
            <View style={styles.locationFilterContainer}>
              <Text style={styles.dateFilterLabel}>Filtrar por ubicación:</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="Escribe una ciudad, dirección, etc."
                placeholderTextColor={COLORS.textSecondary}
                value={locationText}
                onChangeText={setLocationText}
              />
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setLocationText("");
                }}
              >
                <Text style={styles.clearButtonText}>Limpiar ubicación</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Lista de favoritos (filtrados) */}
        <View style={styles.containerCards}>
          {filteredFavs.length === 0 ? (
            <Text style={styles.noEventsText}>
              No existen eventos con esos filtros. ¡Cambia de filtros!
            </Text>
          ) : (
            filteredFavs.map((ev) => (
              <View key={ev.id} style={styles.cardContainer}>
                {/* Card idéntico, salvo que agregamos el corazón en la parte superior derecha */}
                <CardComponent
                  title={ev.title}
                  text={ev.description}
                  date={ev.date}
                  foto={ev.imageUrl}
                  onPress={() => handleCardPress(ev.id)}
                />
                <IconButton
                  icon="heart"
                  size={24}
                  iconColor={COLORS.negative}
                  style={styles.heartIcon}
                  onPress={() => {
                    // Lógica para quitar de favoritos (simulación)
                    console.log("Quitar de favoritos:", ev.id);
                  }}
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
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  filtersSection: {
    backgroundColor: COLORS.backgroundLight,
    paddingBottom: 8,
  },
  horizontalScroll: {
    marginHorizontal: 8,
    marginTop: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    marginLeft: 2,
  },
  filterChipTextActive: {
    color: COLORS.cardBg,
  },
  searchContainer: {
    marginHorizontal: 8,
    marginTop: 8,
  },
  dateFilterContainer: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: RADIUS.card,
    padding: 10,
  },
  dateFilterLabel: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
    marginBottom: 6,
  },
  dateInput: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  dateInputText: {
    color: COLORS.textPrimary,
  },
  clearButton: {
    backgroundColor: COLORS.negative,
    borderRadius: RADIUS.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-end",
    marginTop: 6,
  },
  clearButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
  },
  locationFilterContainer: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: RADIUS.card,
    padding: 10,
  },
  locationInput: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: COLORS.textPrimary,
  },
  containerCards: {
    marginTop: 10,
    paddingHorizontal: 8,
  },
  cardContainer: {
    position: "relative",
    marginBottom: 10, // Mismo margin que el MenuScreen (puedes ajustarlo)
  },
  noEventsText: {
    marginTop: 20,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  heartIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "transparent",
  },
});
