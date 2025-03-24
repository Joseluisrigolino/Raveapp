// hooks/useCreateEvent.ts
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { Artist } from "@/interfaces/Artist";
import { ELECTRONIC_GENRES } from "@/utils/electronicGenresHelper";
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
} from "@/utils/georef/georefHelpers";

/** Representa los campos de entradas para un día. */
type DayTickets = {
  genEarlyQty: string;
  genEarlyPrice: string;
  vipEarlyQty: string;
  vipEarlyPrice: string;
  genQty: string;
  genPrice: string;
  vipQty: string;
  vipPrice: string;
};

/** Crea un "DayTickets" vacío (valores por defecto). */
function createEmptyDayTickets(): DayTickets {
  return {
    genEarlyQty: "",
    genEarlyPrice: "",
    vipEarlyQty: "",
    vipEarlyPrice: "",
    genQty: "",
    genPrice: "",
    vipQty: "",
    vipPrice: "",
  };
}

/** Calcula la suma total de entradas de un array de DayTickets. */
function calcTotalTickets(daysTickets: DayTickets[]): number {
  let total = 0;
  for (const day of daysTickets) {
    const ge = parseInt(day.genEarlyQty, 10) || 0;
    const ve = parseInt(day.vipEarlyQty, 10) || 0;
    const g = parseInt(day.genQty, 10) || 0;
    const v = parseInt(day.vipQty, 10) || 0;
    total += ge + ve + g + v;
  }
  return total;
}

// Datos simulados de artistas
const fakeArtistDatabase: Artist[] = [
  { name: "Artista 1", image: "" },
  { name: "Artista 2", image: "" },
  { name: "Artista 3", image: "" },
];

type EventType = "1d" | "2d" | "3d";

/**
 * Custom hook que encapsula:
 *  - Lógica de login (demo)
 *  - Campos del evento: nombre, tipo, géneros, artistas
 *  - Ubicación (provincias, municipios, localidades)
 *  - Manejo de tickets (daysTickets, totalTickets)
 *  - Multimedia (foto, video, música)
 *  - Términos y condiciones
 *  - handleSubmit final
 */
export function useCreateEvent() {
  // =========================
  // 1) Login (demo)
  // =========================
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function handleLogin() {
    console.log("Iniciar sesión presionado");
  }
  function handleRegister() {
    console.log("Registrarme presionado");
  }
  function handleGoogleLogin() {
    console.log("Login with Google presionado");
  }
  function simulateLogin() {
    setIsLoggedIn(true);
  }
  function handleLogout() {
    setIsLoggedIn(false);
  }

  // =========================
  // 2) Campos básicos
  // =========================
  const [eventType, setEventType] = useState<EventType>("1d");
  const [eventName, setEventName] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Artistas
  const [artistInput, setArtistInput] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);

  // =========================
  // 3) Ubicación
  // =========================
  const [provinces, setProvinces] = useState<{ id: string; nombre: string }[]>(
    []
  );
  const [municipalities, setMunicipalities] = useState<{
    id: string;
    nombre: string;
  }[]>([]);
  const [localities, setLocalities] = useState<{ id: string; nombre: string }[]>(
    []
  );

  const [showProvinces, setShowProvinces] = useState(false);
  const [showMunicipalities, setShowMunicipalities] = useState(false);
  const [showLocalities, setShowLocalities] = useState(false);

  const [provinceId, setProvinceId] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");
  const [municipalityName, setMunicipalityName] = useState("");
  const [localityId, setLocalityId] = useState("");
  const [localityName, setLocalityName] = useState("");

  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");

  // =========================
  // 4) Checkboxes: after / LGBT
  // =========================
  const [isAfter, setIsAfter] = useState(false);
  const [isLGBT, setIsLGBT] = useState(false);

  // =========================
  // 5) Descripción
  // =========================
  const [eventDescription, setEventDescription] = useState("");

  // =========================
  // 6) Fechas globales
  // =========================
  const [startDateTime, setStartDateTime] = useState<Date>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date>(new Date());

  // =========================
  // 7) Tickets (daysTickets)
  // =========================
  const [daysTickets, setDaysTickets] = useState<DayTickets[]>([
    createEmptyDayTickets(),
  ]);

  // =========================
  // 8) Config venta
  // =========================
  const [startSaleDateTime, setStartSaleDateTime] = useState<Date>(new Date());
  const [earlyBirdsStock, setEarlyBirdsStock] = useState(false);
  const [useEarlyBirdsDate, setUseEarlyBirdsDate] = useState(false);
  const [earlyBirdsUntilDateTime, setEarlyBirdsUntilDateTime] =
    useState<Date>(new Date());

  // =========================
  // 9) Multimedia
  // =========================
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [musicLink, setMusicLink] = useState("");

  // =========================
  // 10) Términos y condiciones
  // =========================
  const [acceptedTC, setAcceptedTC] = useState(false);

  // =========================
  // Efectos y lógica
  // =========================

  // Ajustar daysTickets según eventType
  useEffect(() => {
    if (eventType === "1d") {
      setDaysTickets([createEmptyDayTickets()]);
    } else if (eventType === "2d") {
      setDaysTickets([createEmptyDayTickets(), createEmptyDayTickets()]);
    } else {
      setDaysTickets([
        createEmptyDayTickets(),
        createEmptyDayTickets(),
        createEmptyDayTickets(),
      ]);
    }
  }, [eventType]);

  // Cargar la lista de provincias al montar
  useEffect(() => {
    fetchProvinces()
      .then((provData) => {
        setProvinces(provData);
      })
      .catch((err) => console.error("Error fetchProvinces:", err));
  }, []);

  // =========================
  // Handlers de UBICACIÓN
  // =========================
  async function handleSelectProvince(provId: string, provName: string) {
    setProvinceId(provId);
    setProvinceName(provName);

    // Limpiar selecciones posteriores
    setMunicipalityId("");
    setMunicipalityName("");
    setLocalityId("");
    setLocalityName("");
    setMunicipalities([]);
    setLocalities([]);

    setShowProvinces(false);

    try {
      const munData = await fetchMunicipalities(provId);
      setMunicipalities(munData);
    } catch (err) {
      console.error("Error fetchMunicipalities:", err);
    }
  }

  async function handleSelectMunicipality(munId: string, munName: string) {
    setMunicipalityId(munId);
    setMunicipalityName(munName);

    setLocalityId("");
    setLocalityName("");
    setLocalities([]);

    setShowMunicipalities(false);

    if (!provinceId) return;

    try {
      const locData = await fetchLocalities(provinceId, munId);
      setLocalities(locData);
    } catch (err) {
      console.error("Error fetchLocalities:", err);
    }
  }

  function handleSelectLocality(locId: string, locName: string) {
    setLocalityId(locId);
    setLocalityName(locName);
    setShowLocalities(false);
  }

  // =========================
  // Handlers de GÉNEROS
  // =========================
  function toggleGenre(genre: string) {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres((prev) => prev.filter((g) => g !== genre));
    } else {
      setSelectedGenres((prev) => [...prev, genre]);
    }
  }

  // =========================
  // Handlers de ARTISTAS
  // =========================
  function handleAddArtist() {
    const trimmedName = artistInput.trim();
    if (!trimmedName) return;
    const existingArtist = fakeArtistDatabase.find(
      (a) => a.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingArtist) {
      setSelectedArtists((prev) => [...prev, existingArtist]);
    } else {
      const newArtist: Artist = { name: trimmedName, image: "" };
      setSelectedArtists((prev) => [...prev, newArtist]);
    }
    setArtistInput("");
  }
  function handleRemoveArtist(artistName: string) {
    setSelectedArtists((prev) => prev.filter((a) => a.name !== artistName));
  }

  // =========================
  // Handlers de TICKETS
  // =========================
  function handleTicketChange(dayIndex: number, field: keyof DayTickets, value: string) {
    setDaysTickets((prev) => {
      const newArr = [...prev];
      newArr[dayIndex] = {
        ...newArr[dayIndex],
        [field]: value,
      };
      return newArr;
    });
  }

  const totalTickets = calcTotalTickets(daysTickets);

  // =========================
  // Handler de seleccionar foto
  // =========================
  async function handleSelectPhoto() {
    console.log("Seleccionar archivo presionado");

    // Pedir permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Se necesitan permisos para acceder a la galería.");
      return;
    }

    // Abrir galería
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "image", // 'image', 'video', 'all'
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled) {
      console.log("Usuario canceló la selección de imagen");
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      if (selectedAsset.uri) {
        setPhotoFile(selectedAsset.uri);
      }
    }
  }

  // =========================
  // Handler de SUBMIT
  // =========================
  function handleSubmit() {
    // Validar foto obligatoria y T&C
    if (!photoFile) {
      alert("Debes seleccionar una foto obligatoria.");
      return;
    }
    if (!acceptedTC) {
      alert("Debes aceptar los términos y condiciones.");
      return;
    }

    // Armar objeto final
    const finalData = {
      eventName,
      eventType,
      selectedGenres,
      selectedArtists,
      provinceId,
      provinceName,
      municipalityId,
      municipalityName,
      localityId,
      localityName,
      street,
      streetNumber,
      isAfter,
      isLGBT,
      eventDescription,
      multimedia: {
        photoFile,
        videoLink,
        musicLink,
      },
      startDateTime,
      endDateTime,
      daysTickets,
      startSaleDateTime,
      earlyBirdsStock,
      useEarlyBirdsDate,
      earlyBirdsUntilDateTime,
      totalTickets,
      acceptedTC,
    };
    console.log("Enviando evento:", finalData);
    alert("Evento creado (ejemplo)");
  }

  // =========================
  // Retornar todo lo necesario
  // =========================
  return {
    // Login
    isLoggedIn,
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    simulateLogin,
    handleLogout,

    // Campos
    eventType,
    setEventType,
    eventName,
    setEventName,
    selectedGenres,
    toggleGenre,
    artistInput,
    setArtistInput,
    selectedArtists,
    handleAddArtist,
    handleRemoveArtist,

    // Ubicación
    provinces,
    municipalities,
    localities,
    showProvinces,
    setShowProvinces,
    showMunicipalities,
    setShowMunicipalities,
    showLocalities,
    setShowLocalities,
    provinceId,
    provinceName,
    municipalityId,
    municipalityName,
    localityId,
    localityName,
    handleSelectProvince,
    handleSelectMunicipality,
    handleSelectLocality,
    street,
    setStreet,
    streetNumber,
    setStreetNumber,

    // Checkboxes after / LGBT
    isAfter,
    setIsAfter,
    isLGBT,
    setIsLGBT,

    // Descripción
    eventDescription,
    setEventDescription,

    // Fechas
    startDateTime,
    setStartDateTime,
    endDateTime,
    setEndDateTime,

    // Tickets
    daysTickets,
    setDaysTickets,
    handleTicketChange,
    totalTickets,

    // Config venta
    startSaleDateTime,
    setStartSaleDateTime,
    earlyBirdsStock,
    setEarlyBirdsStock,
    useEarlyBirdsDate,
    setUseEarlyBirdsDate,
    earlyBirdsUntilDateTime,
    setEarlyBirdsUntilDateTime,

    // Multimedia
    photoFile,
    handleSelectPhoto,
    videoLink,
    setVideoLink,
    musicLink,
    setMusicLink,

    // Términos
    acceptedTC,
    setAcceptedTC,

    // Submit
    handleSubmit,
  };
}
