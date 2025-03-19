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

import { getAllEvents } from "@/utils/eventHelpers";
import { EventItem } from "@/interfaces/EventProps";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/** Ejemplo de función que retorna el rango de la semana actual. */
function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);

  // Ajustamos para que el lunes sea el inicio de semana (si prefieres domingo, ajusta la lógica)
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return { startOfWeek, endOfWeek };
}

export default function MenuScreen() {
  const router = useRouter();

  // Lista base de eventos
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);

  // Filtros de texto, fecha y ubicación
  const [searchText, setSearchText] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  const [locationText, setLocationText] = useState("");

  // Filtro: "Esta semana"
  const [weekActive, setWeekActive] = useState(false);

  // Filtro: "After"
  const [afterActive, setAfterActive] = useState(false);

  // Filtro: "LGBT"
  const [lgbtActive, setLgbtActive] = useState(false);

  // Saber si hay rango de fechas activo
  const isDateActive = Boolean(startDate && endDate);
  // Saber si hay ubicación activa
  const isLocationActive = Boolean(locationText.trim() !== "");

  useEffect(() => {
    const events = getAllEvents();
    setAllEvents(events);
  }, []);

  // Filtrado
  const filteredEvents = useMemo(() => {
    let results = [...allEvents];

    // (a) Filtrar por texto (nombre del evento)
    if (searchText.trim() !== "") {
      const lower = searchText.toLowerCase();
      results = results.filter((ev) =>
        ev.title.toLowerCase().includes(lower)
      );
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
      results = results.filter((ev) =>
        ev.address.toLowerCase().includes(locLower)
      );
    }

    // (d) Filtro "Esta semana"
    if (weekActive) {
      const { startOfWeek, endOfWeek } = getWeekRange();
      results = results.filter((ev) => {
        const [day, month, year] = ev.date.split("/").map(Number);
        const eventTime = new Date(year, month - 1, day).getTime();
        return (
          eventTime >= startOfWeek.getTime() && eventTime < endOfWeek.getTime()
        );
      });
    }

    // (e) Filtro "After"
    if (afterActive) {
      // Suponiendo que EventItem tiene un boolean "isAfter"
      results = results.filter((ev) => ev.isAfter === true);
    }

    // (f) Filtro "LGBT"
    if (lgbtActive) {
      // Suponiendo que EventItem tiene un boolean "isLGBT"
      results = results.filter((ev) => ev.isLGBT === true);
    }

    return results;
  }, [
    allEvents,
    searchText,
    startDate,
    endDate,
    locationText,
    weekActive,
    afterActive,
    lgbtActive,
  ]);

  // Handlers para pickers de fecha
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

  // Cerrar panel de fechas si ambas están definidas
  useEffect(() => {
    if (startDate && endDate) {
      setDateFilterOpen(false);
    }
  }, [startDate, endDate]);

  // Cerrar panel de ubicación si se ha escrito algo
  useEffect(() => {
    if (locationText.trim() !== "") {
      setLocationFilterOpen(false);
    }
  }, [locationText]);

  // Toggle panel de fechas
  const toggleDateFilter = () => {
    setDateFilterOpen(!dateFilterOpen);
    setLocationFilterOpen(false);
  };

  // Toggle panel de ubicación
  const toggleLocationFilter = () => {
    setLocationFilterOpen(!locationFilterOpen);
    setDateFilterOpen(false);
  };

  // Navegar a detalle
  const handleCardPress = (title: string, id?: number) => {
    if (id) {
      // Ajusta la ruta a tu pantalla de detalle
      // p. ej. /main/EventsScreens/EventScreen?id=${id}
      // O la ruta que uses
      console.log(`Navegando a evento ID=${id}`);
      // router.push(...)
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sección de filtros */}
        <View style={styles.filtersSection}>
          {/* Scroll horizontal con los chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            {/* Botón "Fecha" */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                isDateActive && styles.filterChipActive,
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
                  isDateActive && styles.filterChipTextActive,
                ]}
              >
                Fecha
              </Text>
            </TouchableOpacity>

            {/* Botón "Ubicación" */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                isLocationActive && styles.filterChipActive,
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
                  isLocationActive && styles.filterChipTextActive,
                ]}
              >
                Ubicación
              </Text>
            </TouchableOpacity>

            {/* Botón "Esta semana" */}
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

            {/* Botón "After" */}
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

            {/* Botón "LGBT" */}
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

              {/* Fecha inicio */}
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartPicker(true)}
              >
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

              {/* Fecha fin */}
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndPicker(true)}
              >
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

              {/* Botón para limpiar fechas */}
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
              {/* Botón para limpiar ubicación */}
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

        {/* Lista de eventos (filtrados) */}
        <View style={styles.containerCards}>
          {filteredEvents.length === 0 ? (
            <Text style={styles.noEventsText}>
              No existen eventos con esos filtros. ¡Cambia de filtros!
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
  noEventsText: {
    marginTop: 20,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
});
