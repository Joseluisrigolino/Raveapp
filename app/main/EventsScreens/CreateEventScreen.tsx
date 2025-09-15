// app/main/CreateEventScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/** Layout y UI base */
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import TitlePers from "@/components/common/TitleComponent";

/** Estilos globales */
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/** API / helpers */
import { ApiGenero, fetchGenres } from "@/utils/events/eventApi";
import { getTycPdfUrl } from "@/utils/tycApi";
import { fetchArtistsFromApi, createArtist } from "@/utils/artists/artistApi";
import { Artist } from "@/interfaces/Artist";
import { useAuth } from "@/context/AuthContext";

/** Georef (NO TOCAR lógicas base, sólo pasamos a componente) */
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
} from "@/utils/georef/georefHelpers";

/** Recurrentes (parties) */
import { getPartiesByUser, createParty, Party } from "@/utils/partysApi";

/** Componentes de la pantalla (carpeta components/events/create) */
import EventBasicData from "@/components/events/create/EventBasicData";
import GenreSelector from "@/components/events/create/GenreSelector";
import ArtistSelector from "@/components/events/create/ArtistSelector";
import LocationSelector from "@/components/events/create/LocationSelector";
import DescriptionField from "@/components/events/create/DescriptionField";
import ScheduleSection from "@/components/events/create/ScheduleSection";
import TicketSection from "@/components/events/create/TicketSection";
import TicketConfigSection from "@/components/events/create/TicketConfigSection";
import MediaSection from "@/components/events/create/MediaSection";

/* ================= Tipos locales ================= */
type EventType = "1d" | "2d" | "3d";
type ArtistSel = Artist & { __isNew?: boolean };

interface DayTickets {
  genQty: string;
  genPrice: string;
  ebGenQty: string;
  ebGenPrice: string;
  vipQty: string;
  vipPrice: string;
  ebVipQty: string;
  ebVipPrice: string;
}
interface DaySchedule {
  start: Date;
  end: Date;
}
interface DaySaleConfig {
  saleStart: Date;
  sellUntil: Date;
}

/* ================= Utils ================= */
const GREEN = "#17a34a";

const createEmptyDayTickets = (): DayTickets => ({
  genQty: "0",
  genPrice: "",
  ebGenQty: "0",
  ebGenPrice: "",
  vipQty: "0",
  vipPrice: "",
  ebVipQty: "0",
  ebVipPrice: "",
});
const createEmptySchedule = (): DaySchedule => ({
  start: new Date(),
  end: new Date(),
});
const createEmptySaleConfig = (): DaySaleConfig => ({
  saleStart: new Date(),
  sellUntil: new Date(),
});

// normalizador simple para comparar sin acentos ni may/min
const norm = (s: string) =>
  (s || "")
    .normalize("NFD")
    // @ts-ignore - property supported por RegExp unicode
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/* ================= Pantalla ================= */
export default function CreateEventScreen() {
  /* --- Auth --- */
  const { user } = useAuth();
  const userId: string | null =
    (user as any)?.idUsuario ?? (user as any)?.id ?? null;
  const mustShowLogin = !user || (user as any)?.role === "guest";

  /* --- Datos base --- */
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<EventType>("1d");
  const [isRecurring, setIsRecurring] = useState(false);
  const [eventDescription, setEventDescription] = useState("");

  const dayCount = useMemo(
    () => (eventType === "1d" ? 1 : eventType === "2d" ? 2 : 3),
    [eventType]
  );

  /* --- Géneros --- */
  const [genres, setGenres] = useState<ApiGenero[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  /* --- Artistas --- */
  const [artistInput, setArtistInput] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<ArtistSel[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[] | null>(null);
  const [artistLoading, setArtistLoading] = useState(false);

  /* --- Fiestas recurrentes --- */
  const [myParties, setMyParties] = useState<Party[]>([]);
  const [partyLoading, setPartyLoading] = useState(false);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);

  // Crear nueva (pendiente hasta enviar)
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyLocked, setNewPartyLocked] = useState(false);

  /* --- Ubicación (NO TOCAR lógicas, sólo propagar) --- */
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
  const [isAfter, setIsAfter] = useState(false);
  const [isLGBT, setIsLGBT] = useState(false);

  /* --- Estructuras por día --- */
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([
    createEmptySchedule(),
  ]);
  const [daysTickets, setDaysTickets] = useState<DayTickets[]>([
    createEmptyDayTickets(),
  ]);
  const [daySaleConfigs, setDaySaleConfigs] = useState<DaySaleConfig[]>([
    createEmptySaleConfig(),
  ]);

  /* --- Multimedia --- */
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [musicLink, setMusicLink] = useState("");

  /* --- T&C --- */
  const [acceptedTC, setAcceptedTC] = useState(false);

  /* --- Modal TyC --- */
  const [tycVisible, setTycVisible] = useState(false);
  const [tycUrl, setTycUrl] = useState<string | null>(null);
  const [tycLoading, setTycLoading] = useState(false);
  const [tycError, setTycError] = useState<string | null>(null);

  const buildViewerUrl = (url: string) => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      return `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(
        url
      )}`;
    }
    return url;
  };

  const openTycModal = async () => {
    setTycVisible(true);
    setTycError(null);
    try {
      setTycLoading(true);
      const url = await getTycPdfUrl();
      setTycUrl(url);
    } catch (e: any) {
      setTycError(e?.message || "No se pudo cargar el archivo.");
    } finally {
      setTycLoading(false);
    }
  };

  /* ================= Effects ================= */
  useEffect(() => {
    setDaySchedules(Array.from({ length: dayCount }, createEmptySchedule));
  }, [dayCount]);

  useEffect(() => {
    setDaysTickets(Array.from({ length: dayCount }, createEmptyDayTickets));
  }, [dayCount]);

  useEffect(() => {
    setDaySaleConfigs(Array.from({ length: dayCount }, createEmptySaleConfig));
  }, [dayCount]);

  useEffect(() => {
    fetchProvinces()
      .then(setProvinces)
      .catch((err) => console.error("Error fetchProvinces:", err));
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await fetchGenres();
      if (mounted) setGenres(list);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Cargar artistas una vez cuando el usuario empieza a tipear
  useEffect(() => {
    const q = norm(artistInput);
    if (!q) return;
    if (allArtists === null && !artistLoading) {
      setArtistLoading(true);
      fetchArtistsFromApi()
        .then((arr) => setAllArtists(arr))
        .catch((e) => {
          console.error("fetchArtistsFromApi", e);
          setAllArtists([]);
        })
        .finally(() => setArtistLoading(false));
    }
  }, [artistInput, allArtists, artistLoading]);

  // Cargar fiestas del usuario cuando marca "evento recurrente"
  useEffect(() => {
    if (!isRecurring || !userId) return;
    setPartyLoading(true);
    getPartiesByUser(String(userId))
      .then((arr) => setMyParties(arr))
      .catch(() => setMyParties([]))
      .finally(() => setPartyLoading(false));
  }, [isRecurring, userId]);

  // Si desactiva "recurrente", limpio selección / pendiente
  useEffect(() => {
    if (!isRecurring) {
      setSelectedPartyId(null);
      setNewPartyName("");
      setNewPartyLocked(false);
      setShowPartyDropdown(false);
    }
  }, [isRecurring]);

  /* ================= Handlers (pasan a los subcomponentes) ================= */
  // Géneros
  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Artistas
  const addArtistByName = (nameRaw: string) => {
    const name = nameRaw.trim();
    if (!name) return;
    if (selectedArtists.some((a) => norm(a.name) === norm(name))) {
      setArtistInput("");
      return;
    }
    setSelectedArtists((prev) => [...prev, { name, image: "" } as ArtistSel]);
    setArtistInput("");
  };

  const handleSelectArtistFromSuggestions = (a: Artist) => {
    if (selectedArtists.some((s) => norm(s.name) === norm(a.name))) return;
    setSelectedArtists((prev) => [...prev, a]);
    setArtistInput("");
  };

  const handleRemoveArtist = (name: string) => {
    setSelectedArtists((prev) => prev.filter((x) => x.name !== name));
  };

  // Fiestas
  const onPickParty = (p: Party) => {
    setSelectedPartyId(p.idFiesta);
    setShowPartyDropdown(false);
    setNewPartyName("");
    setNewPartyLocked(false);
  };
  const onPressAddNewParty = () => {
    const name = newPartyName.trim();
    if (!name) return;
    setNewPartyLocked(true); // confirma y bloquea edición
    setSelectedPartyId(null);
  };

  // Horarios / Tickets / Config
  const setSchedule = (i: number, key: keyof DaySchedule, val: Date) => {
    setDaySchedules((prev) => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [key]: val };
      return arr;
    });
  };
  const setSaleCfg = (i: number, key: keyof DaySaleConfig, val: Date) => {
    setDaySaleConfigs((prev) => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [key]: val };
      return arr;
    });
  };
  const setTicket = (i: number, key: keyof DayTickets, val: string) => {
    setDaysTickets((prev) => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [key]: val.replace(/[^0-9]/g, "") };
      return arr;
    });
  };

  const totalPerDay = (d: DayTickets) =>
    (parseInt(d.genQty || "0", 10) || 0) + (parseInt(d.vipQty || "0", 10) || 0);

  const grandTotal = useMemo(
    () => daysTickets.reduce((acc, d) => acc + totalPerDay(d), 0),
    [daysTickets]
  );

  // Multimedia
  const handleSelectPhoto = async () => {
    try {
      const { default: ImagePicker } = await import("expo-image-picker");
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos permiso de galería.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!res.canceled && res.assets.length) setPhotoFile(res.assets[0].uri);
    } catch (e) {
      console.error("ImagePicker error", e);
      Alert.alert("Error", "No se pudo abrir la galería.");
    }
  };

  // Creaciones diferidas
  async function createPendingEntities() {
    // 1) Fiesta nueva
    if (isRecurring && newPartyLocked && newPartyName.trim() && userId) {
      try {
        await createParty({
          idUsuario: String(userId),
          nombre: newPartyName.trim(),
          isActivo: true,
        });
      } catch (e) {
        console.error("[createParty] error:", e);
        throw new Error("No se pudo crear la nueva fiesta.");
      }
    }

    // 2) Artistas nuevos escritos a mano
    const newOnes = selectedArtists.filter(
      (a) => !a.idArtista && a.name?.trim()
    );
    if (newOnes.length) {
      try {
        await Promise.all(
          newOnes.map((a) => createArtist(a.name.trim(), 0)) // isActivo = 0
        );
      } catch (e) {
        console.error("[createArtist] error:", e);
        throw new Error("No se pudieron crear algunos artistas.");
      }
    }
  }

  // Submit
  const handleSubmit = async () => {
    if (!photoFile) {
      Alert.alert("Foto obligatoria", "Seleccioná una imagen del evento.");
      return;
    }
    if (!acceptedTC) {
      Alert.alert("Términos", "Debés aceptar los términos y condiciones.");
      return;
    }

    try {
      await createPendingEntities();

      const payload = {
        eventName,
        eventDescription,
        isRecurring,
        selectedPartyId,
        newPartyName: newPartyLocked ? newPartyName.trim() : null,
        eventType,
        selectedGenres,
        selectedArtists: selectedArtists.map((a) => a.name),
        provinceId,
        provinceName,
        municipalityId,
        municipalityName,
        localityId,
        localityName,
        street,
        isAfter,
        isLGBT,
        daySchedules,
        daySaleConfigs,
        daysTickets,
        photoFile,
        videoLink,
        musicLink,
        grandTotal,
        acceptedTC,
      };

      console.log("Evento creado:", payload);
      Alert.alert("Éxito", "Evento creado");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "No se pudo crear el evento.");
    }
  };

  /* ================= Derivados ================= */
  const artistSuggestions: Artist[] = useMemo(() => {
    const q = norm(artistInput);
    if (!q || !allArtists) return [];
    const selectedSet = new Set(selectedArtists.map((a) => norm(a.name)));
    return allArtists
      .filter((a) => !selectedSet.has(norm(a.name)) && norm(a.name).includes(q))
      .slice(0, 8);
  }, [artistInput, allArtists, selectedArtists]);

  /* ================= Render ================= */
  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <TabMenuComponent
        tabs={[
          {
            label: "Crear evento",
            route: "/main/CreateEventScreen",
            isActive: true,
          },
          {
            label: "Mis fiestas recurrentes",
            route: "/owner/PartysScreen",
            isActive: false,
          },
        ]}
      />

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
              onPress={() => console.log("Iniciar sesión")}
            >
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.registerButton]}
              onPress={() => console.log("Registrarme")}
            >
              <Text style={styles.buttonText}>Registrarme</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={() => console.log("Login con Google")}
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
          </View>
        ) : (
          <View style={{ width: "100%" }}>
            <TitlePers text="Crear Evento" />
            <View style={styles.divider} />

            {/* 1) Datos del evento */}
            <Text style={styles.h2}>Datos del evento</Text>
            <EventBasicData
              eventName={eventName}
              onChangeEventName={setEventName}
              isRecurring={isRecurring}
              setIsRecurring={setIsRecurring}
              myParties={myParties}
              partyLoading={partyLoading}
              selectedPartyId={selectedPartyId}
              setSelectedPartyId={setSelectedPartyId}
              showPartyDropdown={showPartyDropdown}
              setShowPartyDropdown={setShowPartyDropdown}
              newPartyName={newPartyName}
              setNewPartyName={setNewPartyName}
              newPartyLocked={newPartyLocked}
              setNewPartyLocked={setNewPartyLocked}
              onPickParty={onPickParty}
              onPressAddNewParty={onPressAddNewParty}
              eventType={eventType}
              setEventType={setEventType}
            />

            {/* 2) Géneros */}
            <Text style={styles.h2}>Género/s musical/es</Text>
            <GenreSelector
              genres={genres}
              selectedGenres={selectedGenres}
              onToggle={toggleGenre}
            />

            {/* 3) Artistas */}
            <Text style={styles.h2}>Artista/s</Text>
            <ArtistSelector
              artistInput={artistInput}
              setArtistInput={setArtistInput}
              artistLoading={artistLoading}
              suggestions={artistSuggestions}
              onSelectSuggestion={handleSelectArtistFromSuggestions}
              onAddManual={addArtistByName}
              selectedArtists={selectedArtists}
              onRemoveArtist={handleRemoveArtist}
            />

            {/* 4) Ubicación */}
            <Text style={styles.h2}>Ubicación del evento</Text>
            <LocationSelector
              provinces={provinces}
              municipalities={municipalities}
              localities={localities}
              provinceId={provinceId}
              provinceName={provinceName}
              municipalityId={municipalityId}
              municipalityName={municipalityName}
              localityId={localityId}
              localityName={localityName}
              street={street}
              setStreet={setStreet}
              isAfter={isAfter}
              setIsAfter={setIsAfter}
              isLGBT={isLGBT}
              setIsLGBT={setIsLGBT}
              showProvinces={showProvinces}
              setShowProvinces={setShowProvinces}
              showMunicipalities={showMunicipalities}
              setShowMunicipalities={setShowMunicipalities}
              showLocalities={showLocalities}
              setShowLocalities={setShowLocalities}
              handleSelectProvince={async (id: string, name: string) => {
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
              }}
              handleSelectMunicipality={async (id: string, name: string) => {
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
              }}
              handleSelectLocality={(id: string, name: string) => {
                setLocalityId(id);
                setLocalityName(name);
                setShowLocalities(false);
              }}
            />

            {/* 5) Descripción */}
            <Text style={styles.h2}>Descripción</Text>
            <DescriptionField
              value={eventDescription}
              onChange={setEventDescription}
            />

            {/* 6) Fecha y hora */}
            <Text style={styles.h2}>Fecha y hora del evento</Text>
            <ScheduleSection
              daySchedules={daySchedules}
              setSchedule={setSchedule}
            />

            {/* 7) Entradas */}
            <Text style={styles.h2}>Entradas</Text>
            <TicketSection
              daysTickets={daysTickets}
              setTicket={setTicket}
              totalPerDay={totalPerDay}
              accentColor={GREEN}
            />

            {/* 8) Configuración de entradas */}
            <Text style={styles.h2}>Configuración de entradas</Text>
            <TicketConfigSection
              daySaleConfigs={daySaleConfigs}
              setSaleCfg={setSaleCfg}
            />

            {/* 9) Multimedia */}
            <Text style={styles.h2}>Multimedia</Text>
            <MediaSection
              photoFile={photoFile}
              videoLink={videoLink}
              musicLink={musicLink}
              onSelectPhoto={handleSelectPhoto}
              onChangeVideo={setVideoLink}
              onChangeMusic={setMusicLink}
            />

            {/* 10) Términos + Submit */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setAcceptedTC(!acceptedTC)}
              >
                <View
                  style={[styles.checkBox, acceptedTC && styles.checkBoxOn]}
                />
                <Text style={styles.checkText}>
                  Acepto{" "}
                  <Text style={styles.link} onPress={openTycModal}>
                    términos y condiciones
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>CREAR EVENTO</Text>
              </TouchableOpacity>

              <Text style={[styles.totalLine, { textAlign: "center" }]}>
                Total general de entradas:{" "}
                <Text style={{ color: GREEN, fontWeight: "700" }}>
                  {grandTotal}
                </Text>
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ===== Modal Términos y Condiciones ===== */}
      <Modal
        visible={tycVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTycVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Términos y Condiciones</Text>
              <TouchableOpacity onPress={() => setTycVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={COLORS.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {tycLoading && (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={{ marginTop: 8, color: COLORS.textSecondary }}>
                    Cargando…
                  </Text>
                </View>
              )}

              {!tycLoading && !tycError && !tycUrl && (
                <View style={styles.center}>
                  <Text style={{ color: COLORS.textSecondary }}>
                    No hay archivo disponible.
                  </Text>
                </View>
              )}

              {!tycLoading && tycError && (
                <View style={styles.center}>
                  <Text style={{ color: COLORS.negative, marginBottom: 8 }}>
                    {tycError}
                  </Text>
                  <TouchableOpacity
                    style={styles.fileBtn}
                    onPress={openTycModal}
                  >
                    <Text style={styles.fileBtnText}>Reintentar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!tycLoading && tycUrl && (
                <>
                  {(() => {
                    let WebViewComp: any = null;
                    try {
                      WebViewComp = require("react-native-webview").WebView;
                    } catch {}
                    if (WebViewComp) {
                      return (
                        <WebViewComp
                          source={{ uri: buildViewerUrl(tycUrl!) }}
                          style={{ flex: 1, borderRadius: RADIUS.card }}
                        />
                      );
                    }
                    if (Platform.OS === "web") {
                      // @ts-ignore – iframe sólo web
                      return (
                        <iframe
                          src={buildViewerUrl(tycUrl!)}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                          }}
                          title="Términos y Condiciones"
                        />
                      );
                    }
                    return (
                      <View style={styles.center}>
                        <Text
                          style={{
                            color: COLORS.textSecondary,
                            marginBottom: 10,
                          }}
                        >
                          No se pudo incrustar el PDF en este dispositivo.
                        </Text>
                        <TouchableOpacity
                          style={styles.fileBtn}
                          onPress={() => Linking.openURL(tycUrl!)}
                        >
                          <Text style={styles.fileBtnText}>
                            Abrir en el navegador
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Footer />
    </SafeAreaView>
  );
}

/* ================= Estilos ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollContent: { padding: 16 },

  divider: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.textPrimary,
    width: "100%",
    marginVertical: 12,
  },
  h2: {
    fontWeight: "800",
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 6,
  },

  card: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  /* links */
  link: { color: COLORS.info, textDecorationLine: "underline" },

  /* checkbox */
  checkRow: { flexDirection: "row", alignItems: "center" },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: 8,
  },
  checkBoxOn: { backgroundColor: COLORS.primary },
  checkText: { color: COLORS.textPrimary },

  /* Totales / botón enviar */
  submitButton: {
    backgroundColor: COLORS.primary,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    alignItems: "center",
    width: "100%",
  },
  submitButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },
  totalLine: {
    marginTop: 10,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  /* Modal TyC */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    overflow: "hidden",
    maxHeight: "90%",
  },
  modalHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderInput,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontFamily: Platform.select({
      ios: "Helvetica Neue",
      android: "Roboto",
      default: "System",
    }),
  },
  modalBody: { width: 320, height: 460, padding: 6 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Estado no logueado */
  notLoggedContainer: { width: "100%", alignItems: "center", marginTop: 24 },
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
});
