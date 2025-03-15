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

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import TitlePers from "@/components/TitleComponent";
import DateTimeInputComponent from "@/components/DateTimeInputComponent";

import { Artist } from "@/interfaces/Artist";
// Importa la interfaz de tu evento con todos los campos
import { OwnerEventItem } from "@/interfaces/OwnerEventItem";
// Importa el helper para obtener la data
import { getOwnerEventById } from "@/utils/ownerEventsHelper";

// Importa tus estilos globales
import globalStyles, {
  COLORS,
  FONT_SIZES,
  RADIUS,
} from "@/styles/globalStyles";

/** Función para calcular la suma total de entradas de las 4 categorías. */
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

// Ejemplo de datos simulados (géneros, artistas, etc.)
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

// Ejemplo de pickers manuales
const mockProvinces = ["Buenos Aires", "Córdoba", "Mendoza"];
const mockMunicipalities = ["Municipio 1", "Municipio 2"];
const mockLocalities = ["Localidad 1", "Localidad 2"];

export default function ModifyEventScreen() {
  // 1. Leer el "id" desde la URL
  const { id } = useLocalSearchParams<{ id?: string }>();

  // 2. Estado para saber si el usuario está logueado (demo)
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // 3. Estado para guardar la data del evento que se va a editar
  // (Aquí podrías tener un tipo más completo que combine con tu formulario)
  const [originalEventData, setOriginalEventData] = useState<OwnerEventItem | null>(null);

  // 4. Campos del formulario
  // Se inicializan vacíos, pero luego en useEffect los seteo con la data real
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

  // Fechas y entradas
  const [startDateTime, setStartDateTime] = useState<Date>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date>(new Date());

  // Cuatro categorías
  const [genEarlyQty, setGenEarlyQty] = useState("");
  const [genEarlyPrice, setGenEarlyPrice] = useState("");
  const [vipEarlyQty, setVipEarlyQty] = useState("");
  const [vipEarlyPrice, setVipEarlyPrice] = useState("");
  const [genQty, setGenQty] = useState("");
  const [genPrice, setGenPrice] = useState("");
  const [vipQty, setVipQty] = useState("");
  const [vipPrice, setVipPrice] = useState("");

  const [startSaleDateTime, setStartSaleDateTime] = useState<Date>(new Date());
  const [earlyBirdsStock, setEarlyBirdsStock] = useState(false);
  const [useEarlyBirdsDate, setUseEarlyBirdsDate] = useState(false);
  const [earlyBirdsUntilDateTime, setEarlyBirdsUntilDateTime] =
    useState<Date>(new Date());

  // 5. Efecto para cargar la data si "id" existe
  React.useEffect(() => {
    if (id) {
      const found = getOwnerEventById(Number(id));
      if (found) {
        setOriginalEventData(found);

        // AQUI "precargamos" los campos
        setEventName(found.eventName);
        // Por ejemplo, si tu OwnerEventItem tuviera un "eventType", setEventType(found.eventType)
        // etc. Ajusta con la data real
        // ...
      }
    }
  }, [id]);

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

  // Calcular total de entradas
  const totalTickets = calcTotalTickets(genEarlyQty, vipEarlyQty, genQty, vipQty);

  // Al enviar
  const handleSubmit = () => {
    console.log("Guardando cambios del evento (MODIFICAR):", {
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
      genEarlyQty,
      genEarlyPrice,
      vipEarlyQty,
      vipEarlyPrice,
      genQty,
      genPrice,
      vipQty,
      vipPrice,
      startSaleDateTime,
      earlyBirdsStock,
      useEarlyBirdsDate,
      earlyBirdsUntilDateTime,
      totalTickets,
      originalEventId: originalEventData?.id,
    });
    alert("Evento modificado (ejemplo).");
  };

  // DEMO login
  const handleLogout = () => setIsLoggedIn(false);

  // Si no está logueado
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>No estás logueado. Inicia sesión para editar un evento.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ width: "100%" }}>
          <TitlePers text="Modificar Evento" />
          <View style={styles.divider} />

          <TouchableOpacity style={styles.demoButton} onPress={handleLogout}>
            <Text style={styles.demoButtonText}>Cerrar sesión (demo)</Text>
          </TouchableOpacity>

          {/* EVENT NAME */}
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

          {/* GÉNEROS */}
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

          {/* ARTISTAS */}
          <Text style={styles.label}>Artista/s:</Text>
          <View style={styles.artistInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Escribe el nombre del artista"
              value={artistInput}
              onChangeText={setArtistInput}
            />
            <TouchableOpacity style={styles.addArtistButton} onPress={handleAddArtist}>
              <Text style={styles.addArtistButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addedArtistsContainer}>
            {selectedArtists.map((artist) => (
              <View key={artist.name} style={styles.artistTag}>
                <Text style={styles.artistName}>{artist.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveArtist(artist.name)}>
                  <Text style={styles.removeArtist}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* UBICACIÓN */}
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
            <TouchableOpacity style={styles.checkbox} onPress={() => setIsAfter(!isAfter)}>
              {isAfter && <View style={styles.checkboxSelected} />}
            </TouchableOpacity>
            <Text style={{ marginLeft: 4 }}>¿Es after?</Text>
          </View>

          <View style={[styles.checkboxItem, { width: 300, marginTop: 12 }]}>
            <TouchableOpacity style={styles.checkbox} onPress={() => setIsLGBT(!isLGBT)}>
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
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Entradas:</Text>
          <Text style={{ marginBottom: 8 }}>
            Cantidad total de entradas: {totalTickets}
          </Text>

          {/* Generales Early Birds */}
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Entradas generales - Early Birds:</Text>
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

          {/* VIP Early Birds */}
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Entradas VIP - Early Birds:</Text>
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

          {/* Generales (no early) */}
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

          {/* VIP (no early) */}
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
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Guardar Cambios</Text>
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
  scrollContent: {
    padding: 16,
    alignItems: "center",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPrimary,
    width: "100%",
    marginVertical: 8,
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
    color: COLORS.textPrimary,
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
    color: COLORS.textPrimary,
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
  ticketRow: {
    width: 300,
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
    color: COLORS.textPrimary,
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
