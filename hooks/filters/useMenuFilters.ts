// hooks/useMenuFilters.ts
import { useState, useEffect, useMemo } from "react";
import { getAllEvents } from "@/utils/events/eventHelpers";
import { EventItem } from "@/interfaces/EventProps";
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
  fetchLocalitiesByName,
} from "@/utils/georef/georefHelpers";

// ... (La función getWeekRange y demás lógica)

export function useMenuFilters() {
  // Estado base de eventos, etc.
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  useEffect(() => {
    const events = getAllEvents();
    setAllEvents(events);
  }, []);

  // Otros estados de filtros (texto, fecha, etc.)
  const [searchText, setSearchText] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // NUEVOS estados para ubicación (tres inputs)
  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  
  // Para Provincia
  const [provinceText, setProvinceText] = useState("");
  const [provinceSuggestions, setProvinceSuggestions] = useState<{ id: string; nombre: string }[]>([]);
  
  // Para Municipio
  const [municipalityText, setMunicipalityText] = useState("");
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState<{ id: string; nombre: string }[]>([]);
  
  // Para Localidad (ya existía como locationText)
  const [localityText, setLocalityText] = useState("");
  const [localitySuggestions, setLocalitySuggestions] = useState<{ id: string; nombre: string }[]>([]);

  // Otros filtros (semana, after, LGBT, género)
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
      // Opcional: filtrar resultados según el texto
      setProvinceSuggestions(results.filter((prov) =>
        prov.nombre.toLowerCase().includes(value.toLowerCase())
      ));
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
      setMunicipalitySuggestions(results.filter((mun) =>
        mun.nombre.toLowerCase().includes(value.toLowerCase())
      ));
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
      // Si tienes provincia y municipio, usalos para buscar
      if (provinceText && municipalityText) {
        const results = await fetchLocalities(provinceText, municipalityText);
        setLocalitySuggestions(results.filter((loc) =>
          loc.nombre.toLowerCase().includes(value.toLowerCase())
        ));
      } else {
        // Fallback: búsqueda por nombre
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

  // Agrega estas funciones justo antes del return final en tu hook:
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
    let results = [...allEvents];

    // Filtrado por texto
    if (searchText.trim() !== "") {
      const lower = searchText.toLowerCase();
      results = results.filter((ev) =>
        ev.title.toLowerCase().includes(lower)
      );
    }

    // Filtrado por rango de fechas
    if (startDate && endDate) {
      results = results.filter((ev) => {
        const [day, month, year] = ev.date.split("/").map(Number);
        const eventTime = new Date(year, month - 1, day).getTime();
        return eventTime >= startDate.getTime() && eventTime <= endDate.getTime();
      });
    }

    // Filtrado por ubicación (ejemplo: si tus eventos tienen propiedades province, municipality y address)
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

    // Filtrado por "Esta semana", After, LGBT y Géneros (como ya lo tenías)
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
    // Agrega estas funciones justo antes del return final en tu hook:
function onToggleGenre(g: string) {
  setSelectedGenres((prev) =>
    prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
  );
}

function onClearGenres() {
  setSelectedGenres([]);
}


    return results;
  }, [
    allEvents,
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
    // Estados y setters para otros filtros...
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
    // NUEVOS estados de ubicación:
    locationFilterOpen,
    setLocationFilterOpen,
    provinceText,
    setProvinceText, // si lo necesitas directamente
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
