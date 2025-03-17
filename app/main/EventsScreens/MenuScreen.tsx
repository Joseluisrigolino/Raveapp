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

// Tus componentes
import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import CardComponent from "@/components/CardComponent";
import SearchBarComponent from "@/components/SearchBarComponent";

// Helpers e interfaces
import { getAllEvents } from "@/utils/eventHelpers";
import { EventItem } from "@/interfaces/EventProps";

// Estilos globales
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function MenuScreen() {
  const router = useRouter();

  // Lista base de eventos
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);

  // Filtros
  const [searchText, setSearchText] = useState("");
  const [orderFilter, setOrderFilter] = useState("default");

  // Fechas
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Ubicación
  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  const [locationText, setLocationText] = useState("");

  // Cargar eventos al montar
  useEffect(() => {
    const events = getAllEvents();
    setAllEvents(events);
  }, []);

  // Filtrado con useMemo
  const filteredEvents = useMemo(() => {
    let results = [...allEvents];

    // (a) Filtrar por texto en el título
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
        return (
          eventTime >= startDate.getTime() && eventTime <= endDate.getTime()
        );
      });
    }

    // (c) Ubicación
    if (locationText.trim() !== "") {
      const locLower = locationText.toLowerCase();
      results = results.filter((ev) =>
        ev.address.toLowerCase().includes(locLower)
      );
    }

    // (d) Orden (ejemplo con "fecha", "populares", "semana", "tendencias", etc.)
    if (orderFilter === "fecha") {
      results.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split("/").map(Number);
        const [dayB, monthB, yearB] = b.date.split("/").map(Number);
        const timeA = new Date(yearA, monthA - 1, dayA).getTime();
        const timeB = new Date(yearB, monthB - 1, dayB).getTime();
        return timeA - timeB;
      });
    }
    // Aquí podrías implementar tu propia lógica si "populares", "semana" o "tendencias"
    // hacen un ordenamiento o filtrado especial.

    return results;
  }, [allEvents, searchText, startDate, endDate, locationText, orderFilter]);

  // Cerrar desplegable de fechas si ya se tienen ambas
  useEffect(() => {
    if (startDate && endDate) {
      setDateFilterOpen(false);
    }
  }, [startDate, endDate]);

  // Cerrar desplegable de ubicación si se escribió algo
  useEffect(() => {
    if (locationText.trim() !== "") {
      setLocationFilterOpen(false);
    }
  }, [locationText]);

  // Saber si el filtro de fecha o ubicación está activo
  const isDateActive = Boolean(startDate && endDate);
  const isLocationActive = Boolean(locationText.trim() !== "");

  // Handlers
  const handleCardPress = (title: string, id?: number) => {
    if (id) {
      router.push(`/main/EventsScreens/EventScreen?id=${id}`);
    }
  };

  const handleSelectOrder = (option: string) => {
    setOrderFilter(option);
  };

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

  // Funciones para togglear un desplegable y cerrar el otro
  const toggleDateFilter = () => {
    setDateFilterOpen(!dateFilterOpen);
    setLocationFilterOpen(false);
  };
  const toggleLocationFilter = () => {
    setLocationFilterOpen(!locationFilterOpen);
    setDateFilterOpen(false);
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sección de Filtros + SearchBar */}
        <View style={styles.filtersSection}>
          {/* Scroll horizontal con los chips (sin "Ordenar") */}
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

            {/* Botón "Populares" */}
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => handleSelectOrder("populares")}
            >
              <IconButton
                icon="fire"
                size={18}
                iconColor={COLORS.textPrimary}
                style={{ margin: 0 }}
              />
              <Text style={styles.filterChipText}>Populares</Text>
            </TouchableOpacity>

            {/* Botón "Esta semana" */}
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => handleSelectOrder("semana")}
            >
              <IconButton
                icon="newspaper-plus"
                size={18}
                iconColor={COLORS.textPrimary}
                style={{ margin: 0 }}
              />
              <Text style={styles.filterChipText}>Esta semana</Text>
            </TouchableOpacity>

            {/* Botón "Tendencias" */}
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => handleSelectOrder("tendencias")}
            >
              <IconButton
                icon="chart-line"
                size={18}
                iconColor={COLORS.textPrimary}
                style={{ margin: 0 }}
              />
              <Text style={styles.filterChipText}>Tendencias</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* SearchBarComponent */}
          <View style={styles.searchContainer}>
            <SearchBarComponent
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar evento..."
            />
          </View>

          {/* Desplegable de fechas */}
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

          {/* Desplegable de ubicación */}
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
  topFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    // Eliminamos el scroll horizontal aquí
    // y en su lugar, lo hacemos en horizontalScroll
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
  filterChipText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    marginLeft: 2,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
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
