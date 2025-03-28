// CreateEventScreen.tsx
import React from "react";
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

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TitlePers from "@/components/common/TitleComponent";
import DateTimeInputComponent from "@/components/common/DateTimeInputComponent";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { ELECTRONIC_GENRES } from "@/utils/electronicGenresHelper";

// Hook con la lógica de creación de evento
import { useCreateEvent } from "@/hooks/events/useCreateEvent";
// Hook/contexto de autenticación
import { useAuth } from "@/context/AuthContext";

export default function CreateEventScreen() {
  // Lógica interna para crear evento
  const {
    // 1) Info de login
    isLoggedIn,
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    simulateLogin,
    handleLogout,

    // 2) Campos y métodos del formulario
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

    isAfter,
    setIsAfter,
    isLGBT,
    setIsLGBT,

    eventDescription,
    setEventDescription,

    startDateTime,
    setStartDateTime,
    endDateTime,
    setEndDateTime,

    daysTickets,
    handleTicketChange,
    totalTickets,

    startSaleDateTime,
    setStartSaleDateTime,
    earlyBirdsStock,
    setEarlyBirdsStock,
    useEarlyBirdsDate,
    setUseEarlyBirdsDate,
    earlyBirdsUntilDateTime,
    setEarlyBirdsUntilDateTime,

    photoFile,
    handleSelectPhoto,
    videoLink,
    setVideoLink,
    musicLink,
    setMusicLink,

    acceptedTC,
    setAcceptedTC,

    handleSubmit,
  } = useCreateEvent();

  // Obtenemos el user desde tu AuthContext
  const { user } = useAuth();
  // Asumimos user?.role => "guest" | "user" | "owner" | "admin"

  // Decidimos que si user es nulo/undefined o su rol es "guest",
  // entonces mostramos el mensaje de "Debes iniciar sesión..."
  const mustShowLoginMessage = !user || user.role === "guest";

  function handleEventTypeChange(value: "1d" | "2d" | "3d") {
    setEventType(value);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {mustShowLoginMessage ? (
          // NO logueado (o rol "guest")
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
          // Usuario con rol "user", "owner" o "admin" => Formulario
          <View style={{ width: "100%" }}>
            <TitlePers text="Crear Evento" />
            <View style={styles.divider} />

           

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
                {ELECTRONIC_GENRES.map((genre) => {
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

            {/* UBICACIÓN (Provincia, Municipio, Localidad, etc.) */}
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
                  {provinceName || "Seleccione una provincia"}
                </Text>
              </TouchableOpacity>
              {showProvinces && (
                <View style={styles.dropdownContainer}>
                  {provinces.map((prov) => (
                    <TouchableOpacity
                      key={prov.id}
                      onPress={() =>
                        handleSelectProvince(prov.id, prov.nombre)
                      }
                      style={styles.dropdownItem}
                    >
                      <Text>{prov.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.subLabel}>Municipio</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowMunicipalities(!showMunicipalities);
                  setShowProvinces(false);
                  setShowLocalities(false);
                }}
                disabled={!provinceId}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !provinceId && { opacity: 0.5 },
                  ]}
                >
                  {municipalityName || "Seleccione un municipio"}
                </Text>
              </TouchableOpacity>
              {showMunicipalities && (
                <View style={styles.dropdownContainer}>
                  {municipalities.map((mun) => (
                    <TouchableOpacity
                      key={mun.id}
                      onPress={() =>
                        handleSelectMunicipality(mun.id, mun.nombre)
                      }
                      style={styles.dropdownItem}
                    >
                      <Text>{mun.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.subLabel}>Localidad</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowLocalities(!showLocalities);
                  setShowProvinces(false);
                  setShowMunicipalities(false);
                }}
                disabled={!municipalityId}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !municipalityId && { opacity: 0.5 },
                  ]}
                >
                  {localityName || "Seleccione una localidad"}
                </Text>
              </TouchableOpacity>
              {showLocalities && (
                <View style={styles.dropdownContainer}>
                  {localities.map((loc) => (
                    <TouchableOpacity
                      key={loc.id}
                      onPress={() => handleSelectLocality(loc.id, loc.nombre)}
                      style={styles.dropdownItem}
                    >
                      <Text>{loc.nombre}</Text>
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

            {/* AFTER / LGBT */}
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

            {/* ENTRADAS POR DÍA */}
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
                <Text style={{ marginLeft: 4 }}>Fecha y hora:</Text>
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

              {/* Botón para abrir galería */}
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
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    padding: 16,
  },
  notLoggedContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 24,
  },
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

  // Form groups
  formGroup: {
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
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

  // Dropdowns
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

  // Bloque de entradas por día
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

  // Secciones
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
