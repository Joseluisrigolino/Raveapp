// app/main/CreateEventScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TitlePers from "@/components/common/TitleComponent";
import DateTimeInputComponent from "@/components/common/DateTimeInputComponent";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { ELECTRONIC_GENRES } from "@/utils/electronicGenresHelper";
import { Artist } from "@/interfaces/Artist";
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
} from "@/utils/georef/georefHelpers";
import { useAuth } from "@/context/AuthContext";

// Tipos
interface DayTickets {
  genEarlyQty: string;
  genEarlyPrice: string;
  vipEarlyQty: string;
  vipEarlyPrice: string;
  genQty: string;
  genPrice: string;
  vipQty: string;
  vipPrice: string;
}
type EventType = "1d" | "2d" | "3d";

// Utilidades
const createEmptyDayTickets = (): DayTickets => ({
  genEarlyQty: "",
  genEarlyPrice: "",
  vipEarlyQty: "",
  vipEarlyPrice: "",
  genQty: "",
  genPrice: "",
  vipQty: "",
  vipPrice: "",
});
const calcTotalTickets = (daysTickets: DayTickets[]): number =>
  daysTickets.reduce((sum, d) => {
    const ge = parseInt(d.genEarlyQty, 10) || 0;
    const ve = parseInt(d.vipEarlyQty, 10) || 0;
    const g = parseInt(d.genQty, 10) || 0;
    const v = parseInt(d.vipQty, 10) || 0;
    return sum + ge + ve + g + v;
  }, 0);

const fakeArtistDB: Artist[] = [
  { name: "Artista 1", image: "" },
  { name: "Artista 2", image: "" },
  { name: "Artista 3", image: "" },
];

export default function CreateEventScreen() {
  // Contexto de usuario
  const { user } = useAuth();
  const mustShowLogin = !user || user.role === "guest";

  // --- Login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const handleLogin = () => console.log("Iniciar sesión");
  const handleRegister = () => console.log("Registrarme");
  const handleGoogleLogin = () => console.log("Login con Google");
  const simulateLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  // --- Campos básicos
  const [eventType, setEventType] = useState<EventType>("1d");
  const [eventName, setEventName] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // --- Artistas
  const [artistInput, setArtistInput] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);

  // --- Ubicación
  const [provinces, setProvinces] = useState<{ id: string; nombre: string }[]>(
    []
  );
  const [municipalities, setMunicipalities] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [localities, setLocalities] = useState<
    { id: string; nombre: string }[]
  >([]);
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

  // --- Checkboxes
  const [isAfter, setIsAfter] = useState(false);
  const [isLGBT, setIsLGBT] = useState(false);

  // --- Descripción
  const [eventDescription, setEventDescription] = useState("");

  // --- Fechas globales
  const [startDateTime, setStartDateTime] = useState<Date>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date>(new Date());

  // --- Tickets
  const [daysTickets, setDaysTickets] = useState<DayTickets[]>([
    createEmptyDayTickets(),
  ]);

  // --- Config venta
  const [startSaleDateTime, setStartSaleDateTime] = useState<Date>(new Date());
  const [earlyBirdsStock, setEarlyBirdsStock] = useState(false);
  const [useEarlyBirdsDate, setUseEarlyBirdsDate] = useState(false);
  const [earlyBirdsUntilDateTime, setEarlyBirdsUntilDateTime] = useState<Date>(
    new Date()
  );

  // --- Multimedia
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [musicLink, setMusicLink] = useState("");

  // --- Términos
  const [acceptedTC, setAcceptedTC] = useState(false);

  // Efectos
  useEffect(() => {
    // Ajusta número de días según tipo
    const count = eventType === "1d" ? 1 : eventType === "2d" ? 2 : 3;
    setDaysTickets(Array.from({ length: count }, createEmptyDayTickets));
  }, [eventType]);

  useEffect(() => {
    fetchProvinces()
      .then(setProvinces)
      .catch((err) => console.error("Error fetchProvinces:", err));
  }, []);

  // Handlers ubicación
  const handleSelectProvince = async (id: string, name: string) => {
    setProvinceId(id);
    setProvinceName(name);
    setMunicipalityId("");
    setMunicipalityName("");
    setLocalityId("");
    setLocalityName("");
    setMunicipalities([]);
    setLocalities([]);
    setShowProvinces(false);
    try {
      const mun = await fetchMunicipalities(id);
      setMunicipalities(mun);
    } catch (e) {
      console.error(e);
    }
  };
  const handleSelectMunicipality = async (id: string, name: string) => {
    setMunicipalityId(id);
    setMunicipalityName(name);
    setLocalityId("");
    setLocalityName("");
    setLocalities([]);
    setShowMunicipalities(false);
    try {
      const loc = await fetchLocalities(provinceId, id);
      setLocalities(loc);
    } catch (e) {
      console.error(e);
    }
  };
  const handleSelectLocality = (id: string, name: string) => {
    setLocalityId(id);
    setLocalityName(name);
    setShowLocalities(false);
  };

  // Handlers géneros/artistas/tickets
  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };
  const handleAddArtist = () => {
    const name = artistInput.trim();
    if (!name) return;
    const found = fakeArtistDB.find(
      (x) => x.name.toLowerCase() === name.toLowerCase()
    );
    const art = found || { name, image: "" };
    setSelectedArtists((prev) => [...prev, art]);
    setArtistInput("");
  };
  const handleRemoveArtist = (name: string) => {
    setSelectedArtists((prev) => prev.filter((x) => x.name !== name));
  };
  const handleTicketChange = (
    i: number,
    field: keyof DayTickets,
    val: string
  ) => {
    setDaysTickets((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: val };
      return copy;
    });
  };

  const totalTickets = calcTotalTickets(daysTickets);

  // Multimedia
  const handleSelectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Necesitamos permiso galería");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!res.canceled && res.assets.length) setPhotoFile(res.assets[0].uri);
  };

  // Submit
  const handleSubmit = () => {
    if (!photoFile) {
      Alert.alert("Foto obligatoria", "Selecciona una foto");
      return;
    }
    if (!acceptedTC) {
      Alert.alert("Términos", "Debes aceptar términos");
      return;
    }
    const data = {
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
      startDateTime,
      endDateTime,
      daysTickets,
      startSaleDateTime,
      earlyBirdsStock,
      useEarlyBirdsDate,
      earlyBirdsUntilDateTime,
      photoFile,
      videoLink,
      musicLink,
      totalTickets,
      acceptedTC,
    };
    console.log("Evento creado:", data);
    Alert.alert("Éxito", "Evento creado");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {mustShowLogin ? (
          <View style={styles.notLoggedContainer}>
            <TitlePers text="Crear Evento" />
            <View style={styles.divider} />
            <Text style={styles.subtitle}>
              Para crear un evento debes iniciar sesión.
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
                <Text style={styles.googleButtonText}>Login con Google</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoButton} onPress={simulateLogin}>
              <Text style={styles.demoButtonText}>[Simular login]</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: "100%" }}>
            <TitlePers text="Crear Evento" />
            <View style={styles.divider} />
            {/* Nombre */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre del evento</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Fiesta..."
                value={eventName}
                onChangeText={setEventName}
              />
            </View>
            {/* Tipo */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo de evento</Text>
              <View style={styles.radioGroup}>
                {(["1d", "2d", "3d"] as EventType[]).map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={styles.radioOption}
                    onPress={() => setEventType(v)}
                  >
                    <View style={styles.radioCircle}>
                      {eventType === v && <View style={styles.radioSelected} />}
                    </View>
                    <Text style={styles.radioText}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* Géneros */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Género/s musical/es</Text>
              <View style={styles.genresContainer}>
                {ELECTRONIC_GENRES.map((g) => {
                  const sel = selectedGenres.includes(g);
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genreChip,
                        sel && styles.genreChipSelected,
                      ]}
                      onPress={() => toggleGenre(g)}
                    >
                      <Text
                        style={[
                          styles.genreChipText,
                          sel && styles.genreChipTextSelected,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {/* Artistas */}
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
                {selectedArtists.map((a) => (
                  <View key={a.name} style={styles.artistTag}>
                    <Text style={styles.artistName}>{a.name}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveArtist(a.name)}
                    >
                      <Text style={styles.removeArtist}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
            {/* Ubicación */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ubicación del evento</Text>
              <Text style={styles.subLabel}>Provincia</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowProvinces(!showProvinces);
                  setShowMunicipalities(false);
                  setShowLocalities(false);
                }}
              >
                <Text style={styles.dropdownText}>
                  {provinceName || "Seleccione provincia"}
                </Text>
              </TouchableOpacity>
              {showProvinces && (
                <View style={styles.dropdownContainer}>
                  {provinces.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectProvince(p.id, p.nombre)}
                    >
                      <Text>{p.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={styles.subLabel}>Municipio</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                disabled={!provinceId}
                onPress={() => {
                  setShowMunicipalities(!showMunicipalities);
                  setShowProvinces(false);
                  setShowLocalities(false);
                }}
              >
                <Text
                  style={[styles.dropdownText, !provinceId && { opacity: 0.5 }]}
                >
                  {municipalityName || "Seleccione municipio"}
                </Text>
              </TouchableOpacity>
              {showMunicipalities && (
                <View style={styles.dropdownContainer}>
                  {municipalities.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectMunicipality(m.id, m.nombre)}
                    >
                      <Text>{m.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={styles.subLabel}>Localidad</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                disabled={!municipalityId}
                onPress={() => {
                  setShowLocalities(!showLocalities);
                  setShowProvinces(false);
                  setShowMunicipalities(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !municipalityId && { opacity: 0.5 },
                  ]}
                >
                  {localityName || "Seleccione localidad"}
                </Text>
              </TouchableOpacity>
              {showLocalities && (
                <View style={styles.dropdownContainer}>
                  {localities.map((l) => (
                    <TouchableOpacity
                      key={l.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectLocality(l.id, l.nombre)}
                    >
                      <Text>{l.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={styles.subLabel}>Calle</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Av. Corrientes"
                value={street}
                onChangeText={setStreet}
              />
              <Text style={styles.subLabel}>Número</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 1234"
                value={streetNumber}
                onChangeText={setStreetNumber}
                keyboardType="numeric"
              />
            </View>
            {/* After/LGBT */}
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
            {/* Descripción */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.multiLineInput]}
                multiline
                placeholder="Describe el evento"
                value={eventDescription}
                onChangeText={setEventDescription}
              />
            </View>
            {/* Fechas globales */}
            <View style={styles.formGroup}>
              <DateTimeInputComponent
                label="Fecha inicio"
                value={startDateTime}
                onChange={setStartDateTime}
              />
              <DateTimeInputComponent
                label="Fecha fin"
                value={endDateTime}
                onChange={setEndDateTime}
              />
            </View>
            {/* Entradas por día */}
            <Text style={styles.sectionTitle}>Entradas (por día)</Text>
            <Text style={styles.infoText}>Total entradas: {totalTickets}</Text>
            {daysTickets.map((day, i) => (
              <View key={i} style={styles.dayBlock}>
                <Text style={styles.dayBlockTitle}>
                  {eventType === "1d"
                    ? "Día único"
                    : `Día ${i + 1} de ${eventType === "2d" ? 2 : 3}`}
                </Text>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Gen Early Birds:</Text>
                  <View style={styles.ticketInputs}>
                    <Text>Cant.:</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={day.genEarlyQty}
                      onChangeText={(v) =>
                        handleTicketChange(i, "genEarlyQty", v)
                      }
                      placeholder="0"
                    />
                    <Text>Precio:</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={day.genEarlyPrice}
                      onChangeText={(v) =>
                        handleTicketChange(i, "genEarlyPrice", v)
                      }
                      placeholder="$"
                    />
                  </View>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>VIP Early Birds:</Text>
                  <View style={styles.ticketInputs}>
                    <Text>Cant.:</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={day.vipEarlyQty}
                      onChangeText={(v) =>
                        handleTicketChange(i, "vipEarlyQty", v)
                      }
                      placeholder="0"
                    />
                    <Text>Precio:</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={day.vipEarlyPrice}
                      onChangeText={(v) =>
                        handleTicketChange(i, "vipEarlyPrice", v)
                      }
                      placeholder="$"
                    />
                  </View>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Gen:</Text>
                  <View style={styles.ticketInputs}>
                    <Text>Cant.:</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={day.genQty}
                      onChangeText={(v) => handleTicketChange(i, "genQty", v)}
                      placeholder="0"
                    />
                    <Text>Precio:</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={day.genPrice}
                      onChangeText={(v) => handleTicketChange(i, "genPrice", v)}
                      placeholder="$"
                    />
                  </View>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>VIP:</Text>
                  <View style={styles.ticketInputs}>
                    <Text>Cant.:</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={day.vipQty}
                      onChangeText={(v) => handleTicketChange(i, "vipQty", v)}
                      placeholder="0"
                    />
                    <Text>Precio:</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="numeric"
                      value={day.vipPrice}
                      onChangeText={(v) => handleTicketChange(i, "vipPrice", v)}
                      placeholder="$"
                    />
                  </View>
                </View>
              </View>
            ))}
            {/* Config entradas */}
            <View style={styles.formGroup}>
              <Text style={styles.sectionTitle}>Config. Entradas</Text>
              <DateTimeInputComponent
                label="Inicio venta"
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
                  {useEarlyBirdsDate && (
                    <View style={styles.checkboxSelected} />
                  )}
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
            {/* Multimedia */}
            <View style={styles.formGroup}>
              <Text style={styles.sectionTitle}>Multimedia</Text>
              <Text style={styles.label}>
                Foto:{" "}
                <Text style={{ color: COLORS.negative }}>(Obligatoria)</Text>
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
                Video (Opcional)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Link YouTube..."
                value={videoLink}
                onChangeText={setVideoLink}
              />
              <Text style={[styles.label, { marginTop: 12 }]}>
                Música (Opcional)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Link Spotify/SoundCloud..."
                value={musicLink}
                onChangeText={setMusicLink}
              />
            </View>
            {/* T&C */}
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
            {/* Submit */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Crear Evento</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

// Estilos completos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollContent: { padding: 16 },
  notLoggedContainer: { width: "100%", alignItems: "center", marginTop: 24 },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPrimary,
    width: "100%",
    marginVertical: 12,
  },
  subtitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginVertical: 12,
  },
  button: {
    width: "80%",
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    alignItems: "center",
    marginVertical: 8,
  },
  loginButton: { backgroundColor: COLORS.primary },
  registerButton: { backgroundColor: COLORS.negative },
  googleButton: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  googleButtonContent: { flexDirection: "row", alignItems: "center" },
  googleButtonText: { color: COLORS.textPrimary, fontWeight: "bold" },
  buttonText: { color: COLORS.cardBg, fontWeight: "bold" },
  demoButton: {
    marginTop: 16,
    backgroundColor: COLORS.borderInput,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.card,
    alignSelf: "center",
  },
  demoButtonText: { color: COLORS.textSecondary },
  formGroup: { marginBottom: 16, width: "100%", alignItems: "center" },
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
  multiLineInput: { minHeight: 80, textAlignVertical: "top" },
  radioGroup: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  radioOption: { flexDirection: "row", alignItems: "center" },
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
  radioText: { color: COLORS.textPrimary },
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
  genreChipSelected: { backgroundColor: COLORS.primary },
  genreChipText: { color: COLORS.textPrimary, fontWeight: "500" },
  genreChipTextSelected: { color: COLORS.cardBg },
  artistRow: { width: "90%", flexDirection: "row", alignItems: "center" },
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
  artistName: { marginRight: 4, color: COLORS.textPrimary },
  removeArtist: { color: COLORS.negative, fontWeight: "bold" },
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
  dropdownText: { color: COLORS.textPrimary },
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
  ticketRow: { marginTop: 8 },
  ticketLabel: {
    fontWeight: "600",
    marginBottom: 4,
    color: COLORS.textPrimary,
  },
  ticketInputs: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
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
  sectionTitle: {
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
  selectFileButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  selectFileButtonText: { color: COLORS.cardBg, fontWeight: "bold" },
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
