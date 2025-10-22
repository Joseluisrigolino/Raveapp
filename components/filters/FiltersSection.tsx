// components/FiltersSection/FiltersSection.tsx
import React, { useEffect, useState } from "react";
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
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { fetchGenres, ApiGenero } from "@/utils/events/eventApi";

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

  // --- Ubicación filter con 3 inputs ---
  locationFilterOpen: boolean;
  onToggleLocationFilter: () => void;
  // Provincia
  provinceText: string;
  onProvinceTextChange: (val: string) => void;
  provinceSuggestions: { id: string; nombre: string }[];
  onPickProvince: (provName: string) => void;
  // Municipio
  municipalityText: string;
  onMunicipalityTextChange: (val: string) => void;
  municipalitySuggestions: { id: string; nombre: string }[];
  onPickMunicipality: (munName: string) => void;
  // Localidad
  localityText: string;
  onLocalityTextChange: (val: string) => void;
  localitySuggestions: { id: string; nombre: string }[];
  onPickLocality: (locName: string) => void;
  // Botón para limpiar los 3 inputs
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

    // Ubicación filter (3 inputs)
    locationFilterOpen,
    onToggleLocationFilter,
    provinceText,
    onProvinceTextChange,
    provinceSuggestions,
    onPickProvince,
    municipalityText,
    onMunicipalityTextChange,
    municipalitySuggestions,
    onPickMunicipality,
    localityText,
    onLocalityTextChange,
    localitySuggestions,
    onPickLocality,
    onClearLocation,

    // Género filter
    genreFilterOpen,
    onToggleGenreFilter,
    selectedGenres,
    onToggleGenre,
    onClearGenres,

    nestedScrollEnabled,
  } = props;

  // ------- Géneros desde API -------
  const [genres, setGenres] = useState<ApiGenero[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const gs = await fetchGenres();
        if (mounted) setGenres(gs);
      } catch {
        if (mounted) setGenres([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      {/* CHIPS horizontales */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      >
        {/* Género */}
        <TouchableOpacity
          style={[styles.filterChip, isGenreActive && styles.filterChipActive]}
          onPress={onToggleGenreFilter}
        >
          <Text style={[styles.filterChipText, isGenreActive && styles.filterChipTextActive]}>Género</Text>
        </TouchableOpacity>

        {/* Fecha */}
        <TouchableOpacity
          style={[styles.filterChip, isDateActive && styles.filterChipActive]}
          onPress={onToggleDateFilter}
        >
          <Text style={[styles.filterChipText, isDateActive && styles.filterChipTextActive]}>Fecha</Text>
        </TouchableOpacity>

        {/* Ubicación */}
        <TouchableOpacity
          style={[styles.filterChip, isLocationActive && styles.filterChipActive]}
          onPress={onToggleLocationFilter}
        >
          <Text style={[styles.filterChipText, isLocationActive && styles.filterChipTextActive]}>Ubicación</Text>
        </TouchableOpacity>

        {/* Esta semana */}
        <TouchableOpacity
          style={[styles.filterChip, weekActive && styles.filterChipActive]}
          onPress={onToggleWeek}
        >
          <Text style={[styles.filterChipText, weekActive && styles.filterChipTextActive]}>Esta semana</Text>
        </TouchableOpacity>

        {/* After */}
        <TouchableOpacity
          style={[styles.filterChip, afterActive && styles.filterChipActive]}
          onPress={onToggleAfter}
        >
          <Text style={[styles.filterChipText, afterActive && styles.filterChipTextActive]}>After</Text>
        </TouchableOpacity>

        {/* LGBT */}
        <TouchableOpacity
          style={[styles.filterChip, lgbtActive && styles.filterChipActive]}
          onPress={onToggleLgbt}
        >
          <Text style={[styles.filterChipText, lgbtActive && styles.filterChipTextActive]}>LGBT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SearchBar */}
      <View style={styles.searchContainer}>
        <SearchBarComponent
          value={searchText}
          onChangeText={onSearchTextChange}
          placeholder="Buscar eventos..."
        />
      </View>

      {/* Panel de fechas */}
      {dateFilterOpen && (
        <View style={styles.dateFilterContainer}>
          <Text style={styles.dateFilterLabel}>Seleccionar rango de fechas:</Text>

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => onShowStartPicker(true)}
          >
            <Text style={styles.dateInputText}>
              {startDate ? `Desde: ${startDate.toLocaleDateString()}` : "Desde: --/--/----"}
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

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => onShowEndPicker(true)}
          >
            <Text style={styles.dateInputText}>
              {endDate ? `Hasta: ${endDate.toLocaleDateString()}` : "Hasta: --/--/----"}
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

          <TouchableOpacity style={styles.clearButton} onPress={onClearDates}>
            <Text style={styles.clearButtonText}>Limpiar fechas</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Panel de ubicación con 3 inputs */}
      {locationFilterOpen && (
        <View style={styles.locationFilterContainer}>
          <Text style={styles.dateFilterLabel}>Filtrar por ubicación:</Text>

          {/* Provincia */}
          <TextInput
            style={styles.locationInput}
            placeholder="Provincia"
            placeholderTextColor={COLORS.textSecondary}
            value={provinceText}
            onChangeText={onProvinceTextChange}
          />
          {provinceSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView
                style={styles.suggestionsScroll}
                nestedScrollEnabled={nestedScrollEnabled}
                keyboardShouldPersistTaps="handled"
              >
                {provinceSuggestions.map((prov) => (
                  <TouchableOpacity
                    key={prov.id}
                    style={styles.suggestionItem}
                    onPress={() => onPickProvince(prov.nombre)}
                  >
                    <Text style={styles.suggestionItemText}>{prov.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Municipio */}
          <TextInput
            style={styles.locationInput}
            placeholder="Municipio"
            placeholderTextColor={COLORS.textSecondary}
            value={municipalityText}
            onChangeText={onMunicipalityTextChange}
          />
          {municipalitySuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView
                style={styles.suggestionsScroll}
                nestedScrollEnabled={nestedScrollEnabled}
                keyboardShouldPersistTaps="handled"
              >
                {municipalitySuggestions.map((mun) => (
                  <TouchableOpacity
                    key={mun.id}
                    style={styles.suggestionItem}
                    onPress={() => onPickMunicipality(mun.nombre)}
                  >
                    <Text style={styles.suggestionItemText}>{mun.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Localidad */}
          <TextInput
            style={styles.locationInput}
            placeholder="Localidad"
            placeholderTextColor={COLORS.textSecondary}
            value={localityText}
            onChangeText={onLocalityTextChange}
          />
          {localitySuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView
                style={styles.suggestionsScroll}
                nestedScrollEnabled={nestedScrollEnabled}
                keyboardShouldPersistTaps="handled"
              >
                {localitySuggestions.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={styles.suggestionItem}
                    onPress={() => onPickLocality(loc.nombre)}
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

      {/* Panel de géneros (dinámico) */}
      {genreFilterOpen && (
        <View style={styles.genreFilterContainer}>
          <Text style={styles.dateFilterLabel}>Seleccionar géneros:</Text>

          <ScrollView
            style={styles.genreScroll}
            nestedScrollEnabled={nestedScrollEnabled}
            keyboardShouldPersistTaps="handled"
          >
            {genres.map((g) => {
              const name = g.dsGenero;
              const isSelected = selectedGenres.includes(name);
              return (
                <TouchableOpacity
                  key={`${g.cdGenero}-${name}`}
                  style={[styles.genreItem, isSelected && styles.genreItemSelected]}
                  onPress={() => onToggleGenre(name)}
                >
                  <Text style={styles.genreItemText}>{name}</Text>
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
            {genres.length === 0 && (
              <Text style={{ color: COLORS.textSecondary }}>
                No se pudieron cargar los géneros.
              </Text>
            )}
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
    marginHorizontal: 12,
    marginTop: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.chip,
    marginRight: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  filterChipActive: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.textSecondary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    marginLeft: 0,
  },
  filterChipTextActive: {
    color: COLORS.textPrimary,
  },
  searchContainer: {
    marginHorizontal: 12,
    marginTop: 10,
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
    marginBottom: 4,
  },
  suggestionsContainer: {
    marginTop: 4,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    maxHeight: 200,
    overflow: "hidden",
    marginBottom: 4,
  },
  suggestionsScroll: {},
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
  genreScroll: {},
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
