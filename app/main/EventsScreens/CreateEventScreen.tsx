import React, { useState } from "react";
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

import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import TitlePers from "@/components/TitleComponent";
import { Artist } from "@/interfaces/Artist";

// Importamos el componente de fecha/hora (compatible con Expo)
import DateTimeInputComponent from "@/components/DateTimeInputComponent";

// Géneros simulados
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

// Base de artistas simulada
const fakeArtistDatabase: Artist[] = [
  { name: "Artista 1", image: "" },
  { name: "Artista 2", image: "" },
  { name: "Artista 3", image: "" },
];

// Pickers manuales de provincia/municipio/localidad
const mockProvinces = ["Buenos Aires", "Córdoba", "Mendoza"];
const mockMunicipalities = ["Municipio 1", "Municipio 2"];
const mockLocalities = ["Localidad 1", "Localidad 2"];

/**
 * Función para calcular la suma total de entradas de las 4 categorías:
 * Generales Early, VIP Early, Generales, VIP.
 */
function calcTotalTickets(
  genEarlyQty: string,
  vipEarlyQty: string,
  genQty: string,
  vipQty: string
): number {
  const ge = parseInt(genEarlyQty, 10) || 0;
  const ve = parseInt(vipEarlyQty, 10) || 0;
  const g = parseInt(genQty, 10) || 0;
  const v = parseInt(vipQty, 10) || 0;
  return ge + ve + g + v;
}

export default function CreateEventScreen() {
  // Control de login (demo)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Handlers parte “No logueado”
  const handleLogin = () => {
    console.log("Iniciar sesión presionado");
  };
  const handleRegister = () => {
    console.log("Registrarme presionado");
  };
  const handleGoogleLogin = () => {
    console.log("Login with Google presionado");
  };
  const simulateLogin = () => {
    setIsLoggedIn(true);
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Campos del formulario
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<"1d" | "2d" | "3d">("1d");
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

  // Fechas y configuración de entradas (usamos Date)
  const [startDateTime, setStartDateTime] = useState<Date>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date>(new Date());

  // Cuatro categorías de entradas
  const [genEarlyQty, setGenEarlyQty] = useState("");
  const [genEarlyPrice, setGenEarlyPrice] = useState("");
  const [vipEarlyQty, setVipEarlyQty] = useState("");
  const [vipEarlyPrice, setVipEarlyPrice] = useState("");

  // NUEVAS: Entradas Generales y VIP (no early)
  const [genQty, setGenQty] = useState("");
  const [genPrice, setGenPrice] = useState("");
  const [vipQty, setVipQty] = useState("");
  const [vipPrice, setVipPrice] = useState("");

  const [startSaleDateTime, setStartSaleDateTime] = useState<Date>(new Date());
  const [earlyBirdsStock, setEarlyBirdsStock] = useState(false);
  const [useEarlyBirdsDate, setUseEarlyBirdsDate] = useState(false);
  const [earlyBirdsUntilDateTime, setEarlyBirdsUntilDateTime] = useState<Date>(
    new Date()
  );

  // Radio: Tipo de evento
  const handleEventTypeChange = (value: "1d" | "2d" | "3d") => {
    setEventType(value);
  };

  // Checkboxes: géneros
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  // Agregar artista
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

  // Calcular total de entradas en tiempo real
  const totalTickets = calcTotalTickets(
    genEarlyQty,
    vipEarlyQty,
    genQty,
    vipQty
  );

  // Al enviar
  const handleSubmit = () => {
    console.log("Enviando evento:", {
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
      startDateTime,
      endDateTime,
      // 4 categorías
      genEarlyQty,
      genEarlyPrice,
      vipEarlyQty,
      vipEarlyPrice,
      genQty,
      genPrice,
      vipQty,
      vipPrice,
      // Config entradas
      startSaleDateTime,
      earlyBirdsStock,
      useEarlyBirdsDate,
      earlyBirdsUntilDateTime,
      // totalTickets calculado
      totalTickets,
    });
    alert("Evento creado (ejemplo)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!isLoggedIn ? (
          // ---------------- NO LOGUEADO ----------------
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
                  color="#4285F4"
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
          // ---------------- SÍ LOGUEADO ----------------
          <View style={{ width: "100%" }}>
            <TitlePers text="Crear Evento" />
            <View style={styles.divider} />

            <TouchableOpacity style={styles.demoButton} onPress={handleLogout}>
              <Text style={styles.demoButtonText}>Cerrar sesión (demo)</Text>
            </TouchableOpacity>

            {/* NOMBRE, TIPO, GÉNEROS, ARTISTAS */}
            <Text style={styles.label}>Nombre del evento:</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del evento"
              value={eventName}
              onChangeText={setEventName}
            />

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

            {/* UBICACIÓN (pickers manuales) */}
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

            {/* FECHAS */}
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

            {/* ENTRADAS */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Entradas:
            </Text>
            <Text style={{ marginBottom: 8 }}>
              Cantidad total de entradas: {totalTickets}
            </Text>

            {/* Entradas Generales Early Birds */}
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>
                Entradas generales - Early Birds:
              </Text>
              <View style={styles.ticketInputs}>
                <Text>Cantidad:</Text>
                <TextInput
                  style={styles.smallInput}
                  keyboardType="numeric"
                  value={genEarlyQty}
                  onChangeText={setGenEarlyQty}
                  placeholder="0"
                />
                <Text>Precio:</Text>
                <TextInput
                  style={styles.smallInput}
                  keyboardType="numeric"
                  value={genEarlyPrice}
                  onChangeText={setGenEarlyPrice}
                  placeholder="$"
                />
              </View>
            </View>

            {/* Entradas VIP Early Birds */}
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>
                Entradas VIP - Early Birds:
              </Text>
              <View style={styles.ticketInputs}>
                <Text>Cantidad:</Text>
                <TextInput
                  style={styles.smallInput}
                  keyboardType="numeric"
                  value={vipEarlyQty}
                  onChangeText={setVipEarlyQty}
                  placeholder="0"
                />
                <Text>Precio:</Text>
                <TextInput
                  style={styles.smallInput}
                  keyboardType="numeric"
                  value={vipEarlyPrice}
                  onChangeText={setVipEarlyPrice}
                  placeholder="$"
                />
              </View>
            </View>

            {/* NUEVAS: Entradas Generales (no early) */}
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Entradas generales:</Text>
              <View style={styles.ticketInputs}>
                <Text>Cantidad:</Text>
                <TextInput
                  style={styles.smallInput}
                  keyboardType="numeric"
                  value={genQty}
                  onChangeText={setGenQty}
                  placeholder="0"
                />
                <Text>Precio:</Text>
                <TextInput
                  style={styles.smallInput}
                  keyboardType="numeric"
                  value={genPrice}
                  onChangeText={setGenPrice}
                  placeholder="$"
                />
              </View>
            </View>

            {/* NUEVAS: Entradas VIP (no early) */}
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Entradas VIP:</Text>
              <View style={styles.ticketInputs}>
                <Text>Cantidad:</Text>
                <TextInput
                  style={styles.smallInput}
                  keyboardType="numeric"
                  value={vipQty}
                  onChangeText={setVipQty}
                  placeholder="0"
                />
                <Text>Precio:</Text>
                <TextInput
                  style={styles.smallInput}
                  keyboardType="numeric"
                  value={vipPrice}
                  onChangeText={setVipPrice}
                  placeholder="$"
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Configuración de entradas:
            </Text>
            <DateTimeInputComponent
              label="Inicio de venta de entradas:"
              value={startSaleDateTime}
              onChange={setStartSaleDateTime}
            />

            <Text style={styles.label}>Vender Early Birds hasta:</Text>
            {/* Opción 1: Agotar stock */}
            <View style={[styles.checkboxItem, { width: 300 }]}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setEarlyBirdsStock(!earlyBirdsStock)}
              >
                {earlyBirdsStock && <View style={styles.checkboxSelected} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 4 }}>Agotar stock</Text>
            </View>

            {/* Opción 2: Fecha/hora */}
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

            {/* BOTÓN FINAL (centrado) */}
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

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderBottomColor: "#000",
    width: "100%",
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 12,
  },
  button: {
    width: "70%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  loginButton: {
    backgroundColor: "#4db6ac",
  },
  registerButton: {
    backgroundColor: "#ec407a",
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  googleButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  demoButton: {
    marginTop: 16,
    backgroundColor: "#ddd",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "center",
  },
  demoButtonText: {
    color: "#333",
  },
  label: {
    marginTop: 12,
    fontWeight: "bold",
    width: 300,
  },
  input: {
    backgroundColor: "#FFF", // Fondo blanco
    borderWidth: 1, // Borde sutil
    borderColor: "#ccc",
    borderRadius: 4,
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
    borderColor: "#000",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000",
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
    borderColor: "#000",
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    width: 12,
    height: 12,
    backgroundColor: "#000",
  },
  artistInputRow: {
    flexDirection: "row",
    marginTop: 4,
    width: 300,
  },
  addArtistButton: {
    backgroundColor: "#000",
    borderRadius: 4,
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addArtistButtonText: {
    color: "#fff",
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
    backgroundColor: "#eee",
    padding: 6,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  artistName: {
    marginRight: 4,
  },
  removeArtist: {
    color: "red",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    width: 300,
    marginTop: 12,
  },
  dropdownButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 4,
    backgroundColor: "#F3F3F3",
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: 300,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 4,
    backgroundColor: "#FFF",
    width: 300,
    marginBottom: 4,
  },
  dropdownItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  ticketRow: {
    width: 300,
    marginTop: 8,
  },
  ticketLabel: {
    fontWeight: "600",
    marginBottom: 4,
  },
  ticketInputs: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  smallInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginHorizontal: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#4db6ac",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: 200,
    alignSelf: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
