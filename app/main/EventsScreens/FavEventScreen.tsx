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

// Componentes
import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import TabMenuComponent from "@/components/TabMenuComponent"; // Importa el mismo que usas en NewsScreen
import SearchBarComponent from "@/components/SearchBarComponent";
import CardComponent from "@/components/CardComponent";

// Estilos
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/** Ejemplo simulado de evento favorito. Ajusta según tu interfaz real. */
type FavoriteEvent = {
  id: number;
  title: string;
  description: string;
  date: string;
  address: string;
  imageUrl: string;
};

export default function FavEventScreen() {
  const router = useRouter();

  // Lista de favoritos definida explícitamente, con IDs del 1 al 5
  const [favorites, setFavorites] = useState<FavoriteEvent[]>(() => [
    {
      id: 1,
      title: "Fiesta 1",
      description: "Diviértete con amigos (evento 1)",
      date: "10/01/2025",
      address: "Av. Siempre Viva 742",
      imageUrl: "https://picsum.photos/700/400?random=1",
    },
    {
      id: 2,
      title: "Fiesta 2",
      description: "Diviértete con amigos (evento 2)",
      date: "10/02/2025",
      address: "Av. Siempre Viva 742",
      imageUrl: "https://picsum.photos/700/400?random=2",
    },
    {
      id: 3,
      title: "Fiesta 3",
      description: "Diviértete con amigos (evento 3)",
      date: "10/03/2025",
      address: "Av. Siempre Viva 742",
      imageUrl: "https://picsum.photos/700/400?random=3",
    },
    {
      id: 4,
      title: "Fiesta 4",
      description: "Diviértete con amigos (evento 4)",
      date: "10/04/2025",
      address: "Av. Siempre Viva 742",
      imageUrl: "https://picsum.photos/700/400?random=4",
    },
    {
      id: 5,
      title: "Fiesta 5",
      description: "Diviértete con amigos (evento 5)",
      date: "10/05/2025",
      address: "Av. Siempre Viva 742",
      imageUrl: "https://picsum.photos/700/400?random=5",
    },
  ]);

  // Filtros
  const [searchText, setSearchText] = useState("");
  const [orderFilter, setOrderFilter] = useState("default");

  // Filtro de fechas
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Filtro de ubicación
  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  const [locationText, setLocationText] = useState("");

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

  // Lógica de filtrado con useMemo
  const filteredFavorites = useMemo(() => {
    let results = [...favorites];

    // (a) Filtro por nombre
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

    // (d) Orden (ejemplo con "fecha" o "semana")
    if (orderFilter === "fecha") {
      results.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split("/").map(Number);
        const [dayB, monthB, yearB] = b.date.split("/").map(Number);
        const timeA = new Date(yearA, monthA - 1, dayA).getTime();
        const timeB = new Date(yearB, monthB - 1, dayB).getTime();
        return timeA - timeB;
      });
    }
    // Si "semana" tuviera lógica especial, la implementas aquí.

    return results;
  }, [favorites, searchText, startDate, endDate, locationText, orderFilter]);

  // Quitar de favoritos (ícono de corazón)
  const toggleFavorite = (id: number) => {
    setFavorites((prev) => prev.filter((ev) => ev.id !== id));
  };

  // Al pulsar una Card => Ir a EventScreen con su ID
  const handleCardPress = (eventId: number) => {
    router.push(`/main/EventsScreens/EventScreen?id=${eventId}`);
  };

  // Cambiar “orden”
  const handleSelectOrder = (option: string) => {
    setOrderFilter(option);
  };

  // Manejo de date pickers
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

      {/* Agregamos el subheader con TabMenuComponent */}
      <TabMenuComponent
        tabs={[
          {
            label: "Mis tickets",
            route: "/main/TicketsScreens/TicketPurchasedMenu",
            isActive: false,
          },
          {
            label: "Eventos favoritos",
            route: "/main/FavEventScreen",
            isActive: true,
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Título */}
        <Text style={styles.screenTitle}>Eventos favoritos</Text>

        {/* Sección de Filtros + SearchBar */}
        <View style={styles.filtersSection}>
          {/* Scroll horizontal con 3 chips: Fecha, Ubicación, Esta semana */}
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
          </ScrollView>

          {/* SearchBar */}
          <View style={styles.searchContainer}>
            <SearchBarComponent
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar por nombre..."
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

        {/* Lista de favoritos filtrados */}
        <View style={styles.containerCards}>
          {filteredFavorites.length === 0 ? (
            <Text style={styles.noEventsText}>
              No hay eventos favoritos con esos filtros
            </Text>
          ) : (
            filteredFavorites.map((fav) => (
              <View key={fav.id} style={styles.cardContainer}>
                <CardComponent
                  title={fav.title}
                  text={fav.description}
                  date={fav.date}
                  foto={fav.imageUrl}
                  onPress={() => handleCardPress(fav.id)}
                />
                {/* Ícono corazón para quitar de favoritos (sin círculo blanco) */}
                <IconButton
                  icon="heart"
                  iconColor={COLORS.negative} // rojo
                  size={30}
                  style={styles.heartButton}
                  onPress={() => toggleFavorite(fav.id)}
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
  // Subheader con Tabs
  // (lo agregamos con TabMenuComponent antes del ScrollView)

  // Título principal
  screenTitle: {
    fontSize: FONT_SIZES.titleMain,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    color: COLORS.textPrimary,
  },

  // Sección de filtros
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

  // SearchBar
  searchContainer: {
    marginHorizontal: 8,
    marginTop: 8,
  },

  // Desplegable de fechas
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

  // Desplegable de ubicación
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

  // Lista de tarjetas
  containerCards: {
    marginTop: 10,
    paddingHorizontal: 8,
  },
  cardContainer: {
    position: "relative",
    marginBottom: 20,
  },
  // Ícono corazón sin fondo
  heartButton: {
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
