// app/main/CreateEventScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
  useColorScheme,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import TitlePers from "@/components/common/TitleComponent";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { ApiGenero, fetchGenres } from "@/utils/events/eventApi";
import { getTycPdfUrl } from "@/utils/tycApi";
import { fetchArtistsFromApi, createArtist } from "@/utils/artists/artistApi";
import { Artist } from "@/interfaces/Artist";
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
} from "@/utils/georef/georefHelpers";
import { useAuth } from "@/context/AuthContext";

// Fiestas (recurrentes)
import { getPartiesByUser, createParty, Party } from "@/utils/partysApi";

/* ========== Tipos ========== */
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

/* ========== Utils ========== */
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
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/* ========== Campo directo Fecha+Hora (con tema visible) ========== */
function DirectDateTimeField({
  value,
  onChange,
  placeholder = "Seleccionar fecha y hora",
}: {
  value: Date;
  onChange: (d: Date) => void;
  placeholder?: string;
}) {
  const colorScheme = useColorScheme();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [tmpDate, setTmpDate] = useState<Date>(value || new Date());

  const open = () => {
    setTmpDate(value || new Date());
    setShowDate(true);
  };

  const fmt = (d?: Date) =>
    d
      ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : placeholder;

  const pickerCommonPropsDate: any =
    Platform.OS === "ios"
      ? { textColor: "#111111" }
      : { themeVariant: "light" };

  const pickerCommonPropsTime: any =
    Platform.OS === "ios"
      ? { textColor: "#111111" }
      : { themeVariant: "light", is24Hour: true };

  return (
    <>
      <TouchableOpacity style={styles.dtButton} onPress={open}>
        <MaterialCommunityIcons
          name="calendar-clock"
          size={18}
          color={"#111"}
          style={{ marginRight: 6 }}
        />
        <Text style={styles.dtButtonText}>{fmt(value)}</Text>
      </TouchableOpacity>

      {/* FECHA */}
      <Modal visible={showDate} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.modalInner, { backgroundColor: "#fff" }]}>
            <Text style={styles.modalTitle}>Seleccionar fecha</Text>
            <DateTimePicker
              value={tmpDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              {...pickerCommonPropsDate}
              onChange={(_, d) => {
                if (d) setTmpDate(d);
              }}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#E5E7EB" }]}
                onPress={() => setShowDate(false)}
              >
                <Text style={[styles.actionText, { color: "#111" }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: GREEN }]}
                onPress={() => {
                  setShowDate(false);
                  setShowTime(true);
                }}
              >
                <Text style={styles.actionText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* HORA */}
      <Modal visible={showTime} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.modalInner, { backgroundColor: "#fff" }]}>
            <Text style={styles.modalTitle}>Seleccionar hora</Text>
            <DateTimePicker
              value={tmpDate}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "clock"}
              {...pickerCommonPropsTime}
              onChange={(_, d) => {
                if (d) {
                  const merged = new Date(tmpDate);
                  merged.setHours(d.getHours(), d.getMinutes(), 0, 0);
                  setTmpDate(merged);
                }
              }}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#E5E7EB" }]}
                onPress={() => setShowTime(false)}
              >
                <Text style={[styles.actionText, { color: "#111" }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: GREEN }]}
                onPress={() => {
                  setShowTime(false);
                  onChange(tmpDate);
                }}
              >
                <Text style={styles.actionText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function CreateEventScreen() {
  /* ========== Auth ========== */
  const { user } = useAuth();
  const userId: string | null =
    (user as any)?.idUsuario ?? (user as any)?.id ?? null;
  const mustShowLogin = !user || (user as any)?.role === "guest";

  /* ========== Datos base ========== */
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  const [eventType, setEventType] = useState<EventType>("1d");
  const dayCount = useMemo(
    () => (eventType === "1d" ? 1 : eventType === "2d" ? 2 : 3),
    [eventType]
  );

  /* ========== Géneros (API) ========== */
  const [genres, setGenres] = useState<ApiGenero[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  /* ========== Artistas ========== */
  const [artistInput, setArtistInput] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<ArtistSel[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[] | null>(null);
  const [artistLoading, setArtistLoading] = useState(false);
  const [showArtistSuggestions, setShowArtistSuggestions] = useState(false);

  /* ========== Fiestas recurrentes ========== */
  const [myParties, setMyParties] = useState<Party[]>([]);
  const [partyLoading, setPartyLoading] = useState(false);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);

  // Crear nueva (pendiente hasta enviar)
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyLocked, setNewPartyLocked] = useState(false);

  /* ========== Ubicación (NO TOCAR) ========== */
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

  /* ========== Flags ========== */
  const [isAfter, setIsAfter] = useState(false);
  const [isLGBT, setIsLGBT] = useState(false);

  /* ========== Estructuras por día ========== */
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([
    createEmptySchedule(),
  ]);
  const [daysTickets, setDaysTickets] = useState<DayTickets[]>([
    createEmptyDayTickets(),
  ]);
  const [daySaleConfigs, setDaySaleConfigs] = useState<DaySaleConfig[]>([
    createEmptySaleConfig(),
  ]);

  /* ========== Multimedia ========== */
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [musicLink, setMusicLink] = useState("");

  /* ========== T&C ========== */
  const [acceptedTC, setAcceptedTC] = useState(false);

  /* ========== Modal TyC ========== */
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

  /* ========== Effects ========== */
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
    if (q.length === 0) {
      setShowArtistSuggestions(false);
      return;
    }
    setShowArtistSuggestions(true);
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

  /* ========== Handlers ubicación (NO TOCAR) ========== */
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

  /* ========== Handlers: géneros y artistas ========== */
  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addArtistByName = (nameRaw: string) => {
    const name = nameRaw.trim();
    if (!name) return;
    if (selectedArtists.some((a) => norm(a.name) === norm(name))) {
      setArtistInput("");
      return;
    }
    setSelectedArtists((prev) => [...prev, { name, image: "" } as ArtistSel]);
    setArtistInput("");
    setShowArtistSuggestions(false);
  };

  const handleSelectArtistFromSuggestions = (a: Artist) => {
    if (selectedArtists.some((s) => norm(s.name) === norm(a.name))) return;
    setSelectedArtists((prev) => [...prev, a]);
    setArtistInput("");
    setShowArtistSuggestions(false);
  };

  const handleRemoveArtist = (name: string) => {
    setSelectedArtists((prev) => prev.filter((x) => x.name !== name));
  };

  /* ========== Handlers: fiestas ========== */
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

  /* ========== Totales entradas ========== */
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

  /* ========== Multimedia ========== */
  const handleSelectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Necesitamos permiso de galería.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!res.canceled && res.assets.length) setPhotoFile(res.assets[0].uri);
  };

  /* ========== Submit helpers (creaciones diferidas) ========== */
  async function createPendingEntities() {
    // 1) Fiesta nueva (si corresponde)
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

    // 2) Artistas nuevos (si escribiste nombres a mano con +)
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

  /* ========== Submit ========== */
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

  /* ========== Derivados Artistas ========== */
  const artistSuggestions: Artist[] = useMemo(() => {
    const q = norm(artistInput);
    if (!q || !allArtists) return [];
    const selectedSet = new Set(selectedArtists.map((a) => norm(a.name)));
    return allArtists
      .filter((a) => !selectedSet.has(norm(a.name)) && norm(a.name).includes(q))
      .slice(0, 8);
  }, [artistInput, allArtists, selectedArtists]);

  /* ========== Render ========== */
  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {/* ===== SUBHEADER (tabs) ===== */}
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

            {/* Datos del evento */}
            <Text style={styles.h2}>Datos del evento</Text>
            <View style={styles.card}>
              <Text style={styles.label}>Nombre del evento</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del evento"
                value={eventName}
                onChangeText={setEventName}
              />

              {/* Evento recurrente */}
              <View style={[styles.flagsRow, { marginTop: 10 }]}>
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => setIsRecurring(!isRecurring)}
                >
                  <View
                    style={[styles.checkBox, isRecurring && styles.checkBoxOn]}
                  />
                  <Text style={styles.checkText}>
                    Este evento es recurrente
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Desplegable de fiestas */}
              {isRecurring && (
                <View style={[styles.recurringBox]}>
                  <Text style={styles.recurringTitle}>
                    Selecciona una fiesta recurrente:
                  </Text>

                  {/* Selector de fiestas */}
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowPartyDropdown((v) => !v)}
                  >
                    <Text style={styles.dropdownText}>
                      {partyLoading
                        ? "Cargando…"
                        : selectedPartyId
                        ? myParties.find((p) => p.idFiesta === selectedPartyId)
                            ?.nombre || "Sin nombre"
                        : "Selecciona una opción"}
                    </Text>
                    <MaterialCommunityIcons
                      name={showPartyDropdown ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={COLORS.textPrimary}
                      style={{ position: "absolute", right: 10 }}
                    />
                  </TouchableOpacity>

                  {showPartyDropdown && (
                    <View style={styles.dropdownContainer}>
                      {partyLoading && (
                        <View style={styles.dropdownItem}>
                          <Text style={styles.hint}>Cargando…</Text>
                        </View>
                      )}
                      {!partyLoading && myParties.length === 0 && (
                        <View style={styles.dropdownItem}>
                          <Text style={styles.hint}>No tenés fiestas aún.</Text>
                        </View>
                      )}
                      {!partyLoading &&
                        myParties.map((p) => (
                          <TouchableOpacity
                            key={p.idFiesta}
                            style={styles.dropdownItem}
                            onPress={() => onPickParty(p)}
                          >
                            <Text>{p.nombre || "(sin nombre)"}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}

                  <Text style={[styles.recurringTitle, { marginTop: 12 }]}>
                    O crea una nueva:
                  </Text>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TextInput
                      style={[
                        styles.input,
                        { flex: 1 },
                        newPartyLocked && styles.inputDisabled,
                      ]}
                      placeholder="Nombre de la nueva fiesta"
                      value={newPartyName}
                      onChangeText={setNewPartyName}
                      editable={!newPartyLocked}
                    />
                    <TouchableOpacity
                      style={[
                        styles.addIconBtn,
                        { marginLeft: 8, opacity: newPartyLocked ? 0.5 : 1 },
                      ]}
                      onPress={onPressAddNewParty}
                      disabled={newPartyLocked || !newPartyName.trim()}
                    >
                      <Text style={styles.addIconText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {newPartyLocked && (
                    <Text style={[styles.hint, { marginTop: 6 }]}>
                      Se creará con ese nombre al enviar el evento.
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.line} />

              <Text style={[styles.label, { marginBottom: 10 }]}>
                Tipo de evento
              </Text>
              <View style={styles.segment}>
                {(["1d", "2d", "3d"] as EventType[]).map((v) => {
                  const active = eventType === v;
                  return (
                    <TouchableOpacity
                      key={v}
                      style={[styles.segmentItem, active && styles.segmentItemOn]}
                      onPress={() => setEventType(v)}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          active && styles.segmentTextOn,
                        ]}
                      >
                        {v === "1d" ? "1 día" : v === "2d" ? "2 días" : "3 días"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Géneros */}
            <Text style={styles.h2}>Género/s musical/es</Text>
            <View style={styles.card}>
              <View style={styles.genreGrid}>
                {genres.length === 0 ? (
                  <Text style={styles.hint}>(Sin géneros disponibles)</Text>
                ) : (
                  genres.map((g) => {
                    const sel = selectedGenres.includes(g.cdGenero);
                    return (
                      <TouchableOpacity
                        key={g.cdGenero}
                        style={[styles.chip, sel && styles.chipOn]}
                        onPress={() => toggleGenre(g.cdGenero)}
                      >
                        <Text
                          style={[styles.chipText, sel && styles.chipTextOn]}
                        >
                          {g.dsGenero}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>

            {/* Artistas */}
            <Text style={styles.h2}>Artista/s</Text>
            <View style={styles.card}>
              <View style={{ position: "relative" }}>
                <View style={styles.artistRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Escribe el nombre del artista"
                    value={artistInput}
                    onChangeText={(t) => setArtistInput(t)}
                    onFocus={() => {
                      if (artistInput) setShowArtistSuggestions(true);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.addIconBtn}
                    onPress={() => addArtistByName(artistInput)}
                  >
                    <Text style={styles.addIconText}>+</Text>
                  </TouchableOpacity>
                </View>

                {showArtistSuggestions && (
                  <View style={styles.dropdownContainer}>
                    {artistLoading && (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.hint}>Buscando…</Text>
                      </View>
                    )}

                    {!artistLoading && artistSuggestions.length === 0 && (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.hint}>Sin resultados</Text>
                      </View>
                    )}

                    {!artistLoading &&
                      artistSuggestions.map((a) => (
                        <TouchableOpacity
                          key={`${a.idArtista ?? ""}-${a.name}`}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectArtistFromSuggestions(a)}
                        >
                          <Text>{a.name}</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
              </View>

              {selectedArtists.length > 0 && (
                <>
                  <View style={styles.line} />
                  <View style={{ gap: 8 }}>
                    {selectedArtists.map((a) => (
                      <View key={a.name} style={styles.artistPickedRow}>
                        <MaterialCommunityIcons
                          name="check"
                          size={18}
                          color={GREEN}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.artistPickedName}>{a.name}</Text>
                        <TouchableOpacity
                          style={styles.removeBubble}
                          onPress={() => handleRemoveArtist(a.name)}
                        >
                          <MaterialCommunityIcons
                            name="close"
                            size={14}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Ubicación (NO TOCAR lógica) */}
            <Text style={styles.h2}>Ubicación del evento</Text>
            <View style={styles.card}>
              <Text style={styles.label}>Provincia</Text>
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

              <Text style={styles.label}>Municipio</Text>
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
                  {municipalityName || "Seleccione un municipio"}
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

              <Text style={styles.label}>Localidad</Text>
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
                  {localityName || "Seleccione una localidad"}
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

              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                placeholder="Dirección del evento"
                value={street}
                onChangeText={setStreet}
              />

              <View style={styles.flagsRow}>
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => setIsAfter(!isAfter)}
                >
                  <View
                    style={[styles.checkBox, isAfter && styles.checkBoxOn]}
                  />
                  <Text style={styles.checkText}>¿Es after?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => setIsLGBT(!isLGBT)}
                >
                  <View
                    style={[styles.checkBox, isLGBT && styles.checkBoxOn]}
                  />
                  <Text style={styles.checkText}>¿Es LGBT?</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Descripción */}
            <Text style={styles.h2}>Descripción</Text>
            <View style={styles.card}>
              <TextInput
                style={[styles.input, styles.textarea]}
                multiline
                placeholder="La descripción de tu evento va aquí."
                value={eventDescription}
                onChangeText={setEventDescription}
              />
            </View>

            {/* Fechas por día (directo) */}
            <Text style={styles.h2}>Fecha y hora del evento</Text>
            {daySchedules.map((d, i) => (
              <View key={`sch-${i}`} style={styles.card}>
                <Text style={styles.dayTitle}>Día {i + 1}</Text>
                <Text style={styles.label}>Inicio</Text>
                <DirectDateTimeField
                  value={d.start}
                  onChange={(val) => setSchedule(i, "start", val)}
                />
                <Text style={[styles.label, { marginTop: 8 }]}>Finalización</Text>
                <DirectDateTimeField
                  value={d.end}
                  onChange={(val) => setSchedule(i, "end", val)}
                />
              </View>
            ))}

            {/* Entradas por día */}
            <Text style={styles.h2}>Entradas</Text>
            {daysTickets.map((d, i) => {
              const enableEBGen = (parseInt(d.genQty || "0", 10) || 0) > 0;
              const enableEBVip = (parseInt(d.vipQty || "0", 10) || 0) > 0;
              return (
                <View key={`tk-${i}`} style={styles.card}>
                  <Text style={styles.dayTitle}>Día {i + 1}</Text>

                  <Text style={styles.fieldTitle}>Entradas Generales *</Text>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.inputSm]}
                      keyboardType="numeric"
                      value={d.genQty}
                      onChangeText={(v) => setTicket(i, "genQty", v)}
                      placeholder="0"
                    />
                    <TextInput
                      style={[styles.input, styles.inputSm]}
                      keyboardType="numeric"
                      value={d.genPrice}
                      onChangeText={(v) => setTicket(i, "genPrice", v)}
                      placeholder="Precio"
                    />
                  </View>
                  <Text style={styles.hint}>
                    La cantidad ingresada es el total de entradas generales.{"\n"}
                    Si agregas entradas EarlyBirds Generales, estas ya forman
                    parte del total de entradas Generales, no se suman a la
                    cantidad total.{"\n"}
                    Ejemplo: Si ingresas 900 entradas Generales, y 100 Early
                    Birds, el total es 900, no 1000.
                  </Text>

                  <Text style={styles.fieldTitle}>
                    Early Bird General (opcional)
                  </Text>
                  <View style={styles.row}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputSm,
                        !enableEBGen && styles.inputDisabled,
                      ]}
                      keyboardType="numeric"
                      value={d.ebGenQty}
                      onChangeText={(v) => setTicket(i, "ebGenQty", v)}
                      placeholder="0"
                      editable={enableEBGen}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputSm,
                        !enableEBGen && styles.inputDisabled,
                      ]}
                      keyboardType="numeric"
                      value={d.ebGenPrice}
                      onChangeText={(v) => setTicket(i, "ebGenPrice", v)}
                      placeholder="Precio EarlyBird"
                      editable={enableEBGen}
                    />
                  </View>

                  <Text style={styles.fieldTitle}>Entradas VIP (opcional)</Text>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.inputSm]}
                      keyboardType="numeric"
                      value={d.vipQty}
                      onChangeText={(v) => setTicket(i, "vipQty", v)}
                      placeholder="0"
                    />
                    <TextInput
                      style={[styles.input, styles.inputSm]}
                      keyboardType="numeric"
                      value={d.vipPrice}
                      onChangeText={(v) => setTicket(i, "vipPrice", v)}
                      placeholder="Precio"
                    />
                  </View>
                  <Text style={styles.hint}>
                    La cantidad ingresada es el total de entradas vip.{"\n"}
                    Si agregas entradas EarlyBirds Vip, no se suman a la
                    cantidad total.{"\n"}
                    Ejemplo: Si ingresas 800 entradas Vip, y 200 Early Birds, el
                    total es 800, no 1000.
                  </Text>

                  <Text style={styles.fieldTitle}>
                    Early Bird VIP (opcional)
                  </Text>
                  <View style={styles.row}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputSm,
                        !enableEBVip && styles.inputDisabled,
                      ]}
                      keyboardType="numeric"
                      value={d.ebVipQty}
                      onChangeText={(v) => setTicket(i, "ebVipQty", v)}
                      placeholder="0"
                      editable={enableEBVip}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputSm,
                        !enableEBVip && styles.inputDisabled,
                      ]}
                      keyboardType="numeric"
                      value={d.ebVipPrice}
                      onChangeText={(v) => setTicket(i, "ebVipPrice", v)}
                      placeholder="Precio EarlyBird"
                      editable={enableEBVip}
                    />
                  </View>

                  <Text style={[styles.totalLine]}>
                    Total de entradas del día:{" "}
                    <Text style={{ color: GREEN, fontWeight: "700" }}>
                      {totalPerDay(d)}
                    </Text>
                  </Text>
                </View>
              );
            })}

            {/* Config de entradas por día (directo) */}
            <Text style={styles.h2}>Configuración de entradas</Text>
            {daySaleConfigs.map((cfg, i) => (
              <View key={`cfg-${i}`} style={styles.card}>
                <Text style={styles.dayTitle}>Día {i + 1}</Text>
                <Text style={styles.label}>Inicio de venta</Text>
                <DirectDateTimeField
                  value={cfg.saleStart}
                  onChange={(val) => setSaleCfg(i, "saleStart", val)}
                />
                <Text style={[styles.label, { marginTop: 8 }]}>
                  Vender Generales/VIP hasta
                </Text>
                <DirectDateTimeField
                  value={cfg.sellUntil}
                  onChange={(val) => setSaleCfg(i, "sellUntil", val)}
                />
              </View>
            ))}

            {/* Multimedia */}
            <Text style={styles.h2}>Multimedia</Text>
            <View style={styles.card}>
              <Text style={styles.label}>
                Foto <Text style={{ color: COLORS.negative }}>(obligatoria)</Text>
              </Text>
              <View style={[styles.row, { justifyContent: "space-between" }]}>
                <TouchableOpacity style={styles.fileBtn} onPress={handleSelectPhoto}>
                  <Text style={styles.fileBtnText}>SELECCIONAR ARCHIVO</Text>
                </TouchableOpacity>
                <Text style={styles.fileName}>
                  {photoFile ? "Archivo seleccionado" : "Ninguno…"}
                </Text>
              </View>
              <Text style={styles.hint}>
                La imagen debe pesar menos de 2MB y ser JPG, JPEG o PNG
              </Text>

              {photoFile && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Previsualización:</Text>
                  <Image source={{ uri: photoFile }} style={styles.previewImage} />
                </View>
              )}

              <Text style={[styles.label, { marginTop: 12 }]}>Video (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Pega el link de YouTube aquí"
                value={videoLink}
                onChangeText={setVideoLink}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>
                Música (SoundCloud – opcional)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Pega el link de SoundCloud aquí"
                value={musicLink}
                onChangeText={setMusicLink}
              />
            </View>

            {/* T&C + Submit */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setAcceptedTC(!acceptedTC)}
              >
                <View style={[styles.checkBox, acceptedTC && styles.checkBoxOn]} />
                <Text style={styles.checkText}>
                  Acepto{" "}
                  <Text style={styles.link} onPress={openTycModal}>
                    términos y condiciones
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>CREAR EVENTO</Text>
              </TouchableOpacity>

              <Text style={[styles.totalLine, { textAlign: "center" }]}>
                Total general de entradas:{" "}
                <Text style={{ color: GREEN, fontWeight: "700" }}>{grandTotal}</Text>
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
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textPrimary} />
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
                  <TouchableOpacity style={styles.fileBtn} onPress={openTycModal}>
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
                          style={{ width: "100%", height: "100%", border: "none" }}
                          title="Términos y Condiciones"
                        />
                      );
                    }
                    return (
                      <View style={styles.center}>
                        <Text style={{ color: COLORS.textSecondary, marginBottom: 10 }}>
                          No se pudo incrustar el PDF en este dispositivo.
                        </Text>
                        <TouchableOpacity
                          style={styles.fileBtn}
                          onPress={() => Linking.openURL(tycUrl!)}
                        >
                          <Text style={styles.fileBtnText}>Abrir en el navegador</Text>
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

/* ========== Estilos ========== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollContent: { padding: 16 },

  /* headers y divisores */
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

  /* cards */
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
  line: {
    height: 1,
    backgroundColor: COLORS.borderInput,
    width: "100%",
    marginVertical: 12,
  },

  /* inputs */
  label: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  inputSm: { width: 140, marginRight: 10 },
  inputDisabled: {
    backgroundColor: COLORS.borderInput,
    color: COLORS.textSecondary,
  },
  hint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },

  /* links */
  link: { color: COLORS.info, textDecorationLine: "underline" },

  /* segment (tipo de evento) */
  segment: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    flexDirection: "row",
    overflow: "hidden",
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentItemOn: {
    backgroundColor: COLORS.primary,
  },
  segmentText: { color: COLORS.textPrimary, fontWeight: "600" },
  segmentTextOn: { color: COLORS.cardBg },

  /* artistas */
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  addIconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  addIconText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginTop: -2,
  },

  artistPickedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  artistPickedName: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  removeBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.negative,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  /* flags */
  flagsRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  checkRow: { flexDirection: "row", alignItems: "center", marginRight: 16 },
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

  /* dropdowns (listas + selector fiestas/artistas) */
  dropdownButton: {
    width: "100%",
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    justifyContent: "center",
  },
  dropdownText: { color: COLORS.textPrimary },
  dropdownContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    marginBottom: 8,
    alignSelf: "center",
    overflow: "hidden",
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  /* bloque recurrente */
  recurringBox: {
    marginTop: 12,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 10,
  },
  recurringTitle: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },

  /* filas */
  row: { flexDirection: "row", alignItems: "center" },
  fieldTitle: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 6,
  },
  dayTitle: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  totalLine: {
    marginTop: 10,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  /* multimedia */
  fileBtn: {
    backgroundColor: COLORS.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.card,
  },
  fileBtnText: { color: "#fff", fontWeight: "700" },
  fileName: { color: COLORS.textSecondary },
  previewImage: {
    width: "100%",
    height: 160,
    borderRadius: RADIUS.card,
    resizeMode: "cover",
  },

  /* submit */
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

  /* modal común (reutilizado) */
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

  /* estado no logueado */
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

  /* chips géneros (visual “píldora”) */
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardBg,
    marginRight: 8,
    marginBottom: 8,
  },
  chipOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  chipTextOn: {
    color: COLORS.cardBg,
    fontWeight: "700",
  },

  /* DateTime botón + modal acciones */
  dtButton: {
    width: "100%",
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  dtButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontFamily: Platform.select({
      ios: "Helvetica Neue",
      android: "Roboto",
      default: "System",
    }),
  },
  modalInner: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  actionBtn: {
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontFamily: Platform.select({
      ios: "Helvetica Neue",
      android: "Roboto",
      default: "System",
    }),
  },
});
