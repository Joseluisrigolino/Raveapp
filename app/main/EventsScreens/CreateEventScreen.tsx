import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
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
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

/** Layout y UI base */
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import TitlePers from "@/components/common/TitleComponent";

/** Estilos globales */
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/** API / helpers */
import {
  ApiGenero,
  fetchGenres,
  createEvent,
  fetchEventsByEstados,
  EventItemWithExtras,
} from "@/utils/events/eventApi";
import { getTycPdfUrl } from "@/utils/tycApi";
import { fetchArtistsFromApi } from "@/utils/artists/artistApi";
import { Artist } from "@/interfaces/Artist";
import { useAuth } from "@/context/AuthContext";

/** Georef */
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
} from "@/utils/georef/georefHelpers";

/** Recurrentes (parties) */
import { getPartiesByUser, createParty, Party } from "@/utils/partysApi";

/** Entradas */
import {
  createEntradasBulk,
  resolveTipoCodes,
  CreateEntradaBody,
} from "@/utils/events/entradaApi";

/** Media */
import { mediaApi } from "@/utils/mediaApi";

/** Componentes (crear) */
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
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png"]);

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

// normalizador simple
const norm = (s: string) =>
  (s || "")
    .normalize("NFD")
    // @ts-ignore - unicode property
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

function extractBackendMessage(e: any): string {
  return (
    e?.response?.data?.message ||
    e?.response?.data?.Message ||
    e?.response?.data?.error ||
    e?.message ||
    "Ocurrió un error inesperado."
  );
}

/** Normaliza “fechas” devueltas por createEvent (tolerante a casing/wrappers) */
type RemoteFecha = { idFecha: string; inicio?: string; fin?: string };
function normalizeRemoteFechas(anyFechas: any): RemoteFecha[] {
  if (!anyFechas) return [];
  const arr = Array.isArray(anyFechas) ? anyFechas : [];
  return arr
    .map((f: any) => {
      const idFecha =
        f?.idFecha ?? f?.IdFecha ?? f?.id ?? f?.Id ?? f?.Id_Fecha ?? "";
      const inicio =
        f?.inicio ?? f?.Inicio ?? f?.fechaInicio ?? f?.FechaInicio ?? f?.start;
      const fin = f?.fin ?? f?.Fin ?? f?.fechaFin ?? f?.FechaFin ?? f?.end;
      return {
        idFecha: String(idFecha || ""),
        inicio: inicio ? String(inicio) : undefined,
        fin: fin ? String(fin) : undefined,
      };
    })
    .filter((x) => x.idFecha);
}
function extractFechasFromCreateResp(resp: any): RemoteFecha[] {
  if (!resp) return [];
  const direct = normalizeRemoteFechas(resp?.fechas);
  if (direct.length) return direct;
  const nest1 = normalizeRemoteFechas(resp?.data?.fechas);
  if (nest1.length) return nest1;
  const nest2 = normalizeRemoteFechas(resp?.evento?.fechas);
  if (nest2.length) return nest2;
  const nest3 = normalizeRemoteFechas(resp?.data?.evento?.fechas);
  if (nest3.length) return nest3;
  return [];
}

/** Mapea fechas locales -> ids remotos por cercanía de inicio */
function mapLocalToRemoteFechaIds(
  locals: DaySchedule[],
  remotes: RemoteFecha[]
): string[] {
  const out: string[] = new Array(locals.length).fill("");

  if (remotes.length === locals.length) {
    for (let i = 0; i < locals.length; i++) {
      out[i] = remotes[i]?.idFecha || "";
    }
    if (out.every(Boolean)) return out;
  }

  const toleranceMs = 12 * 60 * 60 * 1000;
  const used = new Set<number>();
  const parsed = remotes.map((r) => ({
    idFecha: r.idFecha,
    startMs: r.inicio ? new Date(r.inicio).getTime() : NaN,
  }));

  for (let i = 0; i < locals.length; i++) {
    const localStart = locals[i].start
      ? new Date(locals[i].start).getTime()
      : NaN;
    if (!isFinite(localStart)) continue;

    let bestIdx = -1;
    let bestDiff = Number.POSITIVE_INFINITY;

    for (let j = 0; j < parsed.length; j++) {
      if (used.has(j)) continue;
      const remoteStart = parsed[j].startMs;
      if (!isFinite(remoteStart)) continue;
      const diff = Math.abs(remoteStart - localStart);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = j;
      }
    }

    if (bestIdx >= 0 && bestDiff <= toleranceMs) {
      used.add(bestIdx);
      out[i] = parsed[bestIdx].idFecha;
    }
  }

  return out;
}

/** Espera a que la FECHA exista en backend antes de crear entradas */
async function ensureFechaListo(
  idFecha: string,
  tryGetEntradasFecha: (id: string) => Promise<boolean>,
  {
    retries = 6,
    baseDelayMs = 350,
  }: { retries?: number; baseDelayMs?: number } = {}
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    const ok = await tryGetEntradasFecha(idFecha).catch(() => false);
    if (ok) return;
    const delay = baseDelayMs * Math.pow(1.6, i);
    await new Promise((r) => setTimeout(r, delay));
  }
  console.log(
    "[ensureFechaListo] no se confirmó la fecha tras reintentos:",
    idFecha
  );
}

/* ================= Pantalla ================= */
export default function CreateEventScreen() {
  const router = useRouter();

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

  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyLocked, setNewPartyLocked] = useState(false);

  /* --- Ubicación --- */
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

  useEffect(() => {
    if (!isRecurring || !userId) return;
    setPartyLoading(true);
    getPartiesByUser(String(userId))
      .then((arr) => setMyParties(arr))
      .catch(() => setMyParties([]))
      .finally(() => setPartyLoading(false));
  }, [isRecurring, userId]);

  useEffect(() => {
    if (!isRecurring) {
      setSelectedPartyId(null);
      setNewPartyName("");
      setNewPartyLocked(false);
      setShowPartyDropdown(false);
    }
  }, [isRecurring]);

  /* ================= Handlers ================= */
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
  };

  const handleSelectArtistFromSuggestions = (a: Artist) => {
    if (selectedArtists.some((s) => norm(s.name) === norm(a.name))) return;
    setSelectedArtists((prev) => [...prev, a]);
    setArtistInput("");
  };

  const handleRemoveArtist = (name: string) => {
    setSelectedArtists((prev) => prev.filter((x) => x.name !== name));
  };

  const onPickParty = (p: Party) => {
    setSelectedPartyId(p.idFiesta);
    setShowPartyDropdown(false);
    setNewPartyName("");
    setNewPartyLocked(false);
  };
  const onPressAddNewParty = () => {
    const name = newPartyName.trim();
    if (!name) return;
    setNewPartyLocked(true);
  };

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

  // ====== VALIDACIÓN DE ARCHIVO IMAGEN (tamaño y extensión) ======
  const isAllowedExt = (nameOrUri?: string) => {
    if (!nameOrUri) return false;
    const last = nameOrUri.split("?")[0].split("#")[0].split("/").pop() || "";
    const ext = (last.split(".").pop() || "").toLowerCase();
    return ALLOWED_EXTS.has(ext);
  };

  const handleSelectPhoto = async () => {
    try {
      const current = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (current.status !== "granted") {
        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (req.status !== "granted") {
          Alert.alert(
            "Permiso denegado",
            "Necesitamos permiso para acceder a tus fotos."
          );
          return;
        }
      }

      if (Platform.OS === "web") {
        Alert.alert(
          "No soportado en Web",
          "En Web usá el botón 'Subir archivo' (input type=file)."
        );
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        selectionLimit: 1,
      });

      if (res.canceled || !res.assets?.length) return;

      const asset = res.assets[0];
      const uri = asset.uri;

      // 1) Tamaño real del archivo
      const info = await FileSystem.getInfoAsync(uri);
      const size = (info as any)?.size ?? asset.fileSize ?? 0;
      if (size > MAX_IMAGE_BYTES) {
        Alert.alert(
          "Imagen demasiado pesada",
          "La imagen debe pesar menos de 2 MB."
        );
        return; // NO seteamos photoFile
      }

      // 2) Extensión permitida (JPG, JPEG, PNG)
      const filename = asset.fileName || uri.split("/").pop() || "";
      const allowed = isAllowedExt(filename) || isAllowedExt(uri);
      if (!allowed) {
        Alert.alert(
          "Formato no soportado",
          "La imagen debe ser JPG, JPEG o PNG."
        );
        return; // NO seteamos photoFile
      }

      // Si pasó validaciones, recién ahí lo seteamos
      setPhotoFile(uri);
    } catch (e) {
      console.error("ImagePicker error", e);
      Alert.alert("Error", "No se pudo abrir la galería.");
    }
  };

  // Helpers
  const toIso = (d?: Date) => (d ? new Date(d).toISOString() : undefined);

  async function createPendingEntities(userId: string) {
    if (isRecurring && newPartyLocked && newPartyName.trim()) {
      await createParty({
        idUsuario: String(userId),
        nombre: newPartyName.trim(),
        isActivo: true,
      });
    }
    // Si hay artistas nuevos, aquí podrías agregar lógica para crearlos si existe la función correspondiente.
  }

  async function buildEntradasForFechas(
    fechaIds: string[]
  ): Promise<CreateEntradaBody[]> {
    const codes = await resolveTipoCodes();
    const list: CreateEntradaBody[] = [];

    const pushItem = (
      idFecha: string,
      tipo: number,
      qtyStr: string,
      priceStr: string
    ) => {
      const cantidad = parseInt(qtyStr || "0", 10) || 0;
      const precio = parseInt(priceStr || "0", 10) || 0;
      if (idFecha && cantidad > 0 && precio > 0) {
        list.push({ idFecha, tipo, estado: 0, precio, cantidad });
      }
    };

    for (let i = 0; i < daysTickets.length; i++) {
      const idFecha = fechaIds[i] || "";
      const d = daysTickets[i];
      pushItem(idFecha, codes.general, d.genQty, d.genPrice);
      pushItem(idFecha, codes.earlyGeneral, d.ebGenQty, d.ebGenPrice);
      pushItem(idFecha, codes.vip, d.vipQty, d.vipPrice);
      pushItem(idFecha, codes.earlyVip, d.ebVipQty, d.ebVipPrice);
    }
    return list;
  }

  /** Intenta encontrar el idEvento tras crear (cuando el backend sólo devolvió idFecha) */
  async function tryResolveEventIdAfterCreate(
    desiredName: string,
    firstLocalStart?: Date
  ): Promise<string | null> {
    try {
      const estados = [0, 1, 2, 3, 4, 5, 6];
      const all: EventItemWithExtras[] = await fetchEventsByEstados(estados);
      const qName = norm(desiredName);
      const targetTs = firstLocalStart
        ? new Date(firstLocalStart).getTime()
        : NaN;

      const candidates = all.filter((ev) => norm(ev.title || "") === qName);

      if (candidates.length === 1) {
        return String(candidates[0].id);
      }
      if (candidates.length > 1 && isFinite(targetTs)) {
        const scored = candidates
          .map((ev) => {
            const ts = ev?.fechas?.[0]?.inicio
              ? new Date(ev.fechas[0].inicio).getTime()
              : NaN;
            const diff = isFinite(ts)
              ? Math.abs(ts - targetTs)
              : Number.POSITIVE_INFINITY;
            return { ev, diff };
          })
          .sort((a, b) => a.diff - b.diff);
        if (scored[0] && scored[0].diff < 12 * 60 * 60 * 1000) {
          return String(scored[0].ev.id);
        }
      }
      const partial = all.find((ev) => norm(ev.title || "").includes(qName));
      if (partial) return String(partial.id);

      return null;
    } catch (e) {
      console.log("[tryResolveEventIdAfterCreate] error:", e);
      return null;
    }
  }

  /** Verifica si GET /v1/Entrada/GetEntradasFecha responde sin error (sólo existencia) */
  async function probeGetEntradasFecha(idFecha: string): Promise<boolean> {
    try {
      const url = `/v1/Entrada/GetEntradasFecha?IdFecha=${encodeURIComponent(
        idFecha
      )}`;
      const { apiClient } = await import("@/utils/apiConfig");
      const resp = await apiClient.get(url);
      return !!resp;
    } catch {
      return false;
    }
  }

  // Submit final
  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert("Sesión", "Debés iniciar sesión para crear un evento.");
      return;
    }
    if (!eventName.trim()) {
      Alert.alert("Nombre", "Completá el nombre del evento.");
      return;
    }
    if (!photoFile) {
      Alert.alert("Foto obligatoria", "Seleccioná una imagen del evento.");
      return;
    }
    if (!acceptedTC) {
      Alert.alert("Términos", "Debés aceptar los términos y condiciones.");
      return;
    }

    try {
      await createPendingEntities(String(userId)).catch((e) => {
        throw new Error(extractBackendMessage(e));
      });

      const artistIds = selectedArtists
        .map((a) => a.idArtista || (a as any).id || (a as any).IdArtista)
        .filter(Boolean)
        .map(String);

      const fechasPayload = daySchedules.map((sch, i) => ({
        inicio: toIso(sch.start),
        fin: toIso(sch.end),
        inicioVenta: toIso(daySaleConfigs[i]?.saleStart),
        finVenta: toIso(daySaleConfigs[i]?.sellUntil),
        estado: 0,
      }));

      const domicilio = {
        localidad: { nombre: localityName, codigo: localityId },
        municipio: { nombre: municipalityName, codigo: municipalityId },
        provincia: { nombre: provinceName, codigo: provinceId },
        direccion: street,
        latitud: 0,
        longitud: 0,
      };

      // 🔑 clave: mandar null si no hay fiesta
      const idFiestaValue = selectedPartyId ? String(selectedPartyId) : null;

      const body: any = {
        idUsuario: String(userId),
        idArtistas: artistIds as string[],
        domicilio,
        nombre: eventName.trim(),
        descripcion: eventDescription?.trim() ?? "",
        genero: selectedGenres,
        isAfter,
        isLgbt: isLGBT,
        inicioVenta: toIso(daySaleConfigs[0]?.saleStart),
        finVenta: toIso(daySaleConfigs[daySaleConfigs.length - 1]?.sellUntil),
        estado: 0,
        fechas: fechasPayload,
        soundCloud: musicLink?.trim() || "",
        idFiesta: idFiestaValue,
      };
      // Si preferís OMITE la propiedad cuando no hay fiesta:
      // if (idFiestaValue === null) delete body.idFiesta;

      console.log("[CreateEvent] payload:", JSON.stringify(body, null, 2));

      // 1) Crear evento
      let resp: any;
      try {
        resp = await createEvent(body);
      } catch (e: any) {
        Alert.alert("Error al crear el evento", extractBackendMessage(e));
        return;
      }

      try {
        const preview = JSON.stringify(resp, null, 2);
        console.log(
          "[CreateEvent] raw response (first 2KB):",
          preview.length > 2000
            ? preview.slice(0, 2000) + " …(truncado)"
            : preview
        );
      } catch {
        console.log("[CreateEvent] raw response: <no JSON serializable>");
      }

      // 2) Resolver fechas devueltas
      const remoteFechas = extractFechasFromCreateResp(resp);

      // 2.a) Resolver idEvento (si existiera)
      let idEvento: string | null =
        typeof resp !== "string"
          ? resp?.idEvento ??
            resp?.id ??
            resp?.Id ??
            resp?.Id_Evento ??
            resp?.data?.idEvento ??
            resp?.data?.id ??
            null
          : null;

      // 2.b) Resolver fechaIds para cada día local
      let fechaIds: string[] = [];
      if (remoteFechas.length) {
        fechaIds = mapLocalToRemoteFechaIds(daySchedules, remoteFechas);
        if (
          fechaIds.filter(Boolean).length !== daySchedules.length &&
          remoteFechas.length === daySchedules.length
        ) {
          fechaIds = remoteFechas.map((f) => f.idFecha);
        }
      } else if (typeof resp === "string") {
        // Backend devuelve un único idFecha
        fechaIds = new Array(dayCount).fill(resp);
      }

      console.log("[CreateEvent] fechaIds resueltas:", fechaIds);

      if (fechaIds.filter(Boolean).length !== dayCount) {
        Alert.alert(
          "Error",
          "No se pudieron confirmar las fechas del evento a partir de la respuesta del backend."
        );
        return;
      }

      // 2.c) Si no hay idEvento, intentar resolver por nombre/fecha
      if (!idEvento) {
        idEvento = await tryResolveEventIdAfterCreate(
          eventName.trim(),
          daySchedules[0]?.start
        );
        console.log("[CreateEvent] idEvento resuelto por búsqueda:", idEvento);
      }

      // 3) Mitigar 500: esperar a que la fecha exista
      await ensureFechaListo(fechaIds[0], probeGetEntradasFecha, {
        retries: 6,
        baseDelayMs: 350,
      });

      // 4) Subir imagen si tenemos idEvento
      if (photoFile && idEvento) {
        const filename = photoFile.split("/").pop() || "evento.jpg";
        const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
        const type = `image/${ext?.toLowerCase() === "png" ? "png" : "jpeg"}`;
        // @ts-ignore - RN FormData file shape
        const file: any = { uri: photoFile, name: filename, type };
        console.log("[Media] subiendo imagen:", { idEvento, filename, type });
        try {
          await mediaApi.upload(idEvento, file);
          console.log("[Media] subida OK");
        } catch (e: any) {
          console.log("[Media] subida FALLÓ:", extractBackendMessage(e));
          Alert.alert(
            "Aviso",
            "El evento se creó, pero la imagen no se pudo subir: " +
              extractBackendMessage(e)
          );
        }
      } else if (photoFile && !idEvento) {
        console.log(
          "[Media] se omitió la subida: no se pudo resolver idEvento."
        );
        Alert.alert(
          "Aviso",
          "No pude identificar el ID del evento recién creado. La imagen no fue subida."
        );
      }

      // 5) Crear entradas
      try {
        const entradas = await buildEntradasForFechas(fechaIds);
        console.log("[Entradas] payload a crear:", entradas);
        if (entradas.length) {
          await createEntradasBulk(entradas);
          console.log("[Entradas] creación OK");
        } else {
          console.log(
            "[Entradas] no hay items para crear (cantidades o precios en 0)"
          );
        }
      } catch (e: any) {
        console.log("[Entradas] creación FALLÓ:", extractBackendMessage(e));
        Alert.alert("Error al crear las entradas", extractBackendMessage(e));
        return;
      }

      Alert.alert("Éxito", "Evento y entradas creados correctamente.", [
        {
          text: "OK",
          onPress: () => router.push("../owner/ManageEventScreen"),
        },
      ]);
    } catch (e: any) {
      const msg = extractBackendMessage(e);
      console.error("[CreateEvent] error:", e);
      Alert.alert("Error", msg);
    }
  };

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
            <View className="divider" style={styles.divider} />

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

            <Text style={styles.h2}>Género/s musical/es</Text>
            <GenreSelector
              genres={genres}
              selectedGenres={selectedGenres}
              onToggle={toggleGenre}
            />

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
                } catch {}
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
                } catch {}
              }}
              handleSelectLocality={(id: string, name: string) => {
                setLocalityId(id);
                setLocalityName(name);
                setShowLocalities(false);
              }}
            />

            <Text style={styles.h2}>Descripción</Text>
            <DescriptionField
              value={eventDescription}
              onChange={setEventDescription}
            />

            <Text style={styles.h2}>Fecha y hora del evento</Text>
            <ScheduleSection
              daySchedules={daySchedules}
              setSchedule={setSchedule}
            />

            <Text style={styles.h2}>Entradas</Text>
            <TicketSection
              daysTickets={daysTickets}
              setTicket={setTicket}
              totalPerDay={(d) =>
                (parseInt(d.genQty || "0", 10) || 0) +
                (parseInt(d.vipQty || "0", 10) || 0)
              }
            />

            <Text style={styles.h2}>Configuración de entradas</Text>
            <TicketConfigSection
              daySaleConfigs={daySaleConfigs}
              setSaleCfg={setSaleCfg}
            />

            <Text style={styles.h2}>Multimedia</Text>
            <MediaSection
              photoFile={photoFile}
              videoLink={videoLink}
              musicLink={musicLink}
              onSelectPhoto={handleSelectPhoto}
              onChangeVideo={setVideoLink}
              onChangeMusic={setMusicLink}
            />

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
                    style={styles.button}
                    onPress={openTycModal}
                  >
                    <Text style={styles.buttonText}>Reintentar</Text>
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
                      // @ts-ignore
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
                          style={styles.button}
                          onPress={() => Linking.openURL(tycUrl!)}
                        >
                          <Text style={styles.buttonText}>
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

  link: { color: COLORS.info, textDecorationLine: "underline" },

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
  totalLine: { marginTop: 10, fontWeight: "600", color: COLORS.textPrimary },

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
