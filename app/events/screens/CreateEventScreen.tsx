import * as ImagePicker from "expo-image-picker";
import { getInfoAsync } from "expo-file-system/legacy";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ROUTES from "@/routes";
// Animated/Easing not required here
import { BlurView } from "expo-blur";
import { Portal } from "react-native-paper";

/** Layout y UI base */
import Header from "@/components/layout/HeaderComponent";
// navigation helper not required in this screen
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
} from "@/app/events/apis/eventApi";
import { getTycPdfUrl } from "@/app/tyc/api/tycApi";
import { fetchArtistsFromApi } from "@/app/artists/apis/artistApi";
import { Artist } from "@/app/artists/types/Artist";
import { useAuth } from "@/app/auth/AuthContext";
import PopUpOrganizadorAndroid from "@/app/events/components/create/popup-organizador/PopUpOrganizadorAndroid";

/** Georef */
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
} from "@/app/apis/georefApi";

/** Recurrentes (parties) */
import { getPartiesByUser, createParty, Party } from "@/app/party/apis/partysApi";

/** Entradas */
import {
  resolveTipoCodes,
  CreateEntradaBody,
} from "@/app/events/apis/entradaApi";

/** Media */
// mediaApi is imported dynamically when needed

/** Componentes (crear) */
import EventBasicData from "@/app/events/components/create/EventBasicData";
import GenreSelector from "@/app/events/components/create/GenreSelector";
import ArtistSelector from "@/app/events/components/create/ArtistSelector";
import LocationSelector from "@/app/events/components/create/LocationSelector";
import DescriptionField from "@/app/events/components/create/DescriptionField";
import ScheduleSection from "@/app/events/components/create/ScheduleSection";
import TicketSection from "@/app/events/components/create/TicketSection";
import TicketConfigSection from "@/app/events/components/create/TicketConfigSection";
import ImagePickerComponent from "@/components/common/ImagePickerComponent";
import { TextInput } from "react-native";
import CirculoCarga from "@/components/common/CirculoCarga";

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
// Limite de 2MB para evitar 413 (común en Nginx por client_max_body_size)
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png"]);

// Lightweight logger wrapper: logs only in development (__DEV__), no-ops in production
const log = {
  debug: (...args: any[]) => {
    try {
      if (typeof __DEV__ !== "undefined" && (__DEV__ as any))
        console.debug(...args);
    } catch {}
  },
  info: (...args: any[]) => {
    try {
      if (typeof __DEV__ !== "undefined" && (__DEV__ as any))
        console.info(...args);
    } catch {}
  },
  warn: (...args: any[]) => {
    try {
      if (typeof __DEV__ !== "undefined" && (__DEV__ as any))
        console.warn(...args);
    } catch {}
  },
  error: (...args: any[]) => {
    try {
      if (typeof __DEV__ !== "undefined" && (__DEV__ as any))
        console.error(...args);
    } catch {}
  },
};

const createEmptyDayTickets = (): DayTickets => ({
  // inicializar como cadenas vacías para que se muestre el placeholder en los inputs
  genQty: "",
  genPrice: "",
  ebGenQty: "",
  ebGenPrice: "",
  vipQty: "",
  vipPrice: "",
  ebVipQty: "",
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

// Convierte cada palabra a Title Case (Jose Luis Rigolino)
const toTitleCase = (s?: string | null): string => {
  if (!s) return "";
  return String(s)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

// Variante que preserva los espacios exactamente como los escribe el usuario
// (no colapsa múltiples espacios ni elimina espacios finales) — útil
// para aplicar Title Case en tiempo real sin borrar espacios al tipear.
const toTitleCasePreserveSpaces = (s?: string | null): string => {
  if (!s) return "";
  return String(s).replace(/\S+/g, (w) =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  );
};

function extractBackendMessage(e: any): string {
  return (
    e?.response?.data?.message ||
    e?.response?.data?.Message ||
    e?.response?.data?.error ||
    e?.message ||
    "Ocurrió un error inesperado."
  );
}

// =============== Helpers comunes ===============
const getLocalTuple = (d: Date) =>
  [d.getFullYear(), d.getMonth(), d.getDate()] as const;

const getUtcTuple = (d: Date) =>
  [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()] as const;

const isBeforeTuple = (
  a: readonly [number, number, number],
  b: readonly [number, number, number]
) =>
  a[0] < b[0] ||
  (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2])));

function ensureArrayWithPrev<T>(
  prev: T[] | undefined,
  length: number,
  creator: () => T
): T[] {
  const out: T[] = Array.from({ length }, (_, i) =>
    prev && prev[i] ? prev[i] : creator()
  );
  return out;
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
        /* Lines 1981-2531 omitted */
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

// use entradaApi.ensureFechaListo instead of a local duplicate helper

/* ================= Pantalla ================= */
export default function CreateEventScreen() {
  // ...existing code...
  const { user, updateUsuario, hasAnyRole } = useAuth();
  const userId: string | null =
    (user as any)?.idUsuario ?? (user as any)?.id ?? null;
  // Detectar roles en frontend usando helpers robustos del AuthContext.
  // Consideramos tanto los roles normalizados ('user','owner') como
  // posibles representaciones numéricas devueltas por la API (ej: 0, 2).
  const isUsuario = hasAnyRole(["user", "0"]);
  const isOrganizador = hasAnyRole([
    "owner",
    "organizer",
    "2",
    "Organizador",
  ]);
  const mustShowLogin = !user;

  // Debug: log user and isUsuario to diagnose popup issue
  React.useEffect(() => {
    // Debug info suppressed to avoid noisy Metro logs. Keep effect for future hooks.
  }, [user, isUsuario]);
  const router = useRouter();

  /* --- Auth --- */
  // ...existing code...


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
  const [tempCreatedPartyId, setTempCreatedPartyId] = useState<string | null>(
    null
  );
  const [tempCreatedPartyName, setTempCreatedPartyName] = useState<
    string | null
  >(null);

  // Cuando el usuario empieza a escribir en "O crear una nueva", debemos
  // deseleccionar cualquier `selectedPartyId` que hubiera quedado seleccionado.
  const handleNewPartyNameChange = React.useCallback(
    (val: string) => {
      setNewPartyName(val);
      try {
        if (val && val.trim().length > 0) {
          setSelectedPartyId(null);
        }
      } catch {}
    },
    [setNewPartyName, setSelectedPartyId]
  );

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
  const [isCheckingImage, setIsCheckingImage] = useState(false);
  // nuevo: indicar si la imagen seleccionada excede el máximo permitido
  const [photoTooLarge, setPhotoTooLarge] = useState(false);
  const [photoFileSize, setPhotoFileSize] = useState<number | null>(null);
  const [videoLink, setVideoLink] = useState("");
  const [musicLink, setMusicLink] = useState("");
  // Mensaje de error final para mostrar al usuario en pantalla si algo falla durante creación
  const [creationError, setCreationError] = useState<string | null>(null);

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
    setDaySchedules((prev) =>
      ensureArrayWithPrev(prev, dayCount, createEmptySchedule)
    );
  }, [dayCount]);

  useEffect(() => {
    setDaysTickets((prev) =>
      ensureArrayWithPrev(prev, dayCount, createEmptyDayTickets)
    );
  }, [dayCount]);

  useEffect(() => {
    setDaySaleConfigs((prev) =>
      ensureArrayWithPrev(prev, dayCount, createEmptySaleConfig)
    );
  }, [dayCount]);

  useEffect(() => {
    fetchProvinces()
      .then(setProvinces)
      .catch((err) => {
        try {
          log.warn("Error fetchProvinces:", String(err?.message || err));
        } catch {
          log.warn("Error fetchProvinces: unknown error");
        }
      });
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
          try {
            log.warn("fetchArtistsFromApi", String(e?.message || e));
          } catch {
            log.warn("fetchArtistsFromApi: unknown error");
          }
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

  const addArtistByName = useCallback(
    (nameRaw: string) => {
      const name = nameRaw.trim();
      if (!name) return;
      if (selectedArtists.some((a) => norm(a.name) === norm(name))) {
        setArtistInput("");
        return;
      }

      // Añadir visualmente como nuevo (una sola vez)
      const pendingArtist = {
        name: toTitleCase(name),
        image: "",
        __isNew: true,
      } as unknown as ArtistSel;
      setSelectedArtists((prev) => [...prev, pendingArtist]);
      setArtistInput("");

      // Intento best-effort: crear el artista inmediatamente en la API como inactivo (isActivo = 0)
      (async () => {
        try {
          const artistApi = await import("@/app/artists/apis/artistApi");
          if (artistApi && typeof artistApi.createArtistOnApi === "function") {
            const id = await artistApi.createArtistOnApi({
              name: toTitleCase(name),
              description: "",
              instagramURL: "",
              spotifyURL: "",
              soundcloudURL: "",
              isActivo: false,
            });
            if (id) {
              // Reemplazar el entry __isNew por objeto con idArtista
              setSelectedArtists((prev) =>
                prev.map((a) => {
                  if (
                    norm((a as any).name || "") === norm(name) &&
                    (a as any).__isNew
                  ) {
                    // Preserve the __isNew flag so the UI keeps showing the pending (yellow) icon
                    const updated = {
                      ...(a as any),
                      idArtista: String(id),
                    } as unknown as ArtistSel;
                    return updated;
                  }
                  return a;
                })
              );
            }
          }
        } catch (e) {
          // ignore: si falla, lo mantenemos como pendiente (__isNew) y se intentará crear en submit
        }
      })();
    },
    [selectedArtists, setSelectedArtists, setArtistInput]
  );

  const handleSelectArtistFromSuggestions = useCallback(
    (a: Artist) => {
      if (selectedArtists.some((s) => norm(s.name) === norm(a.name))) return;
      // Mostrar en Title Case al usuario, preservando el idArtista
      const display: ArtistSel = {
        ...(a as any),
        name: toTitleCase(a.name),
      } as any;
      setSelectedArtists((prev) => [...prev, display]);
      setArtistInput("");
    },
    [selectedArtists]
  );

  const handleRemoveArtist = useCallback(
    (name: string) => {
      // Find the artist entry in current selected list
      const target = selectedArtists.find((x) => norm(x.name) === norm(name));

      // Remove from UI immediately
      setSelectedArtists((prev) =>
        prev.filter((x) => norm(x.name) !== norm(name))
      );

      // If it's a manual-added artist (marked __isNew) OR explicitly inactive in DB
      // and it has an idArtista, attempt to delete it from the backend as well.
      try {
        const idArtista = (target as any)?.idArtista;
        const wasNew = Boolean((target as any)?.__isNew);
        const isActivoFlag = (target as any)?.isActivo;
        const isActivo =
          typeof isActivoFlag === "boolean"
            ? isActivoFlag
            : isActivoFlag === 1 || isActivoFlag === "1";

        if (idArtista && (wasNew || isActivo === false)) {
          (async () => {
            try {
              const artistApi = await import("@/app/artists/apis/artistApi");
              if (
                artistApi &&
                typeof artistApi.deleteArtistFromApi === "function"
              ) {
                await artistApi.deleteArtistFromApi(String(idArtista));
                try {
                  log.info(
                    "[handleRemoveArtist] artista eliminado de la BBDD:",
                    String(idArtista)
                  );
                } catch {}
              }
            } catch (e) {
              try {
                log.warn(
                  "[handleRemoveArtist] fallo al eliminar artista de la BBDD:",
                  String((e as any)?.message || e)
                );
              } catch {}
            }
          })();
        }
      } catch (e) {
        // no hacemos nada si la validación falla; ya removimos de la UI
      }
    },
    [selectedArtists, setSelectedArtists]
  );

  const onPickParty = (p: Party) => {
    // If there was a temp-created party (from pressing +), and it's different from
    // the one the user selected, delete that temp party from the backend.
    (async () => {
      try {
        if (tempCreatedPartyId && tempCreatedPartyId !== p.idFiesta) {
          const partys = await import("@/app/party/apis/partysApi");
          if (partys && typeof partys.deleteParty === "function") {
            await partys.deleteParty(tempCreatedPartyId);
            try {
              log.info("[onPickParty] temp party deleted:", tempCreatedPartyId);
            } catch {}
          }
        }
      } catch (e) {
        try {
          log.warn(
            "[onPickParty] failed deleting temp party:",
            String((e as any)?.message || e)
          );
        } catch {}
      } finally {
        setTempCreatedPartyId(null);
        setSelectedPartyId(p.idFiesta);
        setShowPartyDropdown(false);
        setNewPartyName("");
        setNewPartyLocked(false);
      }
    })();
  };
  const onPressAddNewParty = () => {
    const name = newPartyName.trim();
    if (!name) return;
    // lock UI immediately and mark the new party name as pending.
    // IMPORTANT: do NOT call the backend here. The actual creation will happen
    // when the user presses "Crear Evento" (createPendingEntities).
    setNewPartyLocked(true);
    setTempCreatedPartyName(name);
    setTempCreatedPartyId(null);
    try {
      setShowPartyDropdown(false);
    } catch {}
    try {
      log.info("[onPressAddNewParty] pending party name registered:", name);
    } catch {}
  };

  const setSchedule = useCallback(
    (i: number, key: keyof DaySchedule, val: Date) => {
      setDaySchedules((prev) => {
        const arr = [...prev];
        arr[i] = { ...arr[i], [key]: val };
        return arr;
      });
    },
    []
  );
  const setSaleCfg = useCallback(
    (i: number, key: keyof DaySaleConfig, val: Date) => {
      setDaySaleConfigs((prev) => {
        const arr = [...prev];
        arr[i] = { ...arr[i], [key]: val };
        return arr;
      });
    },
    []
  );
  const setTicket = useCallback(
    (i: number, key: keyof DayTickets, val: string) => {
      setDaysTickets((prev) => {
        const arr = [...prev];
        const clean = val.replace(/[^0-9]/g, "");

        // Copia del día a modificar para aplicar reglas cruzadas
        const day = { ...arr[i] } as DayTickets;

        const toInt = (s: string) => {
          const n = parseInt(s || "0", 10);
          return isFinite(n) ? n : 0;
        };

        if (key === "genQty") {
          // Actualiza base General y ajusta EB General si quedó por encima
          day.genQty = clean;
          const base = toInt(day.genQty);
          const eb = toInt(day.ebGenQty);
          if (eb > base) {
            // Si base es 0, dejar EB vacío para no mostrar 0 molesto
            day.ebGenQty = base > 0 ? String(base) : "";
          }
        } else if (key === "vipQty") {
          // Actualiza base VIP y ajusta EB VIP si quedó por encima
          day.vipQty = clean;
          const base = toInt(day.vipQty);
          const eb = toInt(day.ebVipQty);
          if (eb > base) {
            day.ebVipQty = base > 0 ? String(base) : "";
          }
        } else if (key === "ebGenQty") {
          // Clamp: EB General no puede superar General
          const base = toInt(day.genQty);
          let next = toInt(clean);
          if (base <= 0) {
            // Sin base definida, no permitir valor: mantener vacío
            day.ebGenQty = "";
          } else {
            if (next > base) next = base;
            day.ebGenQty = String(next);
          }
        } else if (key === "ebVipQty") {
          // Clamp: EB VIP no puede superar VIP
          const base = toInt(day.vipQty);
          let next = toInt(clean);
          if (base <= 0) {
            day.ebVipQty = "";
          } else {
            if (next > base) next = base;
            day.ebVipQty = String(next);
          }
        } else {
          // Precios u otros campos: aplicar limpieza simple
          (day as any)[key] = clean;
        }

        arr[i] = day;
        return arr;
      });
    },
    []
  );

  // Estados de carga para evitar bloquear la UI en Android
  const [municipalityLoading, setMunicipalityLoading] = useState(false);
  const [localityLoading, setLocalityLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Handlers no bloqueantes para selección de provincia/municipio/localidad
  const handleSelectProvinceCallback = useCallback(
    (id: string, name: string) => {
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
          log.warn("Error fetchMunicipalities:", e);
          setMunicipalities([]);
        } finally {
          setMunicipalityLoading(false);
        }
      }, 0);
    },
    []
  );

  const handleSelectMunicipalityCallback = useCallback(
    (id: string, name: string) => {
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
          log.warn("Error fetchLocalities:", e);
          setLocalities([]);
        } finally {
          setLocalityLoading(false);
        }
      }, 0);
    },
    [provinceId]
  );

  const handleSelectLocalityCallback = useCallback(
    (id: string, name: string) => {
      setLocalityId(id);
      setLocalityName(name);
      setShowLocalities(false);
    },
    []
  );

  // VALIDACIONES extra antes de submit
  const validateBeforeSubmit = useCallback(() => {
    // 1) Género obligatorio
    if (!selectedGenres || selectedGenres.length === 0) {
      Alert.alert("Validación", "Debe seleccionar al menos un género musical.");
      return false;
    }
    // 1.b) Nombre del evento obligatorio
    if (!eventName || !eventName.trim()) {
      Alert.alert("Validación", "El nombre del evento es obligatorio.");
      return false;
    }
    // 1.c) Al menos un artista (aceptamos artistas existentes o agregados manualmente)
    const hasArtist =
      Array.isArray(selectedArtists) &&
      selectedArtists.some((a) => {
        const maybeId = (a as any).idArtista ?? (a as any).id;
        return Boolean(maybeId) || Boolean((a as any).__isNew);
      });
    if (!hasArtist) {
      Alert.alert(
        "Validación",
        "Debe seleccionar al menos un artista (puede ser uno ya existente o uno añadido manualmente)."
      );
      return false;
    }
    // 2) Descripción obligatoria
    if (!eventDescription || !eventDescription.trim()) {
      Alert.alert("Validación", "La descripción es obligatoria.");
      return false;
    }
    // 3) Fechas: inicio/fin deben ser > ahora y fin > inicio y no misma hora exacta
    const now = Date.now();
    for (let i = 0; i < daySchedules.length; i++) {
      const s = daySchedules[i].start
        ? new Date(daySchedules[i].start).getTime()
        : NaN;
      const e = daySchedules[i].end
        ? new Date(daySchedules[i].end).getTime()
        : NaN;
      if (!isFinite(s) || !isFinite(e)) {
        Alert.alert(
          "Validación",
          `La fecha de inicio y fin del día ${i + 1} son obligatorias.`
        );
        return false;
      }
      // Rechazar fechas por defecto que algunos backends traducen a 0001-01-01
      const sYear = new Date(daySchedules[i].start as any).getUTCFullYear();
      const eYear = new Date(daySchedules[i].end as any).getUTCFullYear();
      if ((sYear && sYear <= 1) || (eYear && eYear <= 1)) {
        Alert.alert(
          "Validación",
          `Las fechas del día ${
            i + 1
          } parecen inválidas. Por favor seleccioná fechas válidas.`
        );
        return false;
      }
      // No permitir fechas anteriores al día de hoy (comparamos por fecha en hora local: año/mes/día)
      const startIsBeforeToday = isBeforeTuple(
        getLocalTuple(new Date(s)),
        getLocalTuple(new Date())
      );
      if (startIsBeforeToday) {
        Alert.alert(
          "Validación",
          `La fecha de inicio del día ${
            i + 1
          } no puede ser anterior al día de hoy.`
        );
        return false;
      }
      if (s <= now) {
        Alert.alert(
          "Validación",
          `La fecha de inicio del día ${
            i + 1
          } debe ser posterior al momento actual.`
        );
        return false;
      }
      if (e <= now) {
        Alert.alert(
          "Validación",
          `La fecha de fin del día ${
            i + 1
          } debe ser posterior al momento actual.`
        );
        return false;
      }
      if (e <= s) {
        Alert.alert(
          "Validación",
          `La fecha de fin del día ${
            i + 1
          } debe ser posterior a la fecha de inicio.`
        );
        return false;
      }
      // No permitir misma hora exacta
      const sameHour =
        Math.abs(e - s) < 60 * 60 * 1000 &&
        new Date(e).getHours() === new Date(s).getHours() &&
        new Date(e).getDate() === new Date(s).getDate();
      if (sameHour) {
        Alert.alert(
          "Validación",
          `La fecha de fin del día ${
            i + 1
          } no puede estar en la misma hora que el inicio.`
        );
        return false;
      }

      // Validar fechas de venta relacionadas (si existen en daySaleConfigs)
      try {
        const saleCfg = daySaleConfigs[i];
        if (saleCfg) {
          const ss = saleCfg.saleStart
            ? new Date(saleCfg.saleStart).getTime()
            : NaN;
          const se = saleCfg.sellUntil
            ? new Date(saleCfg.sellUntil).getTime()
            : NaN;
          // Si alguno es inválido (NaN) o tiene año por defecto, rechazamos
          const ssYear = saleCfg.saleStart
            ? new Date(saleCfg.saleStart as any).getUTCFullYear()
            : NaN;
          const seYear = saleCfg.sellUntil
            ? new Date(saleCfg.sellUntil as any).getUTCFullYear()
            : NaN;
          if ((ssYear && ssYear <= 1) || (seYear && seYear <= 1)) {
            Alert.alert(
              "Validación",
              `Las fechas de venta del día ${
                i + 1
              } parecen inválidas. Por favor seleccioná fechas válidas para la venta de entradas.`
            );
            return false;
          }
          if (isFinite(ss) && isFinite(se)) {
            if (se <= ss) {
              try {
                const saleRaw = saleCfg.saleStart;
                const sellRaw = saleCfg.sellUntil;
                const saleIso = new Date(ss).toISOString();
                const sellIso = new Date(se).toISOString();
                const saleLocal = new Date(ss).toLocaleString();
                const sellLocal = new Date(se).toLocaleString();
                const tzOffsetSale = new Date(ss).getTimezoneOffset();
                const tzOffsetSell = new Date(se).getTimezoneOffset();
                console.debug(
                  "[validateBeforeSubmit] saleEnd <= saleStart detected",
                  {
                    day: i + 1,
                    saleRaw,
                    sellRaw,
                    saleMs: ss,
                    sellMs: se,
                    saleIso,
                    sellIso,
                    saleLocal,
                    sellLocal,
                    tzOffsetSale,
                    tzOffsetSell,
                  }
                );
              } catch (logErr) {}

              Alert.alert(
                "Validación",
                `La fecha de fin de venta del día ${
                  i + 1
                } debe ser posterior a la fecha de inicio de venta.\nInicio venta: ${new Date(
                  ss
                ).toLocaleString()}\nFin venta: ${new Date(
                  se
                ).toLocaleString()}`
              );
              return false;
            }
            // La venta no puede empezar después del inicio del evento (comparamos por fecha, no por hora)
            const sd = new Date(ss);
            const ed = new Date(s);
            const saleIsAfterEvent = isBeforeTuple(
              getUtcTuple(ed),
              getUtcTuple(sd)
            );
            if (saleIsAfterEvent) {
              Alert.alert(
                "Validación",
                `La fecha de inicio de venta del día ${
                  i + 1
                } no puede ser posterior al inicio del evento.\nInicio venta: ${sd.toLocaleDateString()}\nInicio evento: ${ed.toLocaleDateString()}`
              );
              return false;
            }
            // (Regla eliminada) Permitido iniciar venta antes o el mismo día de la creación.
          }
        }
      } catch (e) {
        // Si algo falla en validación, no permitimos proceder por seguridad
        Alert.alert(
          "Validación",
          `Error validando las fechas del día ${
            i + 1
          }. Revisá y volvé a intentar.`
        );
        return false;
      }
    }

    // 4) Si provincia es CABA (02), forzamos skip municipio y requerimos localidad
    if (provinceId === "02") {
      if (!localityId) {
        Alert.alert(
          "Validación",
          "Debe seleccionar una localidad en Ciudad Autónoma de Buenos Aires."
        );
        return false;
      }
    } else {
      // fuera de CABA: municipio y localidad obligatorios
      if (!municipalityId) {
        Alert.alert("Validación", "Debe seleccionar un municipio.");
        return false;
      }
      if (!localityId) {
        Alert.alert("Validación", "Debe seleccionar una localidad.");
        return false;
      }
    }

    // 5) Imagen obligatoria: no se debe crear evento sin foto
    if (!photoFile) {
      Alert.alert("Validación", "Debe seleccionar una imagen para el evento.");
      return false;
    }

    return true;
  }, [
    selectedGenres,
    eventName,
    eventDescription,
    daySchedules,
    daySaleConfigs,
    provinceId,
    municipalityId,
    localityId,
    selectedArtists,
    photoFile,
  ]);

  // Formato aceptado por el backend: sin zona (yyyy-MM-ddTHH:mm:ss)
  // Muchos backends .NET fallan al parsear ciertos ISO con Z/offsets; enviamos fecha limpia.
  const formatBackendIso = (
    d?: Date | string | undefined | null
  ): string | undefined => {
    if (!d) return undefined;
    try {
      const dt = new Date(d as any);
      if (!isFinite(dt.getTime())) return undefined;
      const pad = (n: number) => String(n).padStart(2, "0");
      const YYYY = dt.getFullYear();
      const MM = pad(dt.getMonth() + 1);
      const DD = pad(dt.getDate());
      const hh = pad(dt.getHours());
      const mm = pad(dt.getMinutes());
      const ss = pad(dt.getSeconds());
      return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
    } catch {
      return undefined;
    }
  };

  // Variante para campos de venta (inicioVenta/finVenta) que compensa el corrimiento de zona.
  // Algunas APIs .NET interpretan valores sin zona como hora local del servidor y luego los convierten a UTC,
  // lo que en servidores configurados en UTC-3 termina guardando +3 horas en BBDD.
  // Para preservar el instante real elegido por el usuario, generamos una fecha "naive" ya ajustada
  // restando el timezone offset local. De esa forma, cuando el backend sume el offset al guardar en UTC,
  // el horario final coincide con el seleccionado en pantalla.
  const formatBackendIsoVenta = (
    d?: Date | string | undefined | null
  ): string | undefined => {
    if (!d) return undefined;
    try {
      const dt = new Date(d as any);
      if (!isFinite(dt.getTime())) return undefined;
      const offsetMs = dt.getTimezoneOffset() * 60 * 1000; // minutos -> ms
      const adj = new Date(dt.getTime() - offsetMs);
      const pad = (n: number) => String(n).padStart(2, "0");
      const YYYY = adj.getFullYear();
      const MM = pad(adj.getMonth() + 1);
      const DD = pad(adj.getDate());
      const hh = pad(adj.getHours());
      const mm = pad(adj.getMinutes());
      const ss = pad(adj.getSeconds());
      return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
    } catch {
      return undefined;
    }
  };

  async function createPendingEntities(userId: string) {
    const result: {
      partyCreated?: any;
      artistaIds?: string[];
      artistaIdsMap?: Record<string, string>;
    } = {};
    if (isRecurring && newPartyLocked && newPartyName.trim()) {
      const payload = {
        idUsuario: String(userId),
        nombre: newPartyName.trim(),
        isActivo: true,
      };
      try {
        // If a temp party was already created by the user via the "+" button,
        // prefer activating / reusing it instead of creating a duplicate.
        if (tempCreatedPartyId) {
          try {
            const partys = await import("@/app/party/apis/partysApi");
            if (partys && typeof partys.updateParty === "function") {
              await partys.updateParty({
                idFiesta: tempCreatedPartyId,
                isActivo: true,
              });
            }
            // Attempt to fetch the party by id
            try {
              const byId = await (async () => {
                try {
                  const p = await (
                    await import("@/app/party/apis/partysApi")
                  ).getPartyById(tempCreatedPartyId!);
                  return p;
                } catch {
                  return null;
                }
              })();
              if (byId) result.partyCreated = byId;
            } catch {}
          } catch (e) {
            // best-effort: if activation fails, fall back to creating a fresh active party
            try {
              const id = await createParty(payload);
              if (id) {
                const parties = await getPartiesByUser(String(userId));
                const found = parties.find(
                  (p) => (p.nombre || "").trim() === payload.nombre.trim()
                );
                if (found) result.partyCreated = found;
              }
            } catch {
              // rethrow original error below
              throw e;
            }
          }
        } else {
          // No temp party: create as active now
          const id = await createParty(payload);
          if (id) {
            try {
              const parties = await getPartiesByUser(String(userId));
              const found = parties.find(
                (p) => (p.nombre || "").trim() === payload.nombre.trim()
              );
              if (found) result.partyCreated = found;
            } catch {
              // best-effort
            }
          }
        }
      } catch (e: any) {
        // createParty / activation error is fatal for recurring party creation: rethrow
        throw e;
      }
    }

    // Crear artistas nuevos (best-effort). No lanzar errores si falla; devolver ids si podemos resolverlos.
    // Empezamos por incluir cualquier id ya conocido desde el selector
    const alreadyKnownIds = selectedArtists
      .map((a) => (a as any).idArtista)
      .filter(Boolean) as string[];
    const newOnes = selectedArtists.filter(
      (a) => (a as any).__isNew || !a.idArtista
    );
    if (newOnes.length) {
      try {
        const artistApi = await import("@/app/artists/apis/artistApi");
        const createdIds: string[] = [];
        const createdMap: Record<string, string> = {};
        // Merge known ids first
        if (alreadyKnownIds.length) {
          createdIds.push(...alreadyKnownIds);
        }
        // Prefer the 'createArtist' helper (CreateArtista endpoint) which exists in many environments.
        // Fallback to createArtistInactive (CrearArtista) only if the first is not available or fails.
        if (
          artistApi &&
          typeof (artistApi as any).createArtist === "function"
        ) {
          await Promise.all(
            newOnes.map(async (a) => {
              // ...existing code omitted...
            })
          );
        }
        if (createdIds.length) {
          result.artistaIds = Array.from(
            new Set([...(result.artistaIds || []), ...createdIds])
          );
          result.artistaIdsMap = createdMap;
        }
      } catch (err: any) {
        // swallow creation errors; we'll attempt to fetch existing artists below
      }

      // Intentar recuperar ids de artistas que ahora existan
      try {
        const existing = await fetchArtistsFromApi().catch(() => []);
        const createdIds: string[] = [];
        for (const a of newOnes) {
          const found = (existing || []).find(
            (ea) => norm(ea.name || "") === norm(a.name || "")
          );
          if (found && (found as any).idArtista)
            createdIds.push((found as any).idArtista);
        }
        if (createdIds.length) {
          result.artistaIds = createdIds;
          // merge into map if present
          result.artistaIdsMap = result.artistaIdsMap || {};
          for (const cid of createdIds) {
            const found = (existing || []).find(
              (ea) =>
                (ea as any).idArtista === cid ||
                norm((ea as any).name || "") ===
                  norm(
                    (existing || []).find((x) => (x as any).idArtista === cid)
                      ?.name || ""
                  )
            );
            if (found && found.name)
              result.artistaIdsMap[norm(found.name)] = cid;
          }
        }
      } catch {
        // ignore
      }
    }

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
      try {
        log.warn(
          "[tryResolveEventIdAfterCreate] error:",
          String((e as any)?.message || e)
        );
      } catch {
        log.warn("[tryResolveEventIdAfterCreate] error");
      }
      return null;
    }
  }

  /** Verifica si GET /v1/Entrada/GetEntradasFecha responde sin error (sólo existencia) */
  async function probeGetEntradasFecha(idFecha: string): Promise<boolean> {
    try {
      const url = `/v1/Entrada/GetEntradasFecha?IdFecha=${encodeURIComponent(
        idFecha
      )}`;
      const { apiClient } = await import("@/app/apis/apiClient");
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
      log.warn(
        "[getFileSize] fetch->blob falló, intentando fallback expo-file-system:",
        e
      );
      try {
        if (Platform.OS !== "web") {
          const FileSystem = await import("expo-file-system/legacy");
          const info = await FileSystem.getInfoAsync(uri);
          if (info && typeof (info as any).size === "number")
            return (info as any).size;
        }
      } catch (err) {
        log.warn("[getFileSize] fallback FileSystem falló:", err);
      }
    }
    // Si no se pudo determinar el tamaño, intentamos obtenerlo desde asset (si existe)
    if (uri && typeof uri === "string") {
      const assetIdMatch = uri.match(/asset:(\d+)/);
      if (assetIdMatch) {
        try {
          const MediaLibrary = await import("expo-media-library");
          const asset = await MediaLibrary.getAssetInfoAsync(assetIdMatch[1]);
          if (asset && typeof (asset as any).size === "number")
            return (asset as any).size;
        } catch (e) {
          log.warn("[getFileSize] MediaLibrary fallback falló:", e);
        }
      }
    }
    return 0; // no pudimos determinar tamaño
  }

  // Submit final
  const handleSubmit = useCallback(async () => {
    // Refactor: flujo transaccional, mensajes honestos, rollback best effort
    setCreationError(null);
    let _tempCreatedToCleanup: string | null = null;
    let createdEventId: string | null = null;
    let createResult: any = null;
    let fechaIds: string[] = [];
    let remoteFechas: any[] = [];
    let pending: any = {};
    const entradaApi = await import("@/app/events/apis/entradaApi");
    const eventApi = await import("@/app/events/apis/eventApi");
    try {
      // 1. Validaciones previas
      if (!validateBeforeSubmit()) return;
      if (!userId) throw new Error("Usuario no autenticado.");
      if (!eventName || !acceptedTC)
        throw new Error("Complete nombre de evento y acepte T&C.");
      if (photoFile) {
        try {
          const size = await getFileSize(photoFile);
          if (size > MAX_IMAGE_BYTES) {
            const userMsg = `La imagen seleccionada supera el máximo permitido (${Math.round(MAX_IMAGE_BYTES / 1024)}KB). Por favor, elige una imagen más liviana.`;
            setCreationError(userMsg);
            Alert.alert("Imagen demasiado grande", userMsg);
            return;
          }
          const filename = photoFile.split("/").pop() || "";
          if (!isAllowedExt(filename) && !isAllowedExt(photoFile)) {
            const userMsg = "Formato de imagen no soportado. Use JPG/JPEG/PNG.";
            setCreationError(userMsg);
            Alert.alert("Formato no soportado", userMsg);
            return;
          }
        } catch (e: any) {
          setCreationError("Fallo al validar la imagen: " + String(e?.message || e));
          Alert.alert("Error", "Fallo al validar la imagen: " + String(e?.message || e));
          return;
        }
      }
      // 2. Crear entidades pendientes (fiesta, etc.)
      _tempCreatedToCleanup = tempCreatedPartyId;
      pending = await createPendingEntities(userId).catch(() => ({}));
      if (tempCreatedPartyId) {
        try {
          const partys = await import("@/app/party/apis/partysApi");
          if (partys && typeof partys.updateParty === "function") {
            await partys.updateParty({ idFiesta: tempCreatedPartyId, isActivo: true });
            setSelectedPartyId(tempCreatedPartyId);
            setTempCreatedPartyId(null);
            setTempCreatedPartyName(null);
          }
        } catch {}
      }
      // 3. Resolver IDs de artistas
      const resolvedArtistIds: string[] = (() => {
        const existing = selectedArtists.map((a) => (a as any).idArtista ?? (a as any).id).filter(Boolean) as string[];
        const missingNames = selectedArtists.filter((a) => !((a as any).idArtista || (a as any).id)).map((a) => (a.name || "").trim()).filter(Boolean);
        const byNameResolved: string[] = [];
        if (missingNames.length && allArtists && allArtists.length) {
          for (const name of missingNames) {
            const found = allArtists.find((aa) => norm(aa.name || "") === norm(name));
            if (found && (found as any).idArtista) byNameResolved.push((found as any).idArtista);
          }
        }
        const created = (pending as any)?.artistaIds ?? [];
        return Array.from(new Set([...(existing || []), ...(byNameResolved || []), ...(created || [])]));
      })();
      if (resolvedArtistIds && resolvedArtistIds.length && (pending as any)?.artistaIdsMap) {
        const map = (pending as any).artistaIdsMap as Record<string, string>;
        setSelectedArtists((prev) => prev.map((a) => {
          const key = norm(a.name || "");
          if ((a as any).__isNew && map && map[key]) {
            return { ...(a as any), idArtista: map[key] } as ArtistSel;
          }
          return a;
        }));
      }
      // 4. Construir body y crear evento
      const body = {
        descripcion: eventDescription || "",
        domicilio: {
          direccion: street ? street.charAt(0).toUpperCase() + street.slice(1).toLowerCase() : "",
          latitud: 0,
          longitud: 0,
          provincia: { codigo: provinceId, nombre: provinceName },
          municipio: { codigo: municipalityId, nombre: municipalityName },
          localidad: { codigo: localityId, nombre: localityName },
        },
        fechas: daySchedules.map((d, i) => ({
          inicio: formatBackendIso(d.start),
          fin: formatBackendIso(d.end),
          inicioVenta: formatBackendIsoVenta(daySaleConfigs[i]?.saleStart),
          finVenta: formatBackendIsoVenta(daySaleConfigs[i]?.sellUntil),
          fechaInicioVenta: formatBackendIsoVenta(daySaleConfigs[i]?.saleStart),
          FechaInicioVenta: formatBackendIsoVenta(daySaleConfigs[i]?.saleStart),
          fechaIncioVenta: formatBackendIsoVenta(daySaleConfigs[i]?.saleStart),
          FechaIncioVenta: formatBackendIsoVenta(daySaleConfigs[i]?.saleStart),
          fechaFinVenta: formatBackendIsoVenta(daySaleConfigs[i]?.sellUntil),
          FechaFinVenta: formatBackendIsoVenta(daySaleConfigs[i]?.sellUntil),
        })),
        inicioEvento: formatBackendIso(daySchedules[0]?.start),
        finEvento: formatBackendIso(daySchedules[0]?.end),
        genero: selectedGenres,
        idArtistas: resolvedArtistIds,
        idFiesta: (pending && pending.partyCreated && pending.partyCreated.idFiesta) || selectedPartyId || null,
        idUsuario: userId,
        inicioVenta: formatBackendIsoVenta(daySaleConfigs[0]?.saleStart),
        finVenta: formatBackendIsoVenta(daySaleConfigs[0]?.sellUntil),
        FechaInicioVenta: formatBackendIsoVenta(daySaleConfigs[0]?.saleStart),
        FechaFinVenta: formatBackendIsoVenta(daySaleConfigs[0]?.sellUntil),
        fechaInicioVenta: formatBackendIsoVenta(daySaleConfigs[0]?.saleStart),
        fechaFinVenta: formatBackendIsoVenta(daySaleConfigs[0]?.sellUntil),
        fechaIncioVenta: formatBackendIsoVenta(daySaleConfigs[0]?.saleStart),
        FechaIncioVenta: formatBackendIsoVenta(daySaleConfigs[0]?.saleStart),
        isAfter,
        isLgbt: isLGBT,
        nombre: eventName,
        soundCloud: musicLink || "",
      };
      // Validación de fechas
      const badFechas = (body.fechas || []).some((f: any) => {
        const inicio = f?.inicio;
        const fin = f?.fin;
        if (!inicio || !fin) return true;
        const si = new Date(inicio).getTime();
        const fi = new Date(fin).getTime();
        if (!isFinite(si) || !isFinite(fi)) return true;
        const sy = new Date(inicio).getUTCFullYear();
        const fy = new Date(fin).getUTCFullYear();
        if ((sy && sy <= 1) || (fy && fy <= 1)) return true;
        return false;
      });
      if (badFechas) {
        Alert.alert("Validación", "Hay fechas inválidas. Revisá las fechas antes de crear el evento.");
        return;
      }
      // 5. Crear evento en backend
      try {
        createResult = await createEvent(body);
      } catch (err: any) {
        Alert.alert("Error al crear evento", extractBackendMessage(err));
        return;
      }
      // 6. Resolver idEvento y fechas
      if (typeof createResult === "string") {
        const s = String(createResult).trim();
        const esFecha = await probeGetEntradasFecha(s).catch(() => false);
        if (!esFecha) createdEventId = s;
      } else if (createResult && ((createResult as any).idEvento || (createResult as any).IdEvento || (createResult as any).id || (createResult as any).Id)) {
        createdEventId = String((createResult as any).idEvento ?? (createResult as any).IdEvento ?? (createResult as any).id ?? (createResult as any).Id);
      }
      remoteFechas = extractFechasFromCreateResp(createResult as any);
      if (!remoteFechas.length && typeof createResult === "string" && createResult.trim()) {
        const candidate = String(createResult).trim();
        const esFecha = await probeGetEntradasFecha(candidate).catch(() => false);
        if (esFecha) {
          fechaIds = [candidate];
        } else {
          try {
            const ev = await eventApi.fetchEventById(candidate);
            const fromEvent = ev?.fechas?.map((f: any) => String(f?.idFecha).trim()).filter(Boolean) || [];
            if (fromEvent.length) remoteFechas = fromEvent.map((id: string) => ({ idFecha: id }));
          } catch {}
        }
      }
      if (remoteFechas.length) {
        const mapped = mapLocalToRemoteFechaIds(daySchedules, remoteFechas as any);
        fechaIds = mapped.filter(Boolean);
      }
      // 7. Parchear fechas inválidas si es necesario
      const hasInvalidRemoteFechas = (arr: any[]) => Array.isArray(arr) && arr.some((f) => {
        const y1 = f?.inicio ? new Date(f.inicio).getUTCFullYear() : 0;
        const y2 = f?.fin ? new Date(f.fin).getUTCFullYear() : 0;
        return !f?.inicio || y1 <= 1 || !f?.fin || y2 <= 1;
      });
      if (createdEventId && fechaIds.length && hasInvalidRemoteFechas(remoteFechas)) {
        const { updateEventExact, formatIsoZulu } = await import("@/app/events/apis/eventApi");
        const fechasUpd = fechaIds.map((id, i) => ({
          idFecha: id,
          inicio: formatIsoZulu(daySchedules[i]?.start),
          fin: formatIsoZulu(daySchedules[i]?.end),
          inicioVenta: formatIsoZulu(daySaleConfigs[i]?.saleStart),
          finVenta: formatIsoZulu(daySaleConfigs[i]?.sellUntil),
          estado: 0,
        }));
        const exactBody: any = {
          idEvento: String(createdEventId),
          nombre: body.nombre,
          descripcion: body.descripcion,
          genero: body.genero,
          domicilio: body.domicilio,
          idArtistas: body.idArtistas,
          isAfter: body.isAfter,
          isLgbt: body.isLgbt,
          inicioEvento: formatIsoZulu(daySchedules[0]?.start),
          finEvento: formatIsoZulu(daySchedules[0]?.end),
          fechas: fechasUpd,
          idFiesta: body.idFiesta ?? null,
          soundCloud: body.soundCloud ?? "",
        };
        await updateEventExact(exactBody);
        try {
          const fresh = await eventApi.fetchEventById(String(createdEventId));
          const newFechas = Array.isArray((fresh as any)?.__raw?.fechas) ? (fresh as any).__raw.fechas : (fresh as any)?.fechas;
          remoteFechas = normalizeRemoteFechas(newFechas);
        } catch {}
      }
      // 8. Asociar fiesta y artistas al evento
      if (createdEventId && ((pending as any)?.partyCreated?.idFiesta || selectedPartyId)) {
        try {
          await eventApi.updateEvent(createdEventId, { idFiesta: String((pending as any)?.partyCreated?.idFiesta || selectedPartyId) });
        } catch {}
      }
      if (createdEventId && resolvedArtistIds.length) {
        try {
          await eventApi.updateEvent(createdEventId, { idArtistas: resolvedArtistIds });
        } catch {}
      }
      // 9. Crear artistas manuales y asociar
      const manualToCreate = selectedArtists.filter((a) => (a as any).__isNew || !(a as any).idArtista);
      if (manualToCreate.length && createdEventId) {
        const artistApi = await import("@/app/artists/apis/artistApi");
        const createdNow: string[] = [];
        for (const a of manualToCreate) {
          const name = (a.name || "").trim();
          if (!name) continue;
          const alreadyFromPending = (pending as any)?.artistaIdsMap && (pending as any).artistaIdsMap[norm(name)];
          if (alreadyFromPending) continue;
          try {
            const id = await artistApi.createArtistOnApi({ name, description: "", instagramURL: "", spotifyURL: "", soundcloudURL: "", isActivo: false } as any);
            if (id) {
              createdNow.push(String(id));
              setSelectedArtists((prev) => prev.map((x) => norm(x.name || "") === norm(name) ? ({ ...(x as any), idArtista: String(id) } as ArtistSel) : x));
            }
          } catch {}
        }
        if (createdNow.length) {
          try {
            await eventApi.updateEvent(createdEventId, { idArtistas: Array.from(new Set([...resolvedArtistIds, ...createdNow])) });
          } catch {}
        }
      }
      // 10. Asociar fechas explícitamente
      if (createdEventId && fechaIds.length) {
        try {
          await eventApi.updateEvent(createdEventId, { fechas: fechaIds.map((id) => ({ idFecha: id })) });
        } catch {}
      }
      // 11. Esperar fechas listas en backend
      for (const idF of fechaIds) {
        await entradaApi.ensureFechaListo(idF).catch(() => {});
      }
      // 12. Crear entradas
      const entradasPayload = await buildEntradasForFechas(fechaIds);
      try {
        await entradaApi.createEntradasBulk(entradasPayload);
      } catch (e: any) {
        if (createdEventId) {
          try {
            await eventApi.cancelEvent(createdEventId).catch(() => eventApi.setEventStatus(createdEventId!, eventApi.ESTADO_CODES.RECHAZADO as any));
          } catch {}
        }
        Alert.alert("Error al crear entradas", e?.message || "Fallo al crear las entradas. El evento fue cancelado.");
        return;
      }
      // 13. Subir media
      if (photoFile) {
        try {
          const FileSystem = await import("expo-file-system/legacy");
          const fileInfo: any = await FileSystem.getInfoAsync(photoFile);
          if (fileInfo?.size && fileInfo.size > MAX_IMAGE_BYTES) {
            Alert.alert("Imagen demasiado grande", "La imagen seleccionada supera el máximo permitido (2MB). Por favor, elige una imagen más liviana.");
            return;
          }
          const fn = photoFile.split("/").pop() || "image.jpg";
          const isPng = fn.toLowerCase().endsWith(".png");
          const fileObj = { uri: photoFile, name: fn, type: isPng ? "image/png" : "image/jpeg" } as any;
          const mediaApi = (await import("@/app/apis/mediaApi")).mediaApi;
          let uploadTarget = (fechaIds && fechaIds[0]) || null;
          let possibleEventId: string | null = null;
          if (typeof createResult === "string") {
            const cand = String(createResult).trim();
            const esFecha = await probeGetEntradasFecha(cand).catch(() => false);
            if (!esFecha) possibleEventId = cand;
          } else if (createResult && ((createResult as any).idEvento || (createResult as any).IdEvento || (createResult as any).id || (createResult as any).Id)) {
            possibleEventId = String((createResult as any).idEvento ?? (createResult as any).IdEvento ?? (createResult as any).id ?? (createResult as any).Id);
          }
          if (possibleEventId) uploadTarget = possibleEventId;
          if (!uploadTarget) {
            Alert.alert("Error", "No se encontró idEvento ni idFecha para subir la imagen. El evento fue creado pero sin imagen.");
            return;
          }
          // Intento: subir la nueva imagen y eliminar las previas para dejar solo la última.
          // Primero obtenemos la lista previa (para poder borrar luego)
          let prevIds: string[] = [];
          try {
            const prev = await mediaApi.getByEntidad(String(uploadTarget)).catch(() => ({ media: [] }));
            prevIds = Array.isArray(prev?.media) ? prev.media.map((m: any) => m.idMedia).filter(Boolean) : [];
          } catch {}

          await mediaApi.upload(String(uploadTarget), fileObj, undefined, { compress: true });

          // Borrar previas (best-effort). No interrumpimos el flujo si falla el borrado.
          for (const pid of prevIds) {
            try {
              await mediaApi.delete(pid);
            } catch (e) {
              try {
                log.warn('[CreateEvent] failed deleting previous media', pid, e);
              } catch {}
            }
          }
        } catch (e: any) {
          setCreationError("No se pudo subir la imagen. El evento fue creado pero sin imagen. Detalle: " + String(e?.message || e));
          Alert.alert("Error al subir imagen", "No se pudo subir la imagen. El evento fue creado pero sin imagen. Detalle: " + String(e?.message || e));
          return;
        }
      }
      // 14. Actualizar rol usuario
      if (isUsuario) {
        try {
          const userData = user as any;
          let backendRoles: number[] = [];
          let userProfile: any = null;
          try {
            const { getUsuarioById } = await import("@/app/auth/userApi");
            userProfile = await getUsuarioById(userData?.idUsuario ?? userData?.id ?? userId);
            const cdRolesArr = Array.isArray(userProfile?.cdRoles) ? userProfile.cdRoles.map(Number) : [];
            const rolesArr = Array.isArray(userProfile?.roles) ? userProfile.roles.map((r: any) => Number(r?.cdRol)).filter((n: number) => Number.isFinite(n)) : [];
            backendRoles = Array.from(new Set([...cdRolesArr, ...rolesArr]));
          } catch {}
          const roles = Array.isArray(userData?.roles) ? userData.roles.map(Number) : [];
          const allRoles = Array.from(new Set([...roles, ...backendRoles, 2]));
          const cdRoles = allRoles;
          const payload = {
            idUsuario: userData?.idUsuario ?? userData?.id ?? userId,
            nombre: userData?.nombre ?? userData?.name ?? "",
            apellido: userData?.apellido ?? userData?.lastName ?? "",
            correo: userData?.correo ?? userData?.email ?? "",
            cbu: userData?.cbu ?? "",
            dni: userData?.dni ?? "",
            telefono: userData?.telefono ?? "",
            bio: userData?.bio ?? "",
            cdRoles,
            domicilio: {
              provincia: { nombre: provinceName, codigo: provinceId },
              municipio: { nombre: municipalityName, codigo: municipalityId },
              localidad: { nombre: localityName, codigo: localityId },
              direccion: street ? street.charAt(0).toUpperCase() + street.slice(1).toLowerCase() : "",
              latitud: 0,
              longitud: 0,
            },
            socials: {
              idSocial: userData?.socials?.idSocial ?? "",
              mdInstagram: userData?.socials?.mdInstagram ?? "",
              mdSpotify: userData?.socials?.mdSpotify ?? "",
              mdSoundcloud: userData?.socials?.mdSoundcloud ?? "",
            },
            dtNacimiento: userData?.dtNacimiento ?? userData?.fechaNacimiento ?? "",
          };
          await updateUsuario(payload);
        } catch (e: any) {
          Alert.alert("Error actualizando rol", extractBackendMessage(e) + ". El evento fue creado correctamente.");
          // No aborta el evento, solo informa
        }
      }
      // 15. Éxito
      Alert.alert("Éxito", "Evento creado correctamente.");
      router.push(ROUTES.OWNER.MANAGE_EVENTS as any);
    } catch (err: any) {
      // Rollback de fiesta temporal si todo falla
      try {
        const toDel = (_tempCreatedToCleanup as string | null) || null;
        if (toDel) {
          try {
            const partys = await import("@/app/party/apis/partysApi");
            if (partys && typeof partys.deleteParty === "function") {
              await partys.deleteParty(toDel);
              setTempCreatedPartyId(null);
              setTempCreatedPartyName(null);
            }
          } catch {}
        }
      } catch {}
      Alert.alert("Error", String(err?.message || extractBackendMessage(err)));
    }
  }, [userId, eventName, photoFile, acceptedTC, eventType, dayCount, selectedGenres, selectedArtists, isRecurring, selectedPartyId, daySchedules, daySaleConfigs, musicLink, isAfter, isLGBT, provinceId, provinceName, municipalityId, municipalityName, localityId, localityName, street, router]);

  const artistSuggestions: Artist[] = useMemo(() => {
    const q = norm(artistInput);
    if (!q || !allArtists) return [];
    const selectedSet = new Set(selectedArtists.map((a) => norm(a.name)));
    return allArtists
      .filter((a) => !selectedSet.has(norm(a.name)) && norm(a.name).includes(q))
      .slice(0, 8)
      .map((a) => ({ ...a, name: toTitleCase(a.name) } as Artist));
  }, [artistInput, allArtists, selectedArtists]);

  const totalPerDay = useCallback(
    (d: DayTickets) =>
      (parseInt(d.genQty || "0", 10) || 0) +
      (parseInt(d.vipQty || "0", 10) || 0),
    []
  );

  const grandTotal = useMemo(
    () => daysTickets.reduce((acc, d) => acc + totalPerDay(d), 0),
    [daysTickets, totalPerDay]
  );

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
        mediaTypes: "images",
        quality: 0.8,
      });

      if (res.canceled || !res.assets?.length) return;

      const asset = res.assets[0];
      const uri = asset.uri;

      // Usar getInfoAsync (como en CreateNewScreen) para comprobar tamaño inmediatamente
      // Intentar obtener tamaño con getInfoAsync; si no está disponible, fallback a getFileSize
      setIsCheckingImage(true);
      let size = 0;
      try {
        const fileInfo: any = await getInfoAsync(uri);
        if (fileInfo && typeof fileInfo.size === "number") size = fileInfo.size;
        if (!size) {
          // fallback robusto
          size = await getFileSize(uri).catch(() => 0);
        }
      } finally {
        setIsCheckingImage(false);
      }

      if (!size || size === 0) {
        Alert.alert(
          "No se pudo determinar el tamaño de la imagen",
          "No se pudo verificar el tamaño del archivo. Por seguridad, seleccioná otra imagen o probá desde otra fuente."
        );
        return;
      }

      if (size > MAX_IMAGE_BYTES) {
        // marcar como demasiado grande, limpiar cualquier preview previa y bloquear submit
        setPhotoFile(null);
        setPhotoTooLarge(true);
        setPhotoFileSize(size);
        Alert.alert("Error", "La imagen supera el 1MB permitido.");
        return; // NO seteamos photoFile
      }

      // Extensión permitida (JPG, JPEG, PNG)
      const filename = asset.fileName || uri.split("/").pop() || "";
      const allowed = isAllowedExt(filename) || isAllowedExt(uri);
      if (!allowed) {
        Alert.alert(
          "Formato no soportado",
          "La imagen debe ser JPG, JPEG o PNG."
        );
        return; // NO seteamos photoFile
      }

      // Si pasó validaciones, setear photoFile y limpiar flags de tamaño
      setPhotoTooLarge(false);
      setPhotoFileSize(null);
      setPhotoFile(uri);
    } catch (e) {
      log.error("ImagePicker error", e);
      Alert.alert("Error", "No se pudo abrir la galería.");
    }
  }, []);

  const handleDeletePhoto = useCallback(() => {
    setPhotoFile(null);
    setPhotoTooLarge(false);
    setPhotoFileSize(null);
  }, []);

  /* ================= Render ================= */

  // Mostrar popup informativo (una sola vez) a usuarios que no son aún organizadores
  const [showOrganizadorPopup, setShowOrganizadorPopup] = React.useState(false);
  const didShowOrganizadorRef = React.useRef(false);
  React.useEffect(() => {
    try {
      // Mostrar popup solo a usuarios logueados que son 'user' pero no 'owner'
      if (!didShowOrganizadorRef.current && user && (isUsuario && !isOrganizador)) {
        didShowOrganizadorRef.current = true;
        setShowOrganizadorPopup(true);
      }
    } catch {}
  }, [user, isUsuario, isOrganizador]);

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
          <View style={{ width: "100%" }}>
            <View style={styles.divider} />
            <Text style={styles.subtitle}>
              Para crear un evento debes iniciar sesión.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={() => {}}
            >
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.registerButton]}
              onPress={() => {}}
            >
              <Text style={styles.buttonText}>Registrarme</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={() => {}}
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
            {creationError ? (
              <View
                style={{
                  padding: 12,
                  backgroundColor: "#fdecea",
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "#611a15", fontWeight: "600" }}>
                  Error creando evento
                </Text>
                <Text style={{ color: "#611a15" }}>{creationError}</Text>
              </View>
            ) : null}
            <Text style={styles.h2}>Datos del evento</Text>
            <EventBasicData
              eventName={eventName}
              onChangeEventName={setEventName}
              isRecurring={isRecurring}
              setIsRecurring={setIsRecurring}
              myParties={myParties.filter((p) => Boolean(p.isActivo))}
              partyLoading={partyLoading}
              selectedPartyId={selectedPartyId}
              setSelectedPartyId={setSelectedPartyId}
              showPartyDropdown={showPartyDropdown}
              setShowPartyDropdown={setShowPartyDropdown}
              newPartyName={newPartyName}
              setNewPartyName={handleNewPartyNameChange}
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
              setStreet={(v: string) => setStreet(toTitleCasePreserveSpaces(v))}
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
                handleSelectProvinceCallback(id, name);
                if (id === "02") {
                  // Cerrar desplegables y dejar campos deshabilitados y grises
                  setShowProvinces(false);
                  setShowMunicipalities(false);
                  setShowLocalities(false);
                  setMunicipalities([]);
                  setMunicipalityId("02");
                  setMunicipalityName("Ciudad Autónoma de Buenos Aires");
                  setLocalityLoading(true);
                  try {
                    const { fetchLocalitiesByProvince } = await import(
                      "@/app/apis/georefApi"
                    );
                    const locs = await fetchLocalitiesByProvince(id);
                    setLocalities(locs || []);
                    // Autoseleccionar la localidad "Ciudad Autónoma de Buenos Aires" si existe
                    const CABA_NAME = "Ciudad Autónoma de Buenos Aires";
                    const pick =
                      (locs || []).find(
                        (l: any) => norm(l?.nombre || "") === norm(CABA_NAME)
                      ) ||
                      (locs || []).find((l: any) =>
                        norm(l?.nombre || "").includes("ciudad autonoma")
                      );
                    if (pick) {
                      setLocalityId(String(pick.id));
                      setLocalityName(String(pick.nombre));
                    } else {
                      // Fallback: setear explícitamente CABA aunque no esté en la lista
                      setLocalityId("02");
                      setLocalityName(CABA_NAME);
                    }
                  } catch (e) {
                    setLocalities([]);
                    // En caso de fallo, igual autocompletar con CABA para no bloquear el flujo
                    setLocalityId("02");
                    setLocalityName("Ciudad Autónoma de Buenos Aires");
                  } finally {
                    setLocalityLoading(false);
                  }
                }
              }}
              handleSelectMunicipality={handleSelectMunicipalityCallback}
              handleSelectLocality={handleSelectLocalityCallback}
              allowLocalitiesWithoutMunicipality={provinceId === "02"}
            />
            <Text style={styles.h2}>Descripción</Text>
            <DescriptionField
              value={eventDescription}
              onChange={setEventDescription}
            />
            <Text style={styles.h2}>Fecha y hora del evento</Text>
            {/* Debug link removed: Ver fecha y hora (console) */}
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
            {/* Debug link removed: Ver fechas de venta (console) */}
            <TicketConfigSection
              daySaleConfigs={daySaleConfigs}
              setSaleCfg={setSaleCfg}
            />
            <Text style={styles.h2}>Multimedia</Text>
            <ImagePickerComponent
              value={photoFile}
              onChange={(uri) => {
                setPhotoFile(uri);
                if (!uri) {
                  setPhotoTooLarge(false);
                  setPhotoFileSize(null);
                }
              }}
              maxBytes={MAX_IMAGE_BYTES}
              allowedExts={["jpg", "jpeg", "png"]}
              label="Imagen del evento (obligatoria)"
            />

            <View style={styles.card}>
              <Text style={[styles.label, { marginBottom: 6 }]}>
                Enlaces multimedia
              </Text>
              <TextInput
                style={styles.textInput}
                value={videoLink}
                onChangeText={setVideoLink}
                keyboardType="url"
                placeholder="Enlace de YouTube"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.textInput}
                value={musicLink}
                onChangeText={setMusicLink}
                keyboardType="url"
                placeholder="Enlace de SoundCloud"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
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
                  <Text
                    style={styles.link}
                    onPress={() => {
                      openTycModal();
                    }}
                  >
                    Términos y Condiciones y Política de Privacidad
                  </Text>
                </Text>
              </TouchableOpacity>

              {photoTooLarge && (
                <Text style={{ color: COLORS.negative, marginBottom: 8 }}>
                  La imagen seleccionada excede{" "}
                  {Math.round(MAX_IMAGE_BYTES / 1024)}KB. Seleccioná otra
                  imagen.
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!photoFile || photoTooLarge || !acceptedTC) && {
                    opacity: 0.5,
                  },
                ]}
                onPress={async () => {
                  const ok = validateBeforeSubmit();
                  if (!ok) return;
                  // No permitir submit si la imagen es demasiado grande o no hay foto
                  if (!photoFile || photoTooLarge) {
                    Alert.alert(
                      "Foto inválida",
                      `Debés seleccionar una imagen válida de menos de ${Math.round(
                        MAX_IMAGE_BYTES / 1024
                      )}KB.`
                    );
                    return;
                  }
                  setCreating(true);
                  try {
                    await handleSubmit();
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={!photoFile || photoTooLarge || !acceptedTC}
              >
                <Text style={styles.submitButtonText}>CREAR EVENTO</Text>
              </TouchableOpacity>

              <CirculoCarga visible={creating} text="Creando evento..." />
            </View>
          </View>
        )}
      </ScrollView>

      <Footer />
      <Portal>
        {tycVisible && (
          <View style={styles.portalWrapper} pointerEvents="box-none">
            {Platform.OS === "ios" ? (
              <BlurView intensity={20} style={styles.modalBlurBackdrop}>
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      Términos y Condiciones y Política de Privacidad
                    </Text>
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
                        <Text
                          style={{ marginTop: 8, color: COLORS.textSecondary }}
                        >
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
                        <Text
                          style={{ color: COLORS.negative, marginBottom: 8 }}
                        >
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
                            WebViewComp =
                              require("react-native-webview").WebView;
                          } catch {}
                          if (WebViewComp) {
                            return (
                              <WebViewComp
                                source={{ uri: buildViewerUrl(tycUrl!) }}
                                style={{ flex: 1, borderRadius: RADIUS.card }}
                              />
                            );
                          }
                          // @ts-ignore - runtime check for web iframe
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
                                title="Términos y Condiciones y Política de Privacidad"
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
              </BlurView>
            ) : (
              <View style={styles.modalBackdrop} pointerEvents="box-none">
                <BlurView
                  intensity={100}
                  tint="dark"
                  style={[styles.absoluteFill, { zIndex: 10000 } as any]}
                  collapsable={false}
                />
                <View style={styles.darkOverlay} />
                <View
                  style={styles.modalContentWrapper}
                  pointerEvents="box-none"
                >
                  <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        Términos y Condiciones y Política de Privacidad
                      </Text>
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
                          <Text
                            style={{
                              marginTop: 8,
                              color: COLORS.textSecondary,
                            }}
                          >
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
                          <Text
                            style={{ color: COLORS.negative, marginBottom: 8 }}
                          >
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
                              WebViewComp =
                                require("react-native-webview").WebView;
                            } catch {}
                            if (WebViewComp) {
                              return (
                                <WebViewComp
                                  source={{ uri: buildViewerUrl(tycUrl!) }}
                                  style={{ flex: 1, borderRadius: RADIUS.card }}
                                />
                              );
                            }
                            // @ts-ignore - runtime check for web iframe
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
                                  title="Términos y Condiciones y Política de Privacidad"
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
                                  No se pudo incrustar el PDF en este
                                  dispositivo.
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
              </View>
            )}
          </View>
        )}
        {showOrganizadorPopup && (
          <View style={styles.portalWrapper} pointerEvents="box-none">
            <View style={styles.modalBackdrop} pointerEvents="box-none">
              <BlurView
                intensity={100}
                tint="dark"
                style={[styles.absoluteFill, { zIndex: 10000 } as any]}
                collapsable={false}
              />
              <View style={styles.darkOverlay} />
              <View
                style={styles.modalContentWrapper}
                pointerEvents="box-none"
              >
                <PopUpOrganizadorAndroid onClose={() => setShowOrganizadorPopup(false)} />
              </View>
            </View>
          </View>
        )}
      </Portal>
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
    backgroundColor: COLORS.textPrimary,
    marginTop: 18,
    paddingVertical: 16,
    borderRadius: 16,
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 16,
  },
  modalBlurBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  portalWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    padding: 16,
    zIndex: 10001,
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
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
  label: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    width: "100%",
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 14,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    color: COLORS.textPrimary,
  },
  fileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  fileBtnText: {
    color: COLORS.cardBg,
    fontWeight: "700",
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
