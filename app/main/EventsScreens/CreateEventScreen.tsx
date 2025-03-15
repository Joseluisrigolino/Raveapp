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
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import TitlePers from "@/components/TitleComponent";
import DateTimeInputComponent from "@/components/DateTimeInputComponent";

import { Artist } from "@/interfaces/Artist";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/** Representa los campos de entradas para un día */
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

/** Crea un "DayTickets" vacío (valores por defecto) */
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

/** Calcula la suma total de entradas de un array de DayTickets */
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

// Simulados
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

const fakeArtistDatabase: Artist[] = [
  { name: "Artista 1", image: "" },
  { name: "Artista 2", image: "" },
  { name: "Artista 3", image: "" },
];

const mockProvinces = ["Buenos Aires", "Córdoba", "Mendoza"];
const mockMunicipalities = ["Municipio 1", "Municipio 2"];
const mockLocalities = ["Localidad 1", "Localidad 2"];

/** Tipos de evento: 1d, 2d, 3d */
type EventType = "1d" | "2d" | "3d";

export default function CreateEventScreen() {
  // Demo: control login
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Manejo del tipo de evento
  const [eventType, setEventType] = useState<EventType>("1d");
  function handleEventTypeChange(value: "1d" | "2d" | "3d") {
    setEventType(value);
  }

  // Campos básicos
  const [eventName, setEventName] = useState("");
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

  // Para entradas: array de DayTickets, 1 por día
  const [daysTickets, setDaysTickets] = useState<DayTickets[]>([
    createEmptyDayTickets(),
  ]);

  // Configuración de venta
  const [startSaleDateTime, setStartSaleDateTime] = useState<Date>(new Date());
  const [earlyBirdsStock, setEarlyBirdsStock] = useState(false);
  const [useEarlyBirdsDate, setUseEarlyBirdsDate] = useState(false);
  const [earlyBirdsUntilDateTime, setEarlyBirdsUntilDateTime] =
    useState<Date>(new Date());

  // Multimedia
  const [photoFile, setPhotoFile] = useState<string | null>(null); // "ruta.jpg" o null
  const [videoLink, setVideoLink] = useState("");
  const [musicLink, setMusicLink] = useState("");

  // Términos y condiciones
  const [acceptedTC, setAcceptedTC] = useState(false);

  // Demo: login
  const handleLogin = () => console.log("Iniciar sesión presionado");
  const handleRegister = () => console.log("Registrarme presionado");
  const handleGoogleLogin = () => console.log("Login with Google presionado");
  const simulateLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  // Ajustar daysTickets según eventType
  useEffect(() => {
    if (eventType === "1d") {
      setDaysTickets([createEmptyDayTickets()]);
    } else if (eventType === "2d") {
      setDaysTickets([createEmptyDayTickets(), createEmptyDayTickets()]);
    } else {
      // 3d
      setDaysTickets([
        createEmptyDayTickets(),
        createEmptyDayTickets(),
        createEmptyDayTickets(),
      ]);
    }
  }, [eventType]);

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
      // Creamos un "artista" local
      const newArtist: Artist = { name: trimmedName, image: "" };
      setSelectedArtists((prev) => [...prev, newArtist]);
    }
    setArtistInput("");
  };
  const handleRemoveArtist = (artistName: string) => {
    setSelectedArtists(selectedArtists.filter((a) => a.name !== artistName));
  };

  // Manejo de inputs de tickets
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

  // Calcular total
  const totalTickets = calcTotalTickets(daysTickets);

  // Seleccionar foto (demo)
  const handleSelectPhoto = () => {
    console.log("Seleccionar archivo presionado");
    setPhotoFile("ruta-de-la-imagen.jpg");
  };

  // Enviar
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

    // Armar objeto final
    const finalData = {
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
    console.log("Enviando evento:", finalData);
    alert("Evento creado (ejemplo)");
  };

  // Render
  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!isLoggedIn ? (
          // NO LOGUEADO
          <View style={styles.notLoggedContainer}>
            <TitlePers text="Crear Evento" />
            <View style={styles.divider} />

            <Text style={styles.subtitle}>
              Para crear un evento, primero debes iniciar sesión o registrarte.
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.registerButton]}
              onPress={handleRegister}
            >
              <Text style={styles.buttonText}>Registrarme</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={handleGoogleLogin}
            >
              <View style={styles.googleButtonContent}>
                <MaterialCommunityIcons
                  name="google"
                  size={20}
                  color={COLORS.info}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.googleButtonText}>Login with Google</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoButton} onPress={simulateLogin}>
              <Text style={styles.demoButtonText}>[Simular login exitoso]</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // SÍ LOGUEADO
          <View style={{ width: "100%" }}>
            <TitlePers text="Crear Evento" />
            <View style={styles.divider} />

            <TouchableOpacity style={styles.demoButton} onPress={handleLogout}>
              <Text style={styles.demoButtonText}>Cerrar sesión (demo)</Text>
            </TouchableOpacity>

            {/* Nombre */}
            <Text style={styles.label}>Nombre del evento:</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del evento"
              value={eventName}
              onChangeText={setEventName}
            />

            {/* Tipo de evento */}
            <Text style={styles.label}>Tipo de evento:</Text>
            <View style={styles.radioGroup}>
              <View style={styles.radioOption}>
                <TouchableOpacity
                  style={styles.radioCircle}
                  onPress={() => handleEventTypeChange("1d")}
                >
                  {eventType === "1d" && <View style={styles.radioSelected} />}
                </TouchableOpacity>
                <Text>Evento común de 1 día.</Text>
              </View>

              <View style={styles.radioOption}>
                <TouchableOpacity
                  style={styles.radioCircle}
                  onPress={() => handleEventTypeChange("2d")}
                >
                  {eventType === "2d" && <View style={styles.radioSelected} />}
                </TouchableOpacity>
                <Text>Evento/festival de 2 días.</Text>
              </View>

              <View style={styles.radioOption}>
                <TouchableOpacity
                  style={styles.radioCircle}
                  onPress={() => handleEventTypeChange("3d")}
                >
                  {eventType === "3d" && <View style={styles.radioSelected} />}
                </TouchableOpacity>
                <Text>Evento/festival de 3 días.</Text>
              </View>
            </View>

            {/* Géneros */}
            <Text style={styles.label}>Género/s musical/es:</Text>
            <View style={styles.checkboxContainer}>
              {mockGenres.map((genre) => (
                <View key={genre} style={styles.checkboxItem}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => toggleGenre(genre)}
                  >
                    {selectedGenres.includes(genre) && (
                      <View style={styles.checkboxSelected} />
                    )}
                  </TouchableOpacity>
                  <Text>{genre}</Text>
                </View>
              ))}
            </View>

            {/* Artistas */}
            <Text style={styles.label}>Artista/s:</Text>
            <View style={styles.artistInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Escribe el nombre del artista"
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

            {/* Ubicación */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Ubicación del evento:
            </Text>
            <Text style={styles.label}>Provincia:</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowProvinces(!showProvinces)}
            >
              <Text>{province || "Seleccione una provincia"}</Text>
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

            <Text style={styles.label}>Municipio:</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowMunicipalities(!showMunicipalities)}
            >
              <Text>{municipality || "Seleccione un municipio"}</Text>
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

            <Text style={styles.label}>Localidad:</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowLocalities(!showLocalities)}
            >
              <Text>{locality || "Seleccione una localidad"}</Text>
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

            <Text style={styles.label}>Dirección:</Text>
            <TextInput
              style={styles.input}
              placeholder="Dirección del evento"
              value={address}
              onChangeText={setAddress}
            />

            {/* Checkboxes after / LGBT */}
            <View style={[styles.checkboxItem, { width: 300, marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setIsAfter(!isAfter)}
              >
                {isAfter && <View style={styles.checkboxSelected} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 4 }}>¿Es after?</Text>
            </View>

            <View style={[styles.checkboxItem, { width: 300, marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setIsLGBT(!isLGBT)}
              >
                {isLGBT && <View style={styles.checkboxSelected} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 4 }}>¿Es un evento LGBT?</Text>
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>
              Descripción del evento:
            </Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              multiline
              placeholder="Describe aquí el evento..."
              value={eventDescription}
              onChangeText={setEventDescription}
            />

            {/* FECHAS GLOBALES */}
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

            {/* ENTRADAS POR DÍA */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Entradas (por día):
            </Text>
            <Text style={{ marginBottom: 8 }}>
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
                    <Text>Cantidad:</Text>
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
                    <Text>Cantidad:</Text>
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
                    <Text>Cantidad:</Text>
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
                    <Text>Cantidad:</Text>
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

            {/* Configuración entradas */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Configuración de entradas:
            </Text>
            <DateTimeInputComponent
              label="Inicio de venta de entradas:"
              value={startSaleDateTime}
              onChange={setStartSaleDateTime}
            />

            <Text style={styles.label}>Vender Early Birds hasta:</Text>
            <View style={[styles.checkboxItem, { width: 300 }]}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setEarlyBirdsStock(!earlyBirdsStock)}
              >
                {earlyBirdsStock && <View style={styles.checkboxSelected} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 4 }}>Agotar stock</Text>
            </View>

            <View style={[styles.checkboxItem, { width: 300 }]}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setUseEarlyBirdsDate(!useEarlyBirdsDate)}
              >
                {useEarlyBirdsDate && <View style={styles.checkboxSelected} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 4 }}>Fecha y hora:</Text>
            </View>
            {useEarlyBirdsDate && (
              <DateTimeInputComponent
                label=""
                value={earlyBirdsUntilDateTime}
                onChange={setEarlyBirdsUntilDateTime}
              />
            )}

            {/* MULTIMEDIA - MOVERLO AQUÍ, ANTES DE T&C Y BOTÓN FINAL */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Multimedia:
            </Text>
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
              placeholder="Pega el link de Youtube aquí"
              value={videoLink}
              onChangeText={setVideoLink}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>
              Agregar música: (Opcional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Pega el link de Spotify o SoundCloud aquí"
              value={musicLink}
              onChangeText={setMusicLink}
            />

            {/* Términos y condiciones */}
            <View style={styles.termsRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAcceptedTC(!acceptedTC)}
              >
                {acceptedTC && <View style={styles.checkboxSelected} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 4 }}>
                Acepto{" "}
                <Text style={{ color: COLORS.info }}>términos y condiciones</Text>
              </Text>
            </View>

            {/* Botón final */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Crear Evento</Text>
            </TouchableOpacity>
          </View>
        )}
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
  scrollContent: {
    padding: 16,
    alignItems: "center",
  },
  notLoggedContainer: {
    width: "100%",
    alignItems: "center",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPrimary,
    width: "100%",
    marginVertical: 8,
  },
  subtitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginVertical: 12,
  },
  button: {
    width: "70%",
    paddingVertical: 12,
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
  googleButton: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  googleButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
  buttonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
  },
  demoButton: {
    marginTop: 16,
    backgroundColor: COLORS.borderInput,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.card,
    alignSelf: "center",
  },
  demoButtonText: {
    color: COLORS.textSecondary,
  },
  label: {
    marginTop: 12,
    fontWeight: "bold",
    width: 300,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 4,
    width: 300,
  },
  radioGroup: {
    marginTop: 8,
    marginBottom: 8,
    width: 300,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textPrimary,
  },
  checkboxContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    width: 300,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "45%",
    marginBottom: 8,
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
  artistInputRow: {
    flexDirection: "row",
    marginTop: 4,
    width: 300,
  },
  addArtistButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: 4,
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addArtistButtonText: {
    color: COLORS.cardBg,
    fontSize: 18,
    fontWeight: "bold",
  },
  addedArtistsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    width: 300,
  },
  artistTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.borderInput,
    padding: 6,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  artistName: {
    marginRight: 4,
  },
  removeArtist: {
    color: COLORS.negative,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: FONT_SIZES.subTitle,
    width: 300,
    marginTop: 12,
    color: COLORS.textPrimary,
  },
  dropdownButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: 4,
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: 300,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: 4,
    backgroundColor: COLORS.cardBg,
    width: 300,
    marginBottom: 4,
  },
  dropdownItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  // Bloque de entradas por día
  dayBlock: {
    backgroundColor: COLORS.borderInput, // un gris clarito
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  dayBlockTitle: {
    fontWeight: "bold",
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  ticketRow: {
    width: "100%",
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
    borderRadius: 4,
    marginHorizontal: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
    textAlign: "center",
  },
  selectFileButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  selectFileButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
  },
  termsRow: {
    flexDirection: "row",
    width: 300,
    marginTop: 16,
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
    width: 200,
    alignSelf: "center",
  },
  submitButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
  },
});
