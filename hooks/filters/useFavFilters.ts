// hooks/useFavFilters.ts
import { useState, useEffect, useMemo } from "react";
import { getAllFavEvents, ExtendedEventItem } from "@/utils/eventFavHelpers";
import { fetchLocalitiesByName } from "@/utils/georefHelpers";

/** Función para calcular la semana actual */
function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);

  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return { startOfWeek, endOfWeek };
}

/**
 * Custom hook que maneja:
 * - La carga de eventos favoritos (getAllFavEvents)
 * - Estados de filtros (fecha, ubicación, etc.)
 * - Lógica de filtrado (filteredEvents)
 */
export function useFavFilters() {
  // 1) Estado base de eventos favoritos
  const [favEvents, setFavEvents] = useState<ExtendedEventItem[]>([]);

  // 2) Efecto para cargar los eventos favoritos al montar
  useEffect(() => {
    const events = getAllFavEvents();
    setFavEvents(events);
  }, []);

  // ============= ESTADOS de los filtros =============
  const [searchText, setSearchText] = useState("");

  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  const [locationText, setLocationText] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    { id: string; nombre: string }[]
  >([]);

  const [weekActive, setWeekActive] = useState(false);
  const [afterActive, setAfterActive] = useState(false);
  const [lgbtActive, setLgbtActive] = useState(false);

  const [genreFilterOpen, setGenreFilterOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // ============ HANDLERS =============
  async function handleLocationTextChange(value: string) {
    setLocationText(value);
    if (value.trim().length < 3) {
      setLocationSuggestions([]);
      return;
    }
    try {
      const results = await fetchLocalitiesByName(value.trim());
      setLocationSuggestions(results);
    } catch (error) {
      console.error("Error al buscar localidades:", error);
      setLocationSuggestions([]);
    }
  }
  function handlePickLocation(locName: string) {
    setLocationText(locName);
    setLocationSuggestions([]);
  }

  function onStartDateChange(_event: any, selectedDate?: Date) {
    setShowStartPicker(false);
    if (selectedDate) setStartDate(selectedDate);
  }
  function onEndDateChange(_event: any, selectedDate?: Date) {
    setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate);
  }
  function onClearDates() {
    setStartDate(null);
    setEndDate(null);
  }
  function onClearLocation() {
    setLocationText("");
    setLocationSuggestions([]);
  }
  function onToggleGenre(g: string) {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
    );
  }
  function onClearGenres() {
    setSelectedGenres([]);
  }

  // ============ FILTRADO final =============
  const filteredEvents = useMemo(() => {
    let results = [...favEvents];

    // (a) Texto
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

    // (d) Esta semana
    if (weekActive) {
      const { startOfWeek, endOfWeek } = getWeekRange();
      results = results.filter((ev) => {
        const [day, month, year] = ev.date.split("/").map(Number);
        const eventTime = new Date(year, month - 1, day).getTime();
        return eventTime >= startOfWeek.getTime() && eventTime < endOfWeek.getTime();
      });
    }

    // (e) After
    if (afterActive) {
      results = results.filter((ev) => ev.isAfter === true);
    }

    // (f) LGBT
    if (lgbtActive) {
      results = results.filter((ev) => ev.isLGBT === true);
    }

    // (g) Género
    if (selectedGenres.length > 0) {
      results = results.filter((ev) => selectedGenres.includes(ev.type));
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
    selectedGenres,
  ]);

  return {
    // Estados y setters
    searchText,
    setSearchText,
    dateFilterOpen,
    setDateFilterOpen,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    showStartPicker,
    setShowStartPicker,
    showEndPicker,
    setShowEndPicker,
    locationFilterOpen,
    setLocationFilterOpen,
    locationText,
    setLocationText,
    locationSuggestions,
    setLocationSuggestions,
    weekActive,
    setWeekActive,
    afterActive,
    setAfterActive,
    lgbtActive,
    setLgbtActive,
    genreFilterOpen,
    setGenreFilterOpen,
    selectedGenres,
    setSelectedGenres,

    // Handlers
    handleLocationTextChange,
    handlePickLocation,
    onStartDateChange,
    onEndDateChange,
    onClearDates,
    onClearLocation,
    onToggleGenre,
    onClearGenres,

    // Resultado final
    filteredEvents,
  };
}
