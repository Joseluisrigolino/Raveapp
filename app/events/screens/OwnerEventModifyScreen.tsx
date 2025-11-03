// app/owner/ModifyEventScreen.tsx migrated to app/events/screens
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, Modal, ActivityIndicator, Linking, Platform, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getInfoAsync } from "expo-file-system/legacy";
import DateTimePicker from "@react-native-community/datetimepicker";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TitlePers from "@/components/common/TitleComponent";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

import {
  ApiGenero,
  fetchGenres,
  fetchEventById,
  updateEvent,
} from "@/app/events/apis/eventApi";
import { getTycPdfUrl } from "@/app/tyc/api/tycApi";
import { fetchArtistsFromApi, createArtist } from "@/app/artists/apis/artistApi";
import { Artist } from "@/app/artists/types/Artist";
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
} from "@/app/apis/georefHelpers";
import { useAuth } from "@/app/auth/AuthContext";

type EventType = "1d" | "2d" | "3d";
type ArtistSel = {
  idArtista: string;
  name: string;
  image: string;
  description: string;
  creationDate: string;
  isActivo: boolean;
  instagramURL: string;
  spotifyURL: string;
  soundcloudURL: string;
  __isNew?: boolean;
};

const GREEN = "#17a34a";
const createEmptyDayTickets = (): any => ({ genQty: "0", genPrice: "", ebGenQty: "0", ebGenPrice: "", vipQty: "0", vipPrice: "", ebVipQty: "0", ebVipPrice: "" });
const createEmptySchedule = (): any => ({ start: new Date(), end: new Date() });
const createEmptySaleConfig = (): any => ({ saleStart: new Date(), sellUntil: new Date() });
const norm = (s: string) => (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

function DirectDateTimeField({ value, onChange, placeholder = "Seleccionar fecha y hora" }: { value: Date; onChange: (d: Date) => void; placeholder?: string }) {
  const colorScheme = useColorScheme();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [tmpDate, setTmpDate] = useState<Date>(value || new Date());
  const fmt = (d?: Date) => d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : placeholder;
  const pickerCommonPropsDate: any = Platform.OS === "ios" ? { textColor: "#111111" } : { themeVariant: "light" };
  const pickerCommonPropsTime: any = Platform.OS === "ios" ? { textColor: "#111111" } : { themeVariant: "light", is24Hour: true };

  return (
    <>
      <TouchableOpacity style={styles.dtButton} onPress={() => { setTmpDate(value || new Date()); setShowDate(true); }}>
        <MaterialCommunityIcons name="calendar-clock" size={18} color={"#111"} style={{ marginRight: 6 }} />
        <Text style={styles.dtButtonText}>{fmt(value)}</Text>
      </TouchableOpacity>

      <Modal visible={showDate} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.modalInner, { backgroundColor: "#fff" }]}>
            <Text style={styles.modalTitle}>Seleccionar fecha</Text>
            <DateTimePicker value={tmpDate} mode="date" display={Platform.OS === "ios" ? "spinner" : "calendar"} {...pickerCommonPropsDate} onChange={(_, d) => { if (d) setTmpDate(d); }} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#E5E7EB" }]} onPress={() => setShowDate(false)}>
                <Text style={[styles.actionText, { color: "#111" }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: GREEN }]} onPress={() => { setShowDate(false); setShowTime(true); }}>
                <Text style={styles.actionText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showTime} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.modalInner, { backgroundColor: "#fff" }]}>
            <Text style={styles.modalTitle}>Seleccionar hora</Text>
            <DateTimePicker value={tmpDate} mode="time" display={Platform.OS === "ios" ? "spinner" : "clock"} {...pickerCommonPropsTime} onChange={(_, d) => { if (d) { const merged = new Date(tmpDate); merged.setHours(d.getHours(), d.getMinutes(), 0, 0); setTmpDate(merged); } }} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#E5E7EB" }]} onPress={() => setShowTime(false)}>
                <Text style={[styles.actionText, { color: "#111" }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: GREEN }]} onPress={() => { setShowTime(false); onChange(tmpDate); }}>
                <Text style={styles.actionText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function ModifyEventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const eventId = (id ?? "").toString();
  const { user } = useAuth();
  const mustShowLogin = !user || (user as any)?.role === "guest";

  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  const [eventType, setEventType] = useState<EventType>("1d");
  const dayCount = useMemo(() => (eventType === "1d" ? 1 : eventType === "2d" ? 2 : 3), [eventType]);

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  const [genres, setGenres] = useState<ApiGenero[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  const [artistInput, setArtistInput] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<ArtistSel[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[] | null>(null);
  const [artistLoading, setArtistLoading] = useState(false);
  const [showArtistSuggestions, setShowArtistSuggestions] = useState(false);

  const [provinces, setProvinces] = useState<{ id: string; nombre: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<{ id: string; nombre: string }[]>([]);
  const [localities, setLocalities] = useState<{ id: string; nombre: string }[]>([]);
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

  const [daySchedules, setDaySchedules] = useState<any[]>([createEmptySchedule() as any]);
  const [daysTickets, setDaysTickets] = useState<any[]>([createEmptyDayTickets()]);
  const [daySaleConfigs, setDaySaleConfigs] = useState<any[]>([createEmptySaleConfig()]);

  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [musicLink, setMusicLink] = useState("");

  const [acceptedTC, setAcceptedTC] = useState(true);
  const [tycVisible, setTycVisible] = useState(false);
  const [tycUrl, setTycUrl] = useState<string | null>(null);
  const [tycLoading, setTycLoading] = useState(false);
  const [tycError, setTycError] = useState<string | null>(null);

  const buildViewerUrl = (url: string) => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      return `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(url)}`;
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

  useEffect(() => {
    fetchProvinces().then(setProvinces).catch((err) => console.error("Error fetchProvinces:", err));
  }, []);
  useEffect(() => { let mounted = true; (async () => { const list = await fetchGenres(); if (mounted) setGenres(list); })(); return () => { mounted = false; }; }, []);
  useEffect(() => {
    const q = norm(artistInput);
    if (q.length === 0) { setShowArtistSuggestions(false); return; }
    setShowArtistSuggestions(true);
    if (allArtists === null && !artistLoading) {
      setArtistLoading(true);
      fetchArtistsFromApi().then((arr) => setAllArtists(arr)).catch((e) => { console.error("fetchArtistsFromApi", e); setAllArtists([]); }).finally(() => setArtistLoading(false));
    }
  }, [artistInput, allArtists, artistLoading]);

  useEffect(() => {
    if (!eventId) return;
    let mounted = true;
    (async () => {
      try {
        setInitialLoading(true);
        setInitialError(null);

        const ev = await fetchEventById(eventId);
        if (!mounted) return;

        setEventName(ev.title || "");
        setEventDescription(ev.description || "");

        const dias = Math.max(1, ev.fechas?.length || 1);
        const type: EventType = dias === 1 ? "1d" : dias === 2 ? "2d" : "3d";
        setEventType(type);

        const sch: any[] = (ev.fechas || []).slice(0, 3).map((f) => ({ start: f.inicio ? new Date(f.inicio) : new Date(), end: f.fin ? new Date(f.fin) : new Date() })) || [];
        setDaySchedules(sch.length ? sch : [createEmptySchedule() as any]);

        setDaysTickets(Array.from({ length: dias }, createEmptyDayTickets));
        setDaySaleConfigs(Array.from({ length: dias }, createEmptySaleConfig));

        setSelectedGenres(Array.isArray(ev.genero) ? ev.genero : []);

        const artistasFromApi: ArtistSel[] = Array.isArray(ev.artistas)
          ? ev.artistas.map((a: any) => ({
              idArtista: a?.idArtista,
              name: a?.nombre ?? a?.name ?? "",
              image: a?.imagen ?? a?.image ?? "",
              description: a?.bio ?? a?.description ?? "",
              creationDate: a?.dtAlta ?? a?.creationDate ?? "",
              isActivo: a?.isActivo === undefined ? true : Boolean(a.isActivo),
              instagramURL: a?.socials?.mdInstagram ?? a?.instagramURL ?? "",
              spotifyURL: a?.socials?.mdSpotify ?? a?.spotifyURL ?? "",
              soundcloudURL: a?.socials?.mdSoundcloud ?? a?.soundcloudURL ?? "",
            }))
          : [];
        setSelectedArtists(artistasFromApi);

  } catch (e: any) { console.error("Error cargando evento para modificar", e); setInitialError(String((e && e.message) || e)); }
      finally { setInitialLoading(false); }
    })();
    return () => { mounted = false; };
  }, [eventId]);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ padding: 12 }}>
          <TitlePers text={eventName || "Modificar evento"} />
          {initialLoading ? <ActivityIndicator /> : null}
        </View>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  dtButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, backgroundColor: '#fff' },
  dtButtonText: { marginLeft: 6 },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { width: '90%', borderRadius: 12, padding: 12 },
  modalInner: { maxWidth: 420 },
  modalTitle: { fontWeight: '700', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionBtn: { padding: 10, borderRadius: 8 },
  actionText: { color: '#fff' },
});
