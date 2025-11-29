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
import { fetchGenres, ApiGenero } from "@/app/events/apis/eventApi";
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
} from "@/app/apis/georefApi";

interface FiltersSectionProps {
  // Chips horizontales
  isDateActive: boolean;
  isLocationActive: boolean;
  isGenreActive: boolean;
  weekActive: boolean;
  afterActive: boolean;
  lgbtActive: boolean;
  onToggleWeek: () => void;
  onToggleAfter: () => void;
  onToggleLgbt: () => void;

  // Search bar
  searchText: string;
  onSearchTextChange: (val: string) => void;

  // Date filter
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

  // Ubicación (3 inputs)
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

  // Género
  genreFilterOpen: boolean;
  onToggleGenreFilter: () => void;
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
  onClearGenres: () => void;

  // Control de scroll anidado (opcional)
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

  // local dropdown state for location selectors (province / municipality / locality)
  const [showProvinceList, setShowProvinceList] = useState(false);
  const [showMunicipalityList, setShowMunicipalityList] = useState(false);
  const [showLocalityList, setShowLocalityList] = useState(false);
  // fallback local lists when parent doesn't provide suggestions
  const [localProvinceList, setLocalProvinceList] = useState<{ id: string; nombre: string }[]>([]);
  const [localMunicipalityList, setLocalMunicipalityList] = useState<{ id: string; nombre: string }[]>([]);
  const [localLocalityList, setLocalLocalityList] = useState<{ id: string; nombre: string }[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<string | null>(null);
  const [isProvinceCABA, setIsProvinceCABA] = useState(false);
  // load provinces locally when parent doesn't provide suggestions (fallback)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Only fetch if parent did not provide province suggestions
        if ((!provinceSuggestions || provinceSuggestions.length === 0) && mounted) {
          const provs = await fetchProvinces().catch(() => [] as any[]);
          if (mounted) setLocalProvinceList(provs || []);
        }
      } catch (e) {
        if (mounted) setLocalProvinceList([]);
      }
    })();
    return () => { mounted = false; };
  }, [provinceSuggestions]);

  // If a province id is selected programmatically (provinceText may come from parent),
  // and parent didn't supply municipality suggestions, prefetch municipalities as fallback.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const provId = selectedProvinceId;
          if (provId && mounted) {
            // Special-case: CABA (id '02') doesn't use municipios; load localidades by province
            if ((String(provId) === "02")) {
              setIsProvinceCABA(true);
              // For CABA we hide municipio and localidad controls; clear local lists
              if (mounted) {
                setLocalLocalityList([]);
                setLocalMunicipalityList([]);
              }
            } else {
              setIsProvinceCABA(false);
              if ((!municipalitySuggestions || municipalitySuggestions.length === 0)) {
                const munis = await fetchMunicipalities(String(provId)).catch(() => [] as any[]);
                if (mounted) setLocalMunicipalityList(munis || []);
              }
            }
        }
      } catch (e) {
        if (mounted) setLocalMunicipalityList([]);
      }
    })();
    return () => { mounted = false; };
  }, [selectedProvinceId, municipalitySuggestions]);
  // if parent clears provinceText or it changes to empty, reset related local state
  useEffect(() => {
    if (!provinceText) {
      setSelectedProvinceId(null);
      setIsProvinceCABA(false);
      setLocalProvinceList([]);
      setLocalMunicipalityList([]);
      setLocalLocalityList([]);
      setSelectedMunicipalityId(null);
    }
  }, [provinceText]);
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
      {/* Chips horizontales */}
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

        {/* AFTER con color propio */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            styles.afterChip,
            afterActive && styles.afterChipActive,
          ]}
          onPress={onToggleAfter}
        >
          <Text
            style={[
              styles.filterChipText,
              styles.afterChipText,
              afterActive && styles.afterChipTextActive,
            ]}
          >
            AFTER
          </Text>
        </TouchableOpacity>

        {/* LGTB con color propio */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            styles.lgtbChip,
            lgbtActive && styles.lgtbChipActive,
          ]}
          onPress={onToggleLgbt}
        >
          <Text
            style={[
              styles.filterChipText,
              styles.lgtbChipText,
              lgbtActive && styles.lgtbChipTextActive,
            ]}
          >
            LGTB
          </Text>
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
              onChange={(event, selectedDate) => {
                try {
                  onStartDateChange(event, selectedDate);
                } catch {}
                try {
                  onShowStartPicker(false);
                } catch {}
              }}
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
              onChange={(event, selectedDate) => {
                try {
                  onEndDateChange(event, selectedDate);
                } catch {}
                try {
                  onShowEndPicker(false);
                } catch {}
              }}
            />
          )}

          <TouchableOpacity style={styles.clearButton} onPress={onClearDates}>
            <Text style={styles.clearButtonText}>Limpiar fechas</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Panel de ubicación (3 inputs) */}
      {locationFilterOpen && (
        <View style={styles.locationFilterContainer}>
          <Text style={styles.dateFilterLabel}>Filtrar por ubicación:</Text>

          {/* Provincia */}
          <TouchableOpacity
            style={[
              styles.locationInput,
              { justifyContent: "center" },
            ]}
            onPress={() => setShowProvinceList((s) => !s)}
            activeOpacity={0.8}
          >
            <Text style={{ color: provinceText ? COLORS.textPrimary : COLORS.textSecondary }}>
              {provinceText || "Provincia"}
            </Text>
          </TouchableOpacity>
          {showProvinceList && (
            <View style={styles.suggestionsContainer}>
              <ScrollView
                nestedScrollEnabled={nestedScrollEnabled}
                keyboardShouldPersistTaps="handled"
              >
                {(provinceSuggestions.length > 0 ? provinceSuggestions : localProvinceList).map((prov) => (
                  <TouchableOpacity
                    key={prov.id}
                    style={styles.suggestionItem}
                    onPress={async () => {
                          onPickProvince(prov.nombre);
                          onProvinceTextChange(prov.nombre);
                          setSelectedProvinceId(prov.id);
                          setSelectedProvinceId(prov.id);
                          setShowProvinceList(false);
                          setShowMunicipalityList(false);
                          setShowLocalityList(false);
                          // When a province is selected, fetch municipalities or localidades as fallback
                          try {
                            if (String(prov.id) === "02") {
                              setIsProvinceCABA(true);
                              // hide municipio and localidad for CABA
                              setLocalLocalityList([]);
                              setLocalMunicipalityList([]);
                              setShowMunicipalityList(false);
                              setShowLocalityList(false);
                            } else {
                              setIsProvinceCABA(false);
                              const munis = await fetchMunicipalities(String(prov.id)).catch(() => [] as any[]);
                              setLocalMunicipalityList(munis || []);
                            }
                            // reset downstream selection
                            setLocalLocalityList((prev) => prev || []);
                            setSelectedMunicipalityId(null);
                            onMunicipalityTextChange("");
                            onLocalityTextChange("");
                          } catch {}
                    }}
                  >
                    <Text style={styles.suggestionItemText}>{prov.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Municipio */}
          { !isProvinceCABA && (
            <TouchableOpacity
              style={[
                styles.locationInput,
                { justifyContent: "center" },
                !provinceText && { opacity: 0.5 },
              ]}
              onPress={() => provinceText && setShowMunicipalityList((s) => !s)}
              activeOpacity={provinceText ? 0.8 : 1}
              disabled={!provinceText}
            >
              <Text style={{ color: municipalityText ? COLORS.textPrimary : COLORS.textSecondary }}>
                {municipalityText || "Municipio"}
              </Text>
            </TouchableOpacity>
          )}
          {showMunicipalityList && (
            <View style={styles.suggestionsContainer}>
              <ScrollView
                nestedScrollEnabled={nestedScrollEnabled}
                keyboardShouldPersistTaps="handled"
              >
                {(municipalitySuggestions.length > 0 ? municipalitySuggestions : localMunicipalityList).map((mun) => (
                  <TouchableOpacity
                    key={mun.id}
                    style={styles.suggestionItem}
                    onPress={async () => {
                      onPickMunicipality(mun.nombre);
                      onMunicipalityTextChange(mun.nombre);
                      setSelectedMunicipalityId(mun.id);
                      setShowMunicipalityList(false);
                      // fetch localities as fallback
                      try {
                        const locs = await fetchLocalities(String(selectedProvinceId || ""), String(mun.id)).catch(() => [] as any[]);
                        setLocalLocalityList(locs || []);
                        onLocalityTextChange("");
                      } catch {}
                    }}
                  >
                    <Text style={styles.suggestionItemText}>{mun.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Localidad (oculto en CABA) */}
          { !isProvinceCABA && (
            <>
              <TouchableOpacity
                style={[
                  styles.locationInput,
                  { justifyContent: "center" },
                  !municipalityText && { opacity: 0.5 },
                ]}
                onPress={() => municipalityText && setShowLocalityList((s) => !s)}
                activeOpacity={municipalityText ? 0.8 : 1}
                disabled={!municipalityText}
              >
                <Text style={{ color: localityText ? COLORS.textPrimary : COLORS.textSecondary }}>
                  {localityText || "Localidad"}
                </Text>
              </TouchableOpacity>
              {showLocalityList && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView
                    nestedScrollEnabled={nestedScrollEnabled}
                    keyboardShouldPersistTaps="handled"
                  >
                    {(localitySuggestions.length > 0 ? localitySuggestions : localLocalityList).map((loc) => (
                      <TouchableOpacity
                        key={loc.id}
                        style={styles.suggestionItem}
                        onPress={() => {
                          onPickLocality(loc.nombre);
                          onLocalityTextChange(loc.nombre);
                          setShowLocalityList(false);
                        }}
                      >
                        <Text style={styles.suggestionItemText}>{loc.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
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
  // AFTER chip con color propio
  afterChip: {
    backgroundColor: COLORS.tagAfter,
    borderColor: "#C23679",
  },
  afterChipActive: {
    backgroundColor: "#B8326E",
    borderColor: "#9F2B60",
  },
  afterChipText: {
    color: "#FFFFFF",
  },
  afterChipTextActive: {
    color: "#FFFFFF",
  },
  // LGTB chip con color propio
  lgtbChip: {
    backgroundColor: COLORS.tagLGBT,
    borderColor: "#38AAA6",
  },
  lgtbChipActive: {
    backgroundColor: "#2EA19C",
    borderColor: "#278A86",
  },
  lgtbChipText: {
    color: "#FFFFFF",
  },
  lgtbChipTextActive: {
    color: "#FFFFFF",
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
