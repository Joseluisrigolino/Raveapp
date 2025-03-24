// owner/ModifyEventScreen.tsx

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TitlePers from "@/components/common/TitleComponent";
import DateTimeInputComponent from "@/components/common/DateTimeInputComponent";

import { Artist } from "@/interfaces/Artist";
import { OwnerEventItem } from "@/interfaces/OwnerEventItem";
import { getOwnerEventById } from "@/utils/ownerEventsHelper";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/** Estructura de “entradas por día”. Ajusta si tu modelo difiere. */
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

/** Crea un objeto DayTickets vacío */
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

/** Suma el total de entradas de un array de DayTickets */
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

// Simulados (géneros, etc.). Ajusta a tu gusto.
const mockGenres = [
  "Techno",
  "Hard Techno",
  "Melodic Techno",
  "Trance",
  "Tech-House",
  "Acid Techno",
  "Industrial Techno",
  "Tribal",
  "House",
  "Minimal Techno",
  "Dub-Techno",
  "Psytrance",
  "Progressive",
];

// Ejemplo de base local para artistas
const fakeArtistDatabase: Artist[] = [
  { name: "Artista 1", image: "" },
  { name: "Artista 2", image: "" },
  { name: "Artista 3", image: "" },
];

// Ejemplo de pickers
const mockProvinces = ["Buenos Aires", "Córdoba", "Mendoza"];
const mockMunicipalities = ["Municipio 1", "Municipio 2"];
const mockLocalities = ["Localidad 1", "Localidad 2"];

// Tipos de evento
type EventType = "1d" | "2d" | "3d";

export default function ModifyEventScreen() {
  // 1. Obtenemos el param "id" para buscar la data
  const { id } = useLocalSearchParams<{ id?: string }>();

  // 2. Control de login (demo)
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // 3. Estado para la data original del evento
  const [originalEventData, setOriginalEventData] = useState<OwnerEventItem | null>(null);

  // 4. Campos del formulario (similares a CreateEventScreen)
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<EventType>("1d");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [artistInput, setArtistInput] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);

  // Ubicación
  const [showProvinces, setShowProvinces] = useState(false);
  const [showMunicipalities, setShowMunicipalities] = useState(false);
  const [showLocalities, setShowLocalities] = useState(false);
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [locality, setLocality] = useState("");
  const [address, setAddress] = useState("");
  const [isAfter, setIsAfter] = useState(false);
  const [isLGBT, setIsLGBT] = useState(false);
  const [eventDescription, setEventDescription] = useState("");

  // Fechas globales
  const [startDateTime, setStartDateTime] = useState<Date>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date>(new Date());

  // Entradas (por día). Si tu API solo maneja 1 set de entradas, ajusta.
  const [daysTickets, setDaysTickets] = useState<DayTickets[]>([createEmptyDayTickets()]);

  // Config venta
  const [startSaleDateTime, setStartSaleDateTime] = useState<Date>(new Date());
  const [earlyBirdsStock, setEarlyBirdsStock] = useState(false);
  const [useEarlyBirdsDate, setUseEarlyBirdsDate] = useState(false);
  const [earlyBirdsUntilDateTime, setEarlyBirdsUntilDateTime] = useState<Date>(new Date());

  // Multimedia
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [musicLink, setMusicLink] = useState("");

  // Términos y condiciones
  const [acceptedTC, setAcceptedTC] = useState(false);

  // 5. useEffect para cargar data original si existe “id”
  useEffect(() => {
    if (id) {
      const found = getOwnerEventById(Number(id));
      if (found) {
        setOriginalEventData(found);

        // Aquí ajusta cómo se “mapea” la data de found a tus estados:
        setEventName(found.eventName || "");
        // Si en tu OwnerEventItem hay un “eventType”: 
        // setEventType(found.eventType as EventType);

        // Si en tu OwnerEventItem hay “genres”: 
        // setSelectedGenres(found.genres || []);

        // Si en tu OwnerEventItem hay “artists”: 
        // setSelectedArtists(found.artists.map(aName => ({ name: aName, image: "" })));

        // Ubicación
        // setProvince(found.province || "");
        // setMunicipality(found.municipality || "");
        // setLocality(found.locality || "");
        // setAddress(found.address || "");
        // setIsAfter(found.isAfter || false);
        // setIsLGBT(found.isLGBT || false);
        // setEventDescription(found.description || "");

        // Fechas
        // if (found.startDateTime) setStartDateTime(new Date(found.startDateTime));
        // if (found.endDateTime) setEndDateTime(new Date(found.endDateTime));

        // Si tu OwnerEventItem maneja un array daysTickets con n días:
        // setDaysTickets(found.daysTickets || [createEmptyDayTickets()]);

        // Config de venta
        // if (found.startSaleDateTime) setStartSaleDateTime(new Date(found.startSaleDateTime));
        // setEarlyBirdsStock(found.earlyBirdsStock || false);
        // setUseEarlyBirdsDate(found.useEarlyBirdsDate || false);
        // if (found.earlyBirdsUntilDateTime) setEarlyBirdsUntilDateTime(new Date(found.earlyBirdsUntilDateTime));

        // Multimedia
        // if (found.photoFile) setPhotoFile(found.photoFile);
        // if (found.videoLink) setVideoLink(found.videoLink);
        // if (found.musicLink) setMusicLink(found.musicLink);
        // if (found.acceptedTC) setAcceptedTC(true);
      }
    }
  }, [id]);

  // 6. Manejadores

  // Cambiar tipo de evento
  function handleEventTypeChange(value: EventType) {
    setEventType(value);

    // Ajusta la cantidad de “daysTickets” según sea 1,2 o 3 días
    if (value === "1d") {
      setDaysTickets([createEmptyDayTickets()]);
    } else if (value === "2d") {
      setDaysTickets([createEmptyDayTickets(), createEmptyDayTickets()]);
    } else {
      setDaysTickets([
        createEmptyDayTickets(),
        createEmptyDayTickets(),
        createEmptyDayTickets(),
      ]);
    }
  }

  // Checkboxes: géneros
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  // Artistas
  const handleAddArtist = () => {
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
  };
  const handleRemoveArtist = (artistName: string) => {
    setSelectedArtists(selectedArtists.filter((a) => a.name !== artistName));
  };

  // Manejo de tickets
  const handleTicketChange = (
    dayIndex: number,
    field: keyof DayTickets,
    value: string
  ) => {
    setDaysTickets((prev) => {
      const newArr = [...prev];
      newArr[dayIndex] = {
        ...newArr[dayIndex],
        [field]: value,
      };
      return newArr;
    });
  };

  // Total
  const totalTickets = calcTotalTickets(daysTickets);

  // Seleccionar foto
  const handleSelectPhoto = () => {
    console.log("Seleccionar archivo presionado");
    setPhotoFile("ruta-de-la-imagen.jpg");
  };

  // Al enviar
  const handleSubmit = () => {
    // Validar foto obligatoria y T&C
    if (!photoFile) {
      alert("Debes seleccionar una foto obligatoria.");
      return;
    }
    if (!acceptedTC) {
      alert("Debes aceptar los términos y condiciones.");
      return;
    }

    // Construimos el objeto final
    const finalData = {
      originalEventId: originalEventData?.id,
      eventName,
      eventType,
      selectedGenres,
      selectedArtists,
      province,
      municipality,
      locality,
      address,
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
    console.log("Evento modificado (ejemplo):", finalData);
    alert("Evento modificado (ejemplo).");
  };

  // Demo logout
  const handleLogout = () => setIsLoggedIn(false);

  // Si no está logueado
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.notLoggedWrapper}>
          <Text>No estás logueado. Inicia sesión para editar un evento.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  // Render principal
  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ width: "100%" }}>
          <TitlePers text="Modificar Evento" />
          <View style={styles.divider} />

          {/* DEMO: botón para “cerrar sesión” */}
          <TouchableOpacity style={styles.demoButton} onPress={handleLogout}>
            <Text style={styles.demoButtonText}>Cerrar sesión (demo)</Text>
          </TouchableOpacity>

          {/* NOMBRE */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre del evento</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Fiesta Techno..."
              value={eventName}
              onChangeText={setEventName}
            />
          </View>

          {/* TIPO DE EVENTO */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tipo de evento</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => handleEventTypeChange("1d")}
              >
                <View style={styles.radioCircle}>
                  {eventType === "1d" && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioText}>1 día</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => handleEventTypeChange("2d")}
              >
                <View style={styles.radioCircle}>
                  {eventType === "2d" && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioText}>2 días</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => handleEventTypeChange("3d")}
              >
                <View style={styles.radioCircle}>
                  {eventType === "3d" && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioText}>3 días</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* GÉNEROS */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Género/s musical/es</Text>
            <View style={styles.genresContainer}>
              {mockGenres.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreChip,
                      isSelected && styles.genreChipSelected,
                    ]}
                    onPress={() => toggleGenre(genre)}
                  >
                    <Text
                      style={[
                        styles.genreChipText,
                        isSelected && styles.genreChipTextSelected,
                      ]}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ARTISTAS */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Artistas</Text>
            <View style={styles.artistRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Nombre del artista"
                value={artistInput}
                onChangeText={setArtistInput}
              />
              <TouchableOpacity
                style={styles.addArtistButton}
                onPress={handleAddArtist}
              >
                <Text style={styles.addArtistButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.addedArtistsContainer}>
              {selectedArtists.map((artist) => (
                <View key={artist.name} style={styles.artistTag}>
                  <Text style={styles.artistName}>{artist.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveArtist(artist.name)}
                  >
                    <Text style={styles.removeArtist}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* UBICACIÓN */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ubicación del evento</Text>

            <Text style={styles.subLabel}>Provincia</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowProvinces(!showProvinces)}
            >
              <Text style={styles.dropdownText}>
                {province || "Seleccione una provincia"}
              </Text>
            </TouchableOpacity>
            {showProvinces && (
              <View style={styles.dropdownContainer}>
                {mockProvinces.map((prov) => (
                  <TouchableOpacity
                    key={prov}
                    onPress={() => {
                      setProvince(prov);
                      setShowProvinces(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text>{prov}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.subLabel}>Municipio</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowMunicipalities(!showMunicipalities)}
            >
              <Text style={styles.dropdownText}>
                {municipality || "Seleccione un municipio"}
              </Text>
            </TouchableOpacity>
            {showMunicipalities && (
              <View style={styles.dropdownContainer}>
                {mockMunicipalities.map((mun) => (
                  <TouchableOpacity
                    key={mun}
                    onPress={() => {
                      setMunicipality(mun);
                      setShowMunicipalities(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text>{mun}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.subLabel}>Localidad</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowLocalities(!showLocalities)}
            >
              <Text style={styles.dropdownText}>
                {locality || "Seleccione una localidad"}
              </Text>
            </TouchableOpacity>
            {showLocalities && (
              <View style={styles.dropdownContainer}>
                {mockLocalities.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => {
                      setLocality(loc);
                      setShowLocalities(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.subLabel}>Dirección</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Av. Corrientes 1234"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setIsAfter(!isAfter)}
              >
                {isAfter && <View style={styles.checkboxSelected} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 4 }}>¿Es after?</Text>
            </View>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setIsLGBT(!isLGBT)}
              >
                {isLGBT && <View style={styles.checkboxSelected} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 4 }}>¿Es un evento LGBT?</Text>
            </View>
          </View>

          {/* DESCRIPCIÓN */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.multiLineInput]}
              multiline
              placeholder="Describe aquí el evento..."
              value={eventDescription}
              onChangeText={setEventDescription}
            />
          </View>

          {/* FECHAS GLOBALES */}
          <View style={styles.formGroup}>
            <DateTimeInputComponent
              label="Fecha y hora de inicio del evento:"
              value={startDateTime}
              onChange={setStartDateTime}
            />
            <DateTimeInputComponent
              label="Fecha y hora de finalización del evento:"
              value={endDateTime}
              onChange={setEndDateTime}
            />
          </View>

          {/* ENTRADAS (por día) */}
          <Text style={styles.sectionTitle}>Entradas (por día)</Text>
          <Text style={styles.infoText}>
            Cantidad total de entradas: {totalTickets}
          </Text>

          {daysTickets.map((day, dayIndex) => (
            <View key={dayIndex} style={styles.dayBlock}>
              <Text style={styles.dayBlockTitle}>
                {eventType === "1d"
                  ? "Día único"
                  : `Día ${dayIndex + 1} de ${
                      eventType === "2d" ? "2" : "3"
                    }:`}
              </Text>

              {/* Generales Early Birds */}
              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>
                  Entradas generales - Early Birds:
                </Text>
                <View style={styles.ticketInputs}>
                  <Text>Cant.:</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="numeric"
                    value={day.genEarlyQty}
                    onChangeText={(val) =>
                      handleTicketChange(dayIndex, "genEarlyQty", val)
                    }
                    placeholder="0"
                  />
                  <Text>Precio:</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="numeric"
                    value={day.genEarlyPrice}
                    onChangeText={(val) =>
                      handleTicketChange(dayIndex, "genEarlyPrice", val)
                    }
                    placeholder="$"
                  />
                </View>
              </View>

              {/* VIP Early Birds */}
              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>
                  Entradas VIP - Early Birds:
                </Text>
                <View style={styles.ticketInputs}>
                  <Text>Cant.:</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="numeric"
                    value={day.vipEarlyQty}
                    onChangeText={(val) =>
                      handleTicketChange(dayIndex, "vipEarlyQty", val)
                    }
                    placeholder="0"
                  />
                  <Text>Precio:</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="numeric"
                    value={day.vipEarlyPrice}
                    onChangeText={(val) =>
                      handleTicketChange(dayIndex, "vipEarlyPrice", val)
                    }
                    placeholder="$"
                  />
                </View>
              </View>

              {/* Generales (no early) */}
              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Entradas generales:</Text>
                <View style={styles.ticketInputs}>
                  <Text>Cant.:</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="numeric"
                    value={day.genQty}
                    onChangeText={(val) =>
                      handleTicketChange(dayIndex, "genQty", val)
                    }
                    placeholder="0"
                  />
                  <Text>Precio:</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="numeric"
                    value={day.genPrice}
                    onChangeText={(val) =>
                      handleTicketChange(dayIndex, "genPrice", val)
                    }
                    placeholder="$"
                  />
                </View>
              </View>

              {/* VIP (no early) */}
              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Entradas VIP:</Text>
                <View style={styles.ticketInputs}>
                  <Text>Cant.:</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="numeric"
                    value={day.vipQty}
                    onChangeText={(val) =>
                      handleTicketChange(dayIndex, "vipQty", val)
                    }
                    placeholder="0"
                  />
                  <Text>Precio:</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="numeric"
                    value={day.vipPrice}
                    onChangeText={(val) =>
                      handleTicketChange(dayIndex, "vipPrice", val)
                    }
                    placeholder="$"
                  />
                </View>
              </View>
            </View>
          ))}

          {/* CONFIG ENTRADAS */}
          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>Configuración de entradas</Text>
            <DateTimeInputComponent
              label="Inicio de venta de entradas:"
              value={startSaleDateTime}
              onChange={setStartSaleDateTime}
            />

            <Text style={styles.subLabel}>Vender Early Birds hasta:</Text>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setEarlyBirdsStock(!earlyBirdsStock)}
              >
                {earlyBirdsStock && <View style={styles.checkboxSelected} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 4 }}>Agotar stock</Text>
            </View>

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setUseEarlyBirdsDate(!useEarlyBirdsDate)}
              >
                {useEarlyBirdsDate && <View style={styles.checkboxSelected} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 4 }}>Fecha y hora</Text>
            </View>
            {useEarlyBirdsDate && (
              <DateTimeInputComponent
                label=""
                value={earlyBirdsUntilDateTime}
                onChange={setEarlyBirdsUntilDateTime}
              />
            )}
          </View>

          {/* MULTIMEDIA */}
          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>Multimedia</Text>
            <Text style={styles.label}>
              Foto: <Text style={{ color: COLORS.negative }}>(Obligatoria)</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectFileButton}
              onPress={handleSelectPhoto}
            >
              <Text style={styles.selectFileButtonText}>
                {photoFile ? "Cambiar foto" : "Seleccionar archivo"}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 12 }]}>
              Agregar video: (Opcional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Link de Youtube..."
              value={videoLink}
              onChangeText={setVideoLink}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>
              Agregar música: (Opcional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Link de Spotify o SoundCloud..."
              value={musicLink}
              onChangeText={setMusicLink}
            />
          </View>

          {/* TÉRMINOS Y CONDICIONES */}
          <View style={styles.formGroup}>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAcceptedTC(!acceptedTC)}
              >
                {acceptedTC && <View style={styles.checkboxSelected} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 4 }}>
                Acepto{" "}
                <Text style={{ color: COLORS.info }}>
                  términos y condiciones
                </Text>
              </Text>
            </View>
          </View>

          {/* BOTÓN FINAL */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Modificar Evento</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  notLoggedWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPrimary,
    width: "100%",
    marginVertical: 12,
  },
  demoButton: {
    marginTop: 16,
    backgroundColor: COLORS.borderInput,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.card,
    alignSelf: "center",
    marginBottom: 20,
  },
  demoButtonText: {
    color: COLORS.textSecondary,
  },

  // Form group
  formGroup: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    width: "90%",
    fontWeight: "bold",
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    marginBottom: 6,
  },
  subLabel: {
    width: "90%",
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    marginBottom: 4,
  },
  input: {
    width: "90%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  multiLineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Botones
  button: {
    width: "80%",
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    alignItems: "center",
    marginVertical: 8,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
  },
  registerButton: {
    backgroundColor: COLORS.negative,
  },

  // Radio
  radioGroup: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textPrimary,
  },
  radioText: {
    color: COLORS.textPrimary,
  },

  // Géneros
  genresContainer: {
    width: "90%",
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  genreChip: {
    backgroundColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  genreChipSelected: {
    backgroundColor: COLORS.primary,
  },
  genreChipText: {
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  genreChipTextSelected: {
    color: COLORS.cardBg,
  },

  // Artistas
  artistRow: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
  },
  addArtistButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    marginLeft: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addArtistButtonText: {
    color: COLORS.cardBg,
    fontSize: 18,
    fontWeight: "bold",
  },
  addedArtistsContainer: {
    width: "90%",
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  artistTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.borderInput,
    padding: 6,
    borderRadius: RADIUS.card,
    marginRight: 8,
    marginBottom: 8,
  },
  artistName: {
    marginRight: 4,
    color: COLORS.textPrimary,
  },
  removeArtist: {
    color: COLORS.negative,
    fontWeight: "bold",
  },

  // Dropdown
  dropdownButton: {
    width: "90%",
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    justifyContent: "center",
  },
  dropdownText: {
    color: COLORS.textPrimary,
  },
  dropdownContainer: {
    width: "90%",
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    marginBottom: 8,
    alignSelf: "center",
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  // Checkboxes
  checkboxRow: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.textPrimary,
  },

  // Entradas por día
  dayBlock: {
    width: "90%",
    backgroundColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 10,
    marginBottom: 12,
    alignSelf: "center",
  },
  dayBlockTitle: {
    fontWeight: "bold",
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  ticketRow: {
    marginTop: 8,
  },
  ticketLabel: {
    fontWeight: "600",
    marginBottom: 4,
    color: COLORS.textPrimary,
  },
  ticketInputs: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  smallInput: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    marginHorizontal: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
    textAlign: "center",
    color: COLORS.textPrimary,
  },

  // Título de sección
  sectionTitle: {
    width: "90%",
    fontWeight: "bold",
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
    alignSelf: "center",
  },
  infoText: {
    color: COLORS.textSecondary,
    marginBottom: 8,
    alignSelf: "center",
  },

  // Botón de seleccionar archivo (foto)
  selectFileButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  selectFileButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
  },

  // Botón final
  submitButton: {
    backgroundColor: COLORS.primary,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    alignItems: "center",
    width: "80%",
    alignSelf: "center",
    marginBottom: 30,
  },
  submitButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },
});
