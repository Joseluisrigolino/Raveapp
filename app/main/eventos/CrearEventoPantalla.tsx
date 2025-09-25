import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { ROUTES } from "../../../routes";

/** Layout y UI base */
import Header from "@/components/layout/HeaderComponent";
import * as nav from "@/utils/navigation";
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
import CirculoCarga from '@/components/general/CirculoCarga';

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
  const toggleGenre = useCallback((id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const addArtistByName = useCallback((nameRaw: string) => {
    const name = nameRaw.trim();
    if (!name) return;
    if (selectedArtists.some((a) => norm(a.name) === norm(name))) {
      setArtistInput("");
      return;
    }
    setSelectedArtists((prev) => [...prev, { name, image: "" } as ArtistSel]);
    setArtistInput("");
  }, [selectedArtists]);

  const handleSelectArtistFromSuggestions = useCallback((a: Artist) => {
    if (selectedArtists.some((s) => norm(s.name) === norm(a.name))) return;
    setSelectedArtists((prev) => [...prev, a]);
    setArtistInput("");
  }, [selectedArtists]);

  const handleRemoveArtist = useCallback((name: string) => {
    setSelectedArtists((prev) => prev.filter((x) => x.name !== name));
  }, []);

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

  const setSchedule = useCallback((i: number, key: keyof DaySchedule, val: Date) => {
    setDaySchedules((prev) => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [key]: val };
      return arr;
    });
  }, []);
  const setSaleCfg = useCallback((i: number, key: keyof DaySaleConfig, val: Date) => {
    setDaySaleConfigs((prev) => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [key]: val };
      return arr;
    });
  }, []);
  const setTicket = useCallback((i: number, key: keyof DayTickets, val: string) => {
    setDaysTickets((prev) => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [key]: val.replace(/[^0-9]/g, "") };
      return arr;
    });
  }, []);

  // Estados de carga para evitar bloquear la UI en Android
  const [municipalityLoading, setMunicipalityLoading] = useState(false);
  const [localityLoading, setLocalityLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Handlers no bloqueantes para selección de provincia/municipio/localidad
  const handleSelectProvinceCallback = useCallback((id: string, name: string) => {
    // Actualizamos UI inmediatamente
    setProvinceId(id);
    setProvinceName(name);
    setMunicipalityId("");
    setMunicipalityName("");
    setLocalityId("");
    setLocalityName("");
    setMunicipalities([]);
    setLocalities([]);
    setShowProvinces(false);

    // Cargamos municipios en background para no bloquear la UI (Android)
    setTimeout(async () => {
      setMunicipalityLoading(true);
      try {
        const mun = await fetchMunicipalities(id);
        setMunicipalities(mun);
      } catch (e) {
        console.warn("Error fetchMunicipalities:", e);
        setMunicipalities([]);
      } finally {
        setMunicipalityLoading(false);
      }
    }, 0);
  }, []);

  const handleSelectMunicipalityCallback = useCallback((id: string, name: string) => {
    setMunicipalityId(id);
    setMunicipalityName(name);
    setLocalityId("");
    setLocalityName("");
    setLocalities([]);
    setShowMunicipalities(false);

    setTimeout(async () => {
      setLocalityLoading(true);
      try {
        const loc = await fetchLocalities(provinceId, id);
        setLocalities(loc);
      } catch (e) {
        console.warn("Error fetchLocalities:", e);
        setLocalities([]);
      } finally {
        setLocalityLoading(false);
      }
    }, 0);
  }, [provinceId]);

  const handleSelectLocalityCallback = useCallback((id: string, name: string) => {
    setLocalityId(id);
    setLocalityName(name);
    setShowLocalities(false);
  }, []);

  // VALIDACIONES extra antes de submit
  const validateBeforeSubmit = useCallback(() => {
    // 1) Género obligatorio
    if (!selectedGenres || selectedGenres.length === 0) {
      Alert.alert('Validación', 'Debe seleccionar al menos un género musical.');
      return false;
    }
    // 2) Descripción obligatoria
    if (!eventDescription || !eventDescription.trim()) {
      Alert.alert('Validación', 'La descripción es obligatoria.');
      return false;
    }
    // 3) Fechas: inicio/fin deben ser > ahora y fin > inicio y no misma hora exacta
    const now = Date.now();
    for (let i = 0; i < daySchedules.length; i++) {
      const s = daySchedules[i].start ? new Date(daySchedules[i].start).getTime() : NaN;
      const e = daySchedules[i].end ? new Date(daySchedules[i].end).getTime() : NaN;
      if (!isFinite(s) || !isFinite(e)) {
        Alert.alert('Validación', `La fecha de inicio y fin del día ${i + 1} son obligatorias.`);
        return false;
      }
      if (s <= now) {
        Alert.alert('Validación', `La fecha de inicio del día ${i + 1} debe ser posterior al momento actual.`);
        return false;
      }
      if (e <= now) {
        Alert.alert('Validación', `La fecha de fin del día ${i + 1} debe ser posterior al momento actual.`);
        return false;
      }
      if (e <= s) {
        Alert.alert('Validación', `La fecha de fin del día ${i + 1} debe ser posterior a la fecha de inicio.`);
        return false;
      }
      // No permitir misma hora exacta
      const sameHour = Math.abs(e - s) < 60 * 60 * 1000 && new Date(e).getHours() === new Date(s).getHours() && new Date(e).getDate() === new Date(s).getDate();
      if (sameHour) {
        Alert.alert('Validación', `La fecha de fin del día ${i + 1} no puede estar en la misma hora que el inicio.`);
        return false;
      }
    }

    // 4) Si provincia es CABA (02), forzamos skip municipio y requerimos localidad
    if (provinceId === '02') {
      if (!localityId) {
        Alert.alert('Validación', 'Debe seleccionar una localidad en Ciudad Autónoma de Buenos Aires.');
        return false;
      }
    } else {
      // fuera de CABA: municipio y localidad obligatorios
      if (!municipalityId) {
        Alert.alert('Validación', 'Debe seleccionar un municipio.');
        return false;
      }
      if (!localityId) {
        Alert.alert('Validación', 'Debe seleccionar una localidad.');
        return false;
      }
    }

    return true;
  }, [selectedGenres, eventDescription, daySchedules, provinceId, municipalityId, localityId]);

  // Helpers
  const toIso = (d?: Date) => (d ? new Date(d).toISOString() : undefined);

  async function createPendingEntities(userId: string) {
    const result: { partyCreated?: any } = {};
    if (isRecurring && newPartyLocked && newPartyName.trim()) {
      const payload = {
        idUsuario: String(userId),
        nombre: newPartyName.trim(),
        isActivo: true,
      };
      console.log("[PendingEntities] creando fiesta recurrente con payload:", payload);
      try {
        const created = await createParty(payload);
        result.partyCreated = created;
        console.log("[PendingEntities] fiesta recurrente creada:", created);
      } catch (e: any) {
        console.error("[PendingEntities] error creando fiesta:", extractBackendMessage(e));
        throw e;
      }
    }
    // Si hay artistas nuevos, aquí podrías agregar lógica para crearlos si existe la función correspondiente.
    return result;
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

  // Helper: validar extensión permitida a partir de un nombre o URI
  const isAllowedExt = (nameOrUri?: string | null): boolean => {
    if (!nameOrUri) return false;
    const cleaned = String(nameOrUri).split("?")[0].split("#")[0];
    const parts = cleaned.split(".");
    if (parts.length < 2) return false;
    const ext = parts.pop()!.toLowerCase();
    return ALLOWED_EXTS.has(ext);
  };

  // Helper: obtener tamaño de archivo de forma robusta.
  // Intenta fetch->blob (funciona en web y RN), y si falla usa expo-file-system como fallback.
  async function getFileSize(uri: string): Promise<number> {
    try {
      // Intentamos fetch primero
      const res = await fetch(uri);
      if (!res.ok) throw new Error("fetch no OK");
      // @ts-ignore - blob puede no estar tipado en entornos RN
      const blob = await res.blob();
      if (blob && typeof blob.size === "number") return blob.size;
    } catch (e) {
      console.warn("[getFileSize] fetch->blob falló, intentando fallback expo-file-system:", e);
      try {
        if (Platform.OS !== "web") {
          const FileSystem = await import("expo-file-system");
          const info = await FileSystem.getInfoAsync(uri);
          if (info && typeof (info as any).size === "number") return (info as any).size;
        }
      } catch (err) {
        console.warn("[getFileSize] fallback FileSystem falló:", err);
      }
    }
    return 0; // no pudimos determinar tamaño
  }

  // Submit final
  const handleSubmit = useCallback(async () => {
    console.log('[CreateEvent] Inicio del flujo de creación. Resumen inicial:', {
      dayCount,
      eventName,
      eventType,
      isRecurring,
      selectedArtists: selectedArtists.map((a) => ({ id: (a as any).idArtista ?? (a as any).id, name: (a as any).name })),
      selectedGenres,
      selectedPartyId,
      userId,
    });

    try {
      if (!userId) throw new Error('Usuario no autenticado.');
      // Validaciones mínimas
      if (!eventName || !acceptedTC) throw new Error('Complete nombre de evento y acepte T&C.');

      // 1) Crear entidades pendientes (fiesta recurrente, etc.)
      const pending = await createPendingEntities(userId).catch((e) => {
        console.warn('[CreateEvent] createPendingEntities fallo, se continúa:', e);
        return {} as any;
      });
      console.log('[CreateEvent] pending entities result:', pending);

      // 2) Construir body y llamar createEvent
      const body = {
        descripcion: eventDescription || "",
        domicilio: {
          direccion: street || "",
          latitud: 0,
          longitud: 0,
          provincia: { codigo: provinceId, nombre: provinceName },
          municipio: { codigo: municipalityId, nombre: municipalityName },
          localidad: { codigo: localityId, nombre: localityName },
        },
        estado: 0,
        fechas: daySchedules.map((d, i) => ({
          inicio: toIso(d.start),
          fin: toIso(d.end),
          inicioVenta: toIso(daySaleConfigs[i]?.saleStart),
          finVenta: toIso(daySaleConfigs[i]?.sellUntil),
          estado: 0,
        })),
        genero: selectedGenres,
        idArtistas: selectedArtists.map((a) => (a as any).idArtista ?? (a as any).id).filter(Boolean),
        idFiesta: selectedPartyId || null,
        idUsuario: userId,
        inicioVenta: toIso(daySaleConfigs[0]?.saleStart),
        finVenta: toIso(daySaleConfigs[0]?.sellUntil),
        isAfter,
        isLgbt: isLGBT,
        nombre: eventName,
        soundCloud: musicLink || "",
      };

      console.log('[CreateEvent] payload que se enviará a createEvent:', JSON.parse(JSON.stringify(body)));

      const createResult = await createEvent(body);
      console.log('[CreateEvent] respuesta cruda del backend:', createResult);

      // 3) Extraer fechas devueltas por el backend
      let remoteFechas = extractFechasFromCreateResp(createResult as any);
      console.log('[CreateEvent] remoteFechas extraídas:', remoteFechas);

      // 4) Si no hay fechas, intentamos determinar si el createResult es idFecha o idEvento
      let fechaIds: string[] = [];

      const entradaApi = await import('@/utils/events/entradaApi');
      const eventApi = await import('@/utils/events/eventApi');

      // Si el backend devolvió un string (posible idEvento o idFecha)
      if (!remoteFechas.length && typeof createResult === 'string' && createResult.trim()) {
        const candidate = String(createResult).trim();
        // 4.a) Probar si es un idFecha válido (GET entradas fecha responde OK)
        const esFecha = await probeGetEntradasFecha(candidate).catch(() => false);
        if (esFecha) {
          console.log('[CreateEvent] backend devolvió un idFecha simple:', [candidate]);
          fechaIds = [candidate];
        } else {
          // 4.b) Probar si es idEvento y obtener sus fechas
          try {
            const ev = await eventApi.fetchEventById(candidate);
            const fromEvent = ev?.fechas?.map((f: any) => String(f?.idFecha).trim()).filter(Boolean) || [];
            if (fromEvent.length) {
              console.log('[CreateEvent] fechas obtenidas consultando evento por id:', fromEvent);
              remoteFechas = fromEvent.map((id: string) => ({ idFecha: id }));
            }
          } catch (e) {
            console.warn('[CreateEvent] fetchEventById no resolvió fechas para:', candidate, e);
          }
        }
      }

      // 5) Si ahora tenemos remoteFechas, mapear a ids por cercanía
      if (remoteFechas.length) {
        const mapped = mapLocalToRemoteFechaIds(daySchedules, remoteFechas as any);
        fechaIds = mapped.filter(Boolean);
      }

      // 6) Si aún no hay fechaIds, intentar resolución por búsqueda general (nombre/fecha)
      if (!fechaIds.length) {
        try {
          const maybeEventId = await tryResolveEventIdAfterCreate(eventName, daySchedules[0]?.start);
          if (maybeEventId) {
            const ev = await eventApi.fetchEventById(maybeEventId);
            const fromEvent = ev?.fechas?.map((f: any) => String(f?.idFecha).trim()).filter(Boolean) || [];
            if (fromEvent.length) {
              console.log('[CreateEvent] fechas obtenidas tras tryResolveEventIdAfterCreate:', fromEvent);
              remoteFechas = fromEvent.map((id: string) => ({ idFecha: id }));
              fechaIds = fromEvent;
            }
          }
        } catch (e) {
          console.warn('[CreateEvent] intento adicional para resolver idEvento/fechas falló', e);
        }
      }

      console.log('[CreateEvent] fechaIds resueltas finales:', fechaIds);

      if (!fechaIds.length) {
        console.error('[CreateEvent] No se pudieron resolver ids de fecha. No se crearán entradas.');
        Alert.alert('Error', 'No se pudieron obtener los IDs de las fechas del evento. Revise la consola para más detalles.');
        return; // no navegamos
      }

      // 7) Esperar a que las fechas estén visibles en backend (poll)
      for (const idF of fechaIds) {
        await entradaApi.ensureFechaListo(idF).catch(() => {
          console.warn('[CreateEvent] ensureFechaListo no confirmó fecha:', idF);
        });
      }

      // 8) Crear entradas
      const entradasPayload = await buildEntradasForFechas(fechaIds);
      console.log('[Entradas] payload a crear:', JSON.parse(JSON.stringify(entradasPayload)));
      try {
        await entradaApi.createEntradasBulk(entradasPayload);
        console.log('[Entradas] creación OK');
      } catch (e: any) {
        console.error('[Entradas] creación FALLÓ:', e?.message || e);
        Alert.alert('Error al crear entradas', e?.message || 'Fallo al crear las entradas. Revise la consola.');
        return; // no navegamos
      }

      // 9) Subir media (si corresponde) — no bloqueante para la navegación final
      try {
        if (photoFile) {
          const fn = photoFile.split('/').pop() || 'image.jpg';
          const fileObj = { name: fn, type: 'image/jpeg', uri: photoFile } as any;
          console.log('[Media] subiendo imagen con payload:', JSON.parse(JSON.stringify({ file: { name: fn, type: 'image/jpeg' } }))); 
          const mediaApi = (await import('@/utils/mediaApi')).mediaApi;

          // Preferimos subir la media asignada a la entidad EVENTO (IdEntidadMedia).
          // Intentamos resolver createdEventId (si el backend devolvió idEvento) y usamos eso; si no, hacemos fallback a la primera fecha (idFecha).
          let uploadTarget = (fechaIds && fechaIds[0]) || null;
          try {
            // intentar obtener idEvento si fue devuelto al crear
            let possibleEventId: string | null = null;
            if (typeof createResult === 'string') {
              // si createResult fue string, puede ser idEvento; probeamos si NO es idFecha
              const cand = String(createResult).trim();
              const esFecha = await probeGetEntradasFecha(cand).catch(() => false);
              if (!esFecha) possibleEventId = cand;
            } else if (createResult && (createResult.idEvento || createResult.IdEvento || createResult.id || createResult.Id)) {
              possibleEventId = String(createResult.idEvento ?? createResult.IdEvento ?? createResult.id ?? createResult.Id);
            }
            if (possibleEventId) uploadTarget = possibleEventId;
          } catch (e) {
            console.warn('[Media] no se pudo resolver idEvento, se usará idFecha como fallback:', e);
          }

          if (!uploadTarget) {
            console.warn('[Media] no se encontró idEvento ni idFecha; se omitirá subida.');
          } else {
            console.log('[Media] usando IdEntidadMedia para subida:', uploadTarget);
            const resp = await mediaApi.upload(String(uploadTarget), fileObj);
            console.log('[Media] respuesta de mediaApi.upload:', resp);
          }
        }
      } catch (e) {
        console.warn('[Media] subida FALLÓ (no bloqueante):', (e as any)?.message ?? String(e));
      }

      // 10) Si llegamos hasta acá, todo crítico fue OK → navegar a Administrar Eventos
      console.log('[CreateEvent] flujo completado con éxito. Redirigiendo a AdministrarEventosPantalla');
      Alert.alert('Éxito', 'Evento creado correctamente.');
      router.push('/owner/AdministrarEventosPantalla');
    } catch (err: any) {
      console.error('[CreateEvent] error no manejado en handleSubmit:', err);
      const msg = err?.message || extractBackendMessage(err);
      Alert.alert('Error', String(msg));
      // no navegamos para que el usuario pueda corregir
    }
  }, [
    userId,
    eventName,
    photoFile,
    acceptedTC,
    eventType,
    dayCount,
    selectedGenres,
    selectedArtists,
    isRecurring,
    selectedPartyId,
    daySchedules,
    daySaleConfigs,
    musicLink,
    isAfter,
    isLGBT,
    provinceId,
    provinceName,
    municipalityId,
    municipalityName,
    localityId,
    localityName,
    street,
    router,
  ]);

  const artistSuggestions: Artist[] = useMemo(() => {
    const q = norm(artistInput);
    if (!q || !allArtists) return [];
    const selectedSet = new Set(selectedArtists.map((a) => norm(a.name)));
    return allArtists
      .filter((a) => !selectedSet.has(norm(a.name)) && norm(a.name).includes(q))
      .slice(0, 8);
  }, [artistInput, allArtists, selectedArtists]);

  const totalPerDay = useCallback((d: DayTickets) =>
    (parseInt(d.genQty || "0", 10) || 0) + (parseInt(d.vipQty || "0", 10) || 0)
  , []);

  const grandTotal = useMemo(() => daysTickets.reduce((acc, d) => acc + totalPerDay(d), 0), [daysTickets, totalPerDay]);

  /* Multimedia */
  const handleSelectPhoto = useCallback(async () => {
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

      // 1) Tamaño real del archivo (robusto)
      const size = await getFileSize(uri);
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
      console.log("[Media] foto seleccionada:", { uri, filename, size });
      setPhotoFile(uri);
    } catch (e) {
      console.error("ImagePicker error", e);
      Alert.alert("Error", "No se pudo abrir la galería.");
    }
  }, []);

  /* ================= Render ================= */
  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <TabMenuComponent
        tabs={[
          {
            label: "Crear evento",
            route: ROUTES.MAIN.EVENTS.CREATE,
            isActive: true,
          },
          {
            label: "Mis fiestas recurrentes",
            route: ROUTES.OWNER.PARTYS,
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
                // si es CABA (02): cargamos todas las localidades de capital y saltamos municipio
                handleSelectProvinceCallback(id, name);
                if (id === '02') {
                  setShowMunicipalities(false);
                  setMunicipalities([]);
                  // autoseleccionamos el municipio con nombre igual a "Ciudad Autónoma de Buenos Aires"
                  setMunicipalityId('02');
                  setMunicipalityName('Ciudad Autónoma de Buenos Aires');
                  setLocalityLoading(true);
                  try {
                    const { fetchLocalitiesByProvince } = await import('@/utils/georef/georefHelpers');
                    const locs = await fetchLocalitiesByProvince(id);
                    setLocalities(locs || []);
                  } catch (e) {
                    console.warn('Error fetchLocalities (CABA):', e);
                    setLocalities([]);
                  } finally {
                    setLocalityLoading(false);
                  }
                }
              }}
              handleSelectMunicipality={handleSelectMunicipalityCallback}
              handleSelectLocality={handleSelectLocalityCallback}
              allowLocalitiesWithoutMunicipality={provinceId === '02'}
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
                  <Text style={styles.link} onPress={() => {
                    // en Android hay problemas con Linking directo, abrimos modal WebView
                    openTycModal();
                  }}>
                    términos y condiciones
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={async () => {
                  // Validaciones extra
                  const ok = validateBeforeSubmit();
                  if (!ok) return;
                  // continuar
                  setCreating(true);
                  try {
                    await handleSubmit();
                  } finally {
                    setCreating(false);
                  }
                }}
              >
                <Text style={styles.submitButtonText}>CREAR EVENTO</Text>
              </TouchableOpacity>

              <CirculoCarga visible={creating} text="Creando evento..." />

              <Text style={[styles.totalLine, { textAlign: "center" }]}>
                {grandTotal > 0
                  ? `Total aproximado: $${grandTotal}`
                  : "Sin entradas configuradas"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

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
