// components/FiltersSection/FiltersSection.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { IconButton } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";

import SearchBarComponent from "@/components/common/SearchBarComponent";
import { ELECTRONIC_GENRES } from "@/utils/electronicGenresHelper";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/** Definimos la interfaz de props que recibirá nuestro componente de filtros. */
interface FiltersSectionProps {
  // --- Estados y callbacks para los chips horizontales ---
  isDateActive: boolean;
  isLocationActive: boolean;
  isGenreActive: boolean;
  weekActive: boolean;
  afterActive: boolean;
  lgbtActive: boolean;
  onToggleWeek: () => void;
  onToggleAfter: () => void;
  onToggleLgbt: () => void;

  // --- Search bar ---
  searchText: string;
  onSearchTextChange: (val: string) => void;

  // --- Date filter ---
  dateFilterOpen: boolean;
  onToggleDateFilter: () => void;
  startDate: Date | null;
  endDate: Date | null;
  showStartPicker: boolean;
  showEndPicker: boolean;
  onShowStartPicker: (show: boolean) => void;
  onShowEndPicker: (show: boolean) => void;
  onStartDateChange: (event: any, selectedDate?: Date) => void;
  onEndDateChange: (event: any, selectedDate?: Date) => void;
  onClearDates: () => void;

  // --- Location filter ---
  locationFilterOpen: boolean;
  onToggleLocationFilter: () => void;
  locationText: string;
  onLocationTextChange: (val: string) => void;
  locationSuggestions: { id: string; nombre: string }[];
  onPickLocation: (locName: string) => void;
  onClearLocation: () => void;

  // --- Género filter ---
  genreFilterOpen: boolean;
  onToggleGenreFilter: () => void;
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
  onClearGenres: () => void;

  // --- Control de scroll anidado (opcional) ---
  nestedScrollEnabled?: boolean;
}

/**
 * Componente que muestra:
 *  1) Chips horizontales (Fecha, Ubicación, Esta semana, After, LGBT, Género)
 *  2) SearchBar
 *  3) Panel de fechas (si dateFilterOpen)
 *  4) Panel de ubicación (si locationFilterOpen)
 *  5) Panel de géneros (si genreFilterOpen)
 */
export default function FiltersSection(props: FiltersSectionProps) {
  const {
    // Chips horizontales
    isDateActive,
    isLocationActive,
    isGenreActive,
    weekActive,
    afterActive,
    lgbtActive,
    onToggleWeek,
    onToggleAfter,
    onToggleLgbt,

    // SearchBar
    searchText,
    onSearchTextChange,

    // Date filter
    dateFilterOpen,
    onToggleDateFilter,
    startDate,
    endDate,
    showStartPicker,
    showEndPicker,
    onShowStartPicker,
    onShowEndPicker,
    onStartDateChange,
    onEndDateChange,
    onClearDates,

    // Location filter
    locationFilterOpen,
    onToggleLocationFilter,
    locationText,
    onLocationTextChange,
    locationSuggestions,
    onPickLocation,
    onClearLocation,

    // Género
    genreFilterOpen,
    onToggleGenreFilter,
    selectedGenres,
    onToggleGenre,
    onClearGenres,

    // nested scroll
    nestedScrollEnabled,
  } = props;

  return (
    <View style={styles.container}>
      {/* CHIPS horizontales */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      >
        {/* Fecha */}
        <TouchableOpacity
          style={[styles.filterChip, isDateActive && styles.filterChipActive]}
          onPress={onToggleDateFilter}
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

        {/* Ubicación */}
        <TouchableOpacity
          style={[styles.filterChip, isLocationActive && styles.filterChipActive]}
          onPress={onToggleLocationFilter}
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

        {/* Esta semana */}
        <TouchableOpacity
          style={[styles.filterChip, weekActive && styles.filterChipActive]}
          onPress={onToggleWeek}
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

        {/* After */}
        <TouchableOpacity
          style={[styles.filterChip, afterActive && styles.filterChipActive]}
          onPress={onToggleAfter}
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

        {/* LGBT */}
        <TouchableOpacity
          style={[styles.filterChip, lgbtActive && styles.filterChipActive]}
          onPress={onToggleLgbt}
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

        {/* Género */}
        <TouchableOpacity
          style={[styles.filterChip, isGenreActive && styles.filterChipActive]}
          onPress={onToggleGenreFilter}
        >
          <IconButton
            icon="music"
            size={18}
            iconColor={COLORS.textPrimary}
            style={{ margin: 0 }}
          />
          <Text
            style={[
              styles.filterChipText,
              isGenreActive && styles.filterChipTextActive,
            ]}
          >
            Género
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SearchBar */}
      <View style={styles.searchContainer}>
        <SearchBarComponent
          value={searchText}
          onChangeText={onSearchTextChange}
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
            onPress={() => onShowStartPicker(true)}
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
            onPress={() => onShowEndPicker(true)}
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
          <TouchableOpacity style={styles.clearButton} onPress={onClearDates}>
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
            onChangeText={onLocationTextChange}
          />

          {/* Sugerencias */}
          {props.locationSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView
                style={styles.suggestionsScroll}
                nestedScrollEnabled={nestedScrollEnabled}
                keyboardShouldPersistTaps="handled"
              >
                {props.locationSuggestions.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={styles.suggestionItem}
                    onPress={() => onPickLocation(loc.nombre)}
                  >
                    <Text style={styles.suggestionItemText}>{loc.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={styles.clearButton} onPress={onClearLocation}>
            <Text style={styles.clearButtonText}>Limpiar ubicación</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Panel de géneros */}
      {genreFilterOpen && (
        <View style={styles.genreFilterContainer}>
          <Text style={styles.dateFilterLabel}>Seleccionar géneros:</Text>

          <ScrollView
            style={styles.genreScroll}
            nestedScrollEnabled={nestedScrollEnabled}
            keyboardShouldPersistTaps="handled"
          >
            {ELECTRONIC_GENRES.map((g) => {
              const isSelected = selectedGenres.includes(g);
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.genreItem, isSelected && styles.genreItemSelected]}
                  onPress={() => onToggleGenre(g)}
                >
                  <Text style={styles.genreItemText}>{g}</Text>
                  {isSelected && (
                    <IconButton
                      icon="check"
                      size={18}
                      iconColor={COLORS.primary}
                      style={{ margin: 0 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.clearButton} onPress={onClearGenres}>
            <Text style={styles.clearButtonText}>Limpiar géneros</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    maxHeight: 200,
    overflow: "hidden",
  },
  suggestionsScroll: {
    // scroll interno
  },
  suggestionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderInput,
  },
  suggestionItemText: {
    color: COLORS.textPrimary,
  },
  genreFilterContainer: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: RADIUS.card,
    padding: 10,
    maxHeight: 250,
    overflow: "hidden",
  },
  genreScroll: {
    // scroll interno
  },
  genreItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  genreItemSelected: {
    backgroundColor: "#e0e0e0",
  },
  genreItemText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
  },
});
