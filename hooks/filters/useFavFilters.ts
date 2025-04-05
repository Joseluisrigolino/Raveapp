// hooks/useFavFilters.ts
import { useState, useEffect, useMemo } from "react";
import { getAllFavEvents, ExtendedEventItem } from "@/utils/events/eventFavHelpers";
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
  fetchLocalitiesByName,
} from "@/utils/georef/georefHelpers";

/** Calcula la semana actual (de lunes a lunes siguiente) */
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

export function useFavFilters() {
  // Estado base de eventos favoritos
  const [favEvents, setFavEvents] = useState<ExtendedEventItem[]>([]);
  useEffect(() => {
    const events = getAllFavEvents();
    setFavEvents(events);
  }, []);

  // Estados para otros filtros
  const [searchText, setSearchText] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // --- NUEVOS estados para ubicación (3 inputs) ---
  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  
  // Para Provincia
  const [provinceText, setProvinceText] = useState("");
  const [provinceSuggestions, setProvinceSuggestions] = useState<{ id: string; nombre: string }[]>([]);
  
  // Para Municipio
  const [municipalityText, setMunicipalityText] = useState("");
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<{ id: string; nombre: string }[]>([]);
  
  // Para Localidad
  const [localityText, setLocalityText] = useState("");
  const [localitySuggestions, setLocalitySuggestions] = useState<{ id: string; nombre: string }[]>([]);

  // Otros filtros
  const [weekActive, setWeekActive] = useState(false);
  const [afterActive, setAfterActive] = useState(false);
  const [lgbtActive, setLgbtActive] = useState(false);
  const [genreFilterOpen, setGenreFilterOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // ===== HANDLERS para ubicación =====
  // Provincia
  async function onProvinceTextChange(value: string) {
    setProvinceText(value);
    if (value.trim().length < 3) {
      setProvinceSuggestions([]);
      return;
    }
    try {
      const results = await fetchProvinces();
      setProvinceSuggestions(
        results.filter((prov) =>
          prov.nombre.toLowerCase().includes(value.toLowerCase())
        )
      );
    } catch (error) {
      console.error("Error al buscar provincias:", error);
      setProvinceSuggestions([]);
    }
  }
  function onPickProvince(name: string) {
    setProvinceText(name);
    setProvinceSuggestions([]);
  }

  // Municipio
  async function onMunicipalityTextChange(value: string) {
    setMunicipalityText(value);
    if (value.trim().length < 3 || !provinceText) {
      setMunicipalitySuggestions([]);
      return;
    }
    try {
      const results = await fetchMunicipalities(provinceText);
      setMunicipalitySuggestions(
        results.filter((mun) =>
          mun.nombre.toLowerCase().includes(value.toLowerCase())
        )
      );
    } catch (error) {
      console.error("Error al buscar municipios:", error);
      setMunicipalitySuggestions([]);
    }
  }
  function onPickMunicipality(name: string) {
    setMunicipalityText(name);
    setMunicipalitySuggestions([]);
  }

  // Localidad
  async function onLocalityTextChange(value: string) {
    setLocalityText(value);
    if (value.trim().length < 3) {
      setLocalitySuggestions([]);
      return;
    }
    try {
      if (provinceText && municipalityText) {
        const results = await fetchLocalities(provinceText, municipalityText);
        setLocalitySuggestions(
          results.filter((loc) =>
            loc.nombre.toLowerCase().includes(value.toLowerCase())
          )
        );
      } else {
        const results = await fetchLocalitiesByName(value);
        setLocalitySuggestions(results);
      }
    } catch (error) {
      console.error("Error al buscar localidades:", error);
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

  // ===== HANDLERS para género =====
  function onToggleGenre(g: string) {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
    );
  }
  function onClearGenres() {
    setSelectedGenres([]);
  }

  // ===== FILTRADO final =====
  const filteredEvents = useMemo(() => {
    let results = [...favEvents];

    // (a) Filtrado por texto
    if (searchText.trim() !== "") {
      const lower = searchText.toLowerCase();
      results = results.filter((ev) =>
        ev.title.toLowerCase().includes(lower)
      );
    }

    // (b) Filtrado por rango de fechas
    if (startDate && endDate) {
      results = results.filter((ev) => {
        const [day, month, year] = ev.date.split("/").map(Number);
        const eventTime = new Date(year, month - 1, day).getTime();
        return eventTime >= startDate.getTime() && eventTime <= endDate.getTime();
      });
    }

    // (c) Filtrado por ubicación
    if (provinceText.trim() !== "") {
      results = results.filter((ev) =>
        ev.province?.toLowerCase().includes(provinceText.toLowerCase())
      );
    }
    if (municipalityText.trim() !== "") {
      results = results.filter((ev) =>
        ev.municipality?.toLowerCase().includes(municipalityText.toLowerCase())
      );
    }
    if (localityText.trim() !== "") {
      results = results.filter((ev) =>
        ev.address?.toLowerCase().includes(localityText.toLowerCase())
      );
    }

    // (d) Filtrado por "Esta semana", After, LGBT y Género
    if (weekActive) {
      const { startOfWeek, endOfWeek } = getWeekRange();
      results = results.filter((ev) => {
        const [day, month, year] = ev.date.split("/").map(Number);
        const eventTime = new Date(year, month - 1, day).getTime();
        return eventTime >= startOfWeek.getTime() && eventTime < endOfWeek.getTime();
      });
    }
    if (afterActive) {
      results = results.filter((ev) => ev.isAfter === true);
    }
    if (lgbtActive) {
      results = results.filter((ev) => ev.isLGBT === true);
    }
    if (selectedGenres.length > 0) {
      results = results.filter((ev) =>
        selectedGenres.includes(ev.type)
      );
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

  return {
    // Estados y setters para otros filtros
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
    // Estados para ubicación (3 inputs)
    locationFilterOpen,
    setLocationFilterOpen,
    provinceText,
    setProvinceText,
    onProvinceTextChange,
    provinceSuggestions,
    onPickProvince,
    municipalityText,
    setMunicipalityText,
    onMunicipalityTextChange,
    municipalitySuggestions,
    onPickMunicipality,
    localityText,
    setLocalityText,
    onLocalityTextChange,
    localitySuggestions,
    onPickLocality,
    onClearLocation,
    // Otros filtros
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
    // Handlers para género
    onToggleGenre,
    onClearGenres,
    // Resultado final
    filteredEvents,
  };
}
