// src/screens/admin/EventsValidateScreens/ValidateEventScreen.tsx

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import InputDesc from "@/components/common/inputDesc";
import InputText from "@/components/common/inputText";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import { fetchEvents, setEventStatus, ESTADO_CODES, getEventFlags, EventItemWithExtras, fetchGenres, ApiGenero } from "@/utils/events/eventApi";
import { fetchEntradasFechaRaw, ApiEntradaFechaRaw, getTipoMap } from "@/utils/events/entradaApi";
import { apiClient, login } from "@/utils/apiConfig";
import * as nav from "@/utils/navigation";
import ROUTES from "@/routes";
import { EventItem } from "@/interfaces/EventItem";
import HeroImagen from "@/components/events/evento/HeroImagen";
import ReproductorSoundCloud from "@/components/events/evento/ReproductorSoundCloud";
import ReproductorYouTube from "@/components/events/evento/ReproductorYouTube";
// Las reseñas no se muestran en el preview de validación
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";
import Icon from "react-native-vector-icons/MaterialIcons";
import MCIcon from "react-native-vector-icons/MaterialCommunityIcons";
import { getProfile, getUsuarioById } from "@/utils/auth/userHelpers";
import { updateArtistOnApi, fetchOneArtistFromApi } from "@/utils/artists/artistApi";
import { mediaApi } from "@/utils/mediaApi";
import eventBus from "@/utils/eventBus";

export default function ValidateEventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const [eventData, setEventData] = useState<EventItemWithExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [genreMap, setGenreMap] = useState<Map<number, string>>(new Map());
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [entradasByFecha, setEntradasByFecha] = useState<Record<string, ApiEntradaFechaRaw[]>>({});
  const [entradasLoading, setEntradasLoading] = useState(false);
  const [tipoMap, setTipoMap] = useState<Map<number, string>>(new Map());
  // Popup de edición/activación inline (igual a EditarArtistaPantalla)
  const [editVisible, setEditVisible] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instagramURL, setInstagramURL] = useState("");
  const [spotifyURL, setSpotifyURL] = useState("");
  const [soundcloudURL, setSoundcloudURL] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [idMedia, setIdMedia] = useState<string | null>(null);
  const [idSocial, setIdSocial] = useState<string | null>(null);
  const [newImageLocalUri, setNewImageLocalUri] = useState<string | null>(null);
  // Avatar del propietario
  const [ownerAvatarUrl, setOwnerAvatarUrl] = useState<string | null>(null);
  // track subscriptions
  useEffect(() => {
    // Listen for artist activation updates coming back from EditarArtistaPantalla
    const off = eventBus.on("artist:activated", (payload: any) => {
      const activatedId = String(payload?.id ?? "");
      if (!activatedId) return;
      // reflect locally and inform the user
      setEventData((prev) => {
        if (!prev) return prev;
        const list = Array.isArray((prev as any).artistas) ? [ ...((prev as any).artistas) ] : [];
        const idx = list.findIndex((a: any) => String(a?.idArtista ?? a?.id ?? "") === activatedId);
        if (idx >= 0) {
          const a = { ...list[idx] };
          a.isActivo = true; a.activo = true; a.isActive = true; a.estado = 1; a.cdEstado = 1; a.status = 1;
          if (payload?.name) {
            a.nombre = payload.name; a.name = payload.name; a.dsNombre = payload.name; a.titulo = payload.name; a.tituloArtist = payload.name; a.artistName = payload.name;
          }
          list[idx] = a;
        }
        return { ...(prev as any), artistas: list } as any;
      });
      // iOS-style alert (Alert.alert renders native on iOS)
      Alert.alert("Artista activado", "Se activó correctamente el artista y se actualizó la vista.");
      // Optional: re-fetch the event to ensure fresh data from backend
      (async () => {
        try {
          const pendientes = await fetchEvents(0);
          const updated = pendientes.find(e => String(e.id) === String(id || ""));
          if (updated) setEventData(updated);
        } catch {}
      })();
    });
    return () => { off?.(); };
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        // Trae sólo los eventos con Estado=0
        const pendientes = await fetchEvents(0);
        // id viene como string, eventData.id es string
        const found = pendientes.find(e => e.id === id);
        if (found) {
          console.log("ValidateEventScreen - evento encontrado (normalizado):", found);
          setEventData(found);
        }
        // precargar géneros para poder mostrar múltiples géneros por nombre
        try {
          const gen = await fetchGenres();
          const map = new Map<number, string>(gen.map((g: ApiGenero) => [g.cdGenero, g.dsGenero]));
          setGenreMap(map);
        } catch {}
      } catch (err) {
        console.error("Error al cargar evento para validar:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Cargar mapa de tipos de entradas (cdTipo -> dsTipo)
  useEffect(() => {
    (async () => {
      try {
        const map = await getTipoMap();
        setTipoMap(map);
      } catch {}
    })();
  }, []);

  // Cargar entradas por fecha del evento
  useEffect(() => {
    (async () => {
      try {
        if (!eventData || !Array.isArray((eventData as any).fechas) || !(eventData as any).fechas.length) {
          setEntradasByFecha({});
          return;
        }
        setEntradasLoading(true);
        const fechas = ((eventData as any).fechas as Array<{ idFecha: string }>).map((f) => String(f.idFecha)).filter(Boolean);
        const pairs = (await Promise.all(
          fechas.map(async (idF) => {
            try {
              const arr = await fetchEntradasFechaRaw(idF);
              return [idF, Array.isArray(arr) ? arr : []] as [string, ApiEntradaFechaRaw[]];
            } catch {
              return [idF, [] as ApiEntradaFechaRaw[]];
            }
          })
        )) as Array<[string, ApiEntradaFechaRaw[]]>;
        const map: Record<string, ApiEntradaFechaRaw[]> = {};
        pairs.forEach(([k, v]) => {
          map[String(k)] = Array.isArray(v) ? v : [];
        });
        setEntradasByFecha(map);
      } finally {
        setEntradasLoading(false);
      }
    })();
  }, [eventData?.id, (eventData as any)?.fechas]);

  // Si no tenemos email del creador, intentar pedirlo a la API de usuarios
  useEffect(() => {
    (async () => {
      if (!eventData) return;
      console.log("ValidateEventScreen - eventData en efecto de macheo:", eventData);
      // ya hay email
      const existing =
        eventData.ownerEmail ||
        (eventData as any).__raw?.ownerEmail ||
        (eventData as any).__raw?.propietario?.correo ||
        (eventData as any).__raw?.usuario?.correo;
      console.log("ValidateEventScreen - existing email desde eventData/raw:", existing);
      if (existing) return;

      // intentar obtener ownerId desde el evento normalizado o raw
      const ownerId =
        eventData.ownerId ||
        (eventData as any).__raw?.ownerId ||
        (eventData as any).__raw?.propietario?.idUsuario ||
        (eventData as any).__raw?.usuario?.idUsuario ||
        (eventData as any).__raw?.idUsuarioPropietario;
      console.log("ValidateEventScreen - ownerId candidates, usado:", ownerId);

      // caches locales simples para esta pantalla
      const emailCache = new Map<string, any>();
      const idCache = new Map<string, any>();

      const fallbackEmail = (eventData as any)?.ownerEmail || (eventData as any)?.__raw?.correo || null;
      let profile: any = null;

      if (fallbackEmail) {
        const key = String(fallbackEmail).toLowerCase();
        if (emailCache.has(key)) profile = emailCache.get(key);
        else {
          try { profile = await getProfile(key); if (profile) emailCache.set(key, profile); } catch {}
        }
      }
      if (!profile && ownerId) {
        const key = String(ownerId);
        if (idCache.has(key)) profile = idCache.get(key);
        else {
          try { profile = await getUsuarioById(key); if (profile) idCache.set(key, profile); } catch {}
        }
      }

      if (profile) {
        setEventData(prev => prev ? ({
          ...prev,
          ownerName: profile.nombre ? `${profile.nombre} ${profile.apellido ?? ""}`.trim() : (prev.ownerName ?? undefined),
          ownerEmail: profile.correo ?? prev.ownerEmail,
          ownerId: profile.idUsuario ?? prev.ownerId,
        }) : prev);
        // Cargar avatar del propietario
        try {
          const finalOwnerId = String(profile.idUsuario || ownerId || "").trim();
          if (finalOwnerId) {
            const url = await mediaApi.getFirstImage(finalOwnerId);
            if (url && url.trim()) setOwnerAvatarUrl(url);
          }
        } catch {}
      }
    })();
  }, [eventData]);

  // Si ya contamos con ownerId pero aún no tenemos avatar, intentar cargarlo
  useEffect(() => {
    (async () => {
      try {
        const idCand = String((eventData as any)?.ownerId || (eventData as any)?.__raw?.propietario?.idUsuario || "").trim();
        if (idCand && !ownerAvatarUrl) {
          const url = await mediaApi.getFirstImage(idCand);
          if (url && url.trim()) setOwnerAvatarUrl(url);
        }
      } catch {}
    })();
  }, [eventData?.ownerId]);

  const handleValidate = () => {
    if (!eventData?.id) return;
    (async () => {
      try {
        setLoading(true);
        await setEventStatus(String(eventData.id), ESTADO_CODES.APROBADO);
  Alert.alert("Éxito", "El evento fue validado.");
  nav.replace(router, { pathname: ROUTES.ADMIN.EVENTS_VALIDATE.LIST, params: { refresh: Date.now() } });
      } catch (e: any) {
        console.error("Error validando evento:", e);
        Alert.alert("Error", e?.message || "No se pudo validar el evento.");
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleReject = () => {
    // validate reason then open confirmation modal
    if (!eventData?.id) return;
    if (!rejectReason || !rejectReason.trim()) {
      Alert.alert("Error", "Debés escribir el motivo del rechazo.");
      return;
    }
    setRejectModalVisible(true);
  };

  const handleRejectConfirmed = () => {
    if (!eventData?.id) return;
    const prev = eventData; // capture previous state for rollback
    (async () => {
      try {
        setLoading(true);
        // optimistic update: marcar localmente como RECHAZADO (cdEstado y estado)
        setEventData(prevData => prevData ? { ...prevData, cdEstado: ESTADO_CODES.RECHAZADO, estado: ESTADO_CODES.RECHAZADO } : prevData);

        await setEventStatus(String(eventData.id), ESTADO_CODES.RECHAZADO, { motivoRechazo: rejectReason.trim() });

  Alert.alert("Evento rechazado", "El evento fue marcado como rechazado.");
  setRejectModalVisible(false);
  nav.replace(router, { pathname: ROUTES.ADMIN.EVENTS_VALIDATE.LIST, params: { refresh: Date.now() } });
      } catch (e: any) {
        console.error("Error rechazando evento:", e);
        Alert.alert("Error", e?.message || "No se pudo rechazar el evento.");
        // rollback optimistic update
        setEventData(prev);
      } finally {
        setLoading(false);
      }
    })();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Evento no encontrado.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  // Intentar obtener el email del creador desde distintas fuentes (normalizado o raw)
  const creatorEmail =
    (eventData as any)?.ownerEmail ||
    (eventData as any)?.__raw?.ownerEmail ||
    (eventData as any)?.__raw?.propietario?.correo ||
    (eventData as any)?.propietario?.correo ||
    (eventData as any)?.usuario?.correo ||
    "";

  // Resolver nombre del propietario (preferir perfil enriquecido)
  const ownerName =
    (eventData as any)?.ownerName ||
    (eventData as any)?.__raw?.propietario?.nombre ||
    (eventData as any)?.__raw?.usuario?.nombre ||
    (eventData as any)?.ownerDisplayName ||
    "N/D";

  // Helper: géneros como nombres desde los códigos (o type simple)
  const getGenresText = (ev: EventItemWithExtras): string => {
    const raw: any = ev as any;
    const codes: number[] = Array.isArray(raw?.genero) ? raw.genero : [];
    if (codes.length && genreMap.size) {
      const names = codes
        .map((c) => genreMap.get(Number(c)) || null)
        .filter((n): n is string => Boolean(n));
      if (names.length) return names.join(", ");
    }
    return (ev as any).type || "Otros";
  };

  // Helper: lista de artistas con tolerancia a distintos shapes
  const getArtistsText = (arr: any[]): string => {
    if (!Array.isArray(arr) || !arr.length) return "";
    const names = arr
      .map((a) => {
        if (!a) return null;
        if (typeof a === "string") return a;
        return (
          a.nombre || a.name || a.dsNombre || a.titulo || a.tituloArtist || a.artistName || null
        );
      })
      .filter((v): v is string => Boolean(v));
    return names.join(", ");
  };

  // Helper: separar artistas activos vs inactivos (tolerante a distintos flags)
  const splitArtistsByActive = (arr: any[]): { active: string[]; inactive: string[] } => {
    const names = (a: any) => {
      if (!a) return null;
      if (typeof a === "string") return a;
      return a.nombre || a.name || a.dsNombre || a.titulo || a.tituloArtist || a.artistName || null;
    };
    const isActive = (a: any) => {
      const v = a?.isActivo ?? a?.activo ?? a?.isActive ?? a?.estaActivo ?? a?.enabled ?? null;
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v === 1;
      const st = a?.estado ?? a?.cdEstado ?? a?.status;
      if (typeof st === "number") return st === 1;
      if (typeof st === "string") return ["1", "aprobado", "activo", "true"].includes(st.toLowerCase());
      return true; // por defecto, considerar activo si no hay info
    };
    const active: string[] = [];
    const inactive: string[] = [];
    if (Array.isArray(arr)) {
      for (const a of arr) {
        const n = names(a);
        if (!n) continue;
        (isActive(a) ? active : inactive).push(n);
      }
    }
    return { active, inactive };
  };

  // Helper: obtener id y nombre de artistas
  const parseArtists = (arr: any[]): { id: string | null; name: string; active: boolean; raw: any }[] => {
    const toName = (a: any) => {
      if (!a) return "";
      if (typeof a === "string") return a;
      return a.nombre || a.name || a.dsNombre || a.titulo || a.tituloArtist || a.artistName || "";
    };
    const toId = (a: any) => String(a?.idArtista ?? a?.id ?? a?.artistId ?? a?.idUsuario ?? "" ) || null;
    const activeFlag = (a: any) => {
      const v = a?.isActivo ?? a?.activo ?? a?.isActive ?? a?.estaActivo ?? a?.enabled ?? null;
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v === 1;
      const st = a?.estado ?? a?.cdEstado ?? a?.status;
      if (typeof st === "number") return st === 1;
      if (typeof st === "string") return ["1", "aprobado", "activo", "true"].includes(st.toLowerCase());
      return true;
    };
    if (!Array.isArray(arr)) return [];
    return arr.map((a) => ({ id: toId(a), name: toName(a), active: activeFlag(a), raw: a }));
  };

  const openEditArtistPopup = async (artist: { id: string | null; name: string }) => {
    if (!artist?.id) {
      Alert.alert("No se puede activar", "Este artista no tiene un ID válido.");
      return;
    }
    try {
      setEditBusy(true);
      setEditId(String(artist.id));
      // cargar datos actuales
      const a = await fetchOneArtistFromApi(String(artist.id));
      setName(a?.name || artist.name || "");
      setDescription(a?.description || "");
      setInstagramURL(a?.instagramURL || "");
      setSpotifyURL(a?.spotifyURL || "");
      setSoundcloudURL(a?.soundcloudURL || "");
      setIdSocial(a?.idSocial ?? null);
      setImageUri(a?.image || null);
      // obtener media por entidad
      try {
        const media = await mediaApi.getByEntidad(String(artist.id));
        if (Array.isArray(media.media) && media.media.length > 0) {
          setIdMedia(media.media[0].idMedia || null);
        } else {
          setIdMedia(null);
        }
      } catch {
        setIdMedia(null);
      }
      setNewImageLocalUri(null);
      setEditVisible(true);
    } catch (e) {
      // Si falla la carga, al menos abrir con el nombre previo
      setName(artist.name || "");
      setEditId(String(artist.id));
      setEditVisible(true);
    } finally {
      setEditBusy(false);
    }
  };

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      const fileInfo: any = await FileSystem.getInfoAsync(asset.uri);
      if (fileInfo?.size && fileInfo.size > 2 * 1024 * 1024) {
        Alert.alert("Error", "La imagen supera los 2MB permitidos.");
        return;
      }
      setNewImageLocalUri(asset.uri);
      setImageUri(asset.uri);
    }
  };

  const handleDeleteImage = async () => {
    if (!idMedia) {
      return Alert.alert("Error", "No se encontró imagen para eliminar.");
    }
    try {
      await mediaApi.delete(idMedia);
      setImageUri(null);
      setIdMedia(null);
      Alert.alert("Imagen eliminada correctamente.");
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar la imagen.");
    }
  };

  const handleConfirmEditAndActivate = async () => {
    if (!editId || !name.trim()) {
      Alert.alert("Error", "El nombre del artista es obligatorio.");
      return;
    }
    try {
      setEditBusy(true);
      if (newImageLocalUri) {
        const fileName = newImageLocalUri.split("/").pop() ?? "foto.jpg";
        const file: any = { uri: newImageLocalUri, name: fileName, type: "image/jpeg" };
        await mediaApi.upload(editId, file, undefined, { compress: true });
        setNewImageLocalUri(null);
      }
      await updateArtistOnApi({
        idArtista: editId,
        name,
        description,
        instagramURL,
        spotifyURL,
        soundcloudURL,
        idSocial,
        isActivo: true,
      });
      // Actualizar UI local
      setEventData((prev) => {
        if (!prev) return prev;
        const list = Array.isArray((prev as any).artistas) ? [ ...((prev as any).artistas) ] : [];
        const idx = list.findIndex((a: any) => String(a?.idArtista ?? a?.id ?? "") === String(editId));
        if (idx >= 0) {
          const a = { ...list[idx] };
          a.isActivo = true; a.activo = true; a.isActive = true; a.estado = 1; a.cdEstado = 1; a.status = 1;
          a.nombre = name; a.name = name; a.dsNombre = name; a.titulo = name; a.tituloArtist = name; a.artistName = name;
          list[idx] = a;
        }
        return { ...(prev as any), artistas: list } as any;
      });
      setEditVisible(false);
      Alert.alert("Artista activado", "Se activó correctamente el artista y se actualizó la vista.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo actualizar/activar el artista.");
    } finally {
      setEditBusy(false);
    }
  };

  // confirmActivateArtist: reemplazado por handleConfirmEditAndActivate con popup completo

  // Helper: fecha de creación (arriba) y formatos
  const formatDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(String(iso));
    if (!isFinite(d.getTime())) return "";
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const formatHHmm = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(String(iso));
    if (!isFinite(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const getCreationDate = (ev: EventItemWithExtras): string => {
    const raw: any = (ev as any)?.__raw ?? {};
    const cands = [
      (ev as any)?.fechaCreacion,
      (ev as any)?.createdAt,
      raw?.fechaCreacion,
      raw?.dtCreacion,
      raw?.dtAlta,
      raw?.createdAt,
      raw?.creationDate,
      raw?.fecAlta,
    ].filter(Boolean);
    const first = cands[0];
    return formatDate(first);
  };

  // Formato "28 Marzo 2025" (sin "de" y con mes capitalizado)
  const formatDatePretty = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(String(iso));
    if (!isFinite(d.getTime())) return "";
    const months = [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ];
    const dd = d.getDate().toString().padStart(2, '0');
    const mm = months[d.getMonth()] || "";
    const yyyy = d.getFullYear();
    return `${dd} ${mm} ${yyyy}`;
  };

  // Helper: formato de moneda ARS sin decimales
  const formatCurrency = (n?: number) => {
    const val = Number(n ?? 0);
    try {
      return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(val);
    } catch {
      return `$${Math.round(val)}`;
    }
  };

  // Helper: nombre del tipo de entrada
  const getTipoNombreEntrada = (e: ApiEntradaFechaRaw): string => {
    const nameRaw = e?.tipo?.dsTipo;
    const rawCd: any = (e?.tipo?.cdTipo ?? (e as any)?.cdTipo ?? (e as any)?.tipo);
    const cd = Number(rawCd);
    const fromMap = Number.isFinite(cd) ? tipoMap.get(cd) : undefined;
    if (nameRaw && String(nameRaw).trim()) return String(nameRaw);
    if (fromMap && String(fromMap).trim()) return String(fromMap);
    return Number.isFinite(cd) ? `Tipo ${cd}` : "Tipo";
  };

  // Google Maps deep link
  const openMapsForAddress = (address?: string) => {
    const q = String(address || "").trim();
    if (!q) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    Linking.openURL(url).catch(() => {});
  };

  // Preview: reusar componentes de EventScreen para mostrar cómo se vería el evento
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Encabezado replicando mock */}
          <Text style={styles.pageTitle}>Verificar Evento</Text>
          <View style={[styles.infoCard, styles.summaryContainer]}>
            <Text style={styles.eventTitle}>{eventData.title}</Text>
            <View style={styles.ownerRow}>
              {ownerAvatarUrl ? (
                <Image source={{ uri: ownerAvatarUrl }} style={styles.ownerAvatar} />
              ) : (
                <View style={styles.ownerAvatarPlaceholder}>
                  <Icon name="person" size={22} color="#555" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerName}>{ownerName}</Text>
                {creatorEmail ? <Text style={styles.summaryEmail}>{creatorEmail}</Text> : null}
              </View>
            </View>
            <View style={styles.chipsWrap}>
              {(() => {
                const genreText = getGenresText(eventData);
                const flags = getEventFlags(eventData);
                return (
                  <>
                    {genreText ? (
                      <View style={[styles.chip, styles.chipGenre]}>
                        <Icon name="music-note" size={14} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
                        <Text style={[styles.chipText, styles.chipTextGenre]}>{genreText}</Text>
                      </View>
                    ) : null}
                    {flags.isLGBT ? (
                      <View style={[styles.chip, styles.chipLGBT]}>
                        <MCIcon name="rainbow" size={14} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.chipTextDark}>LGTB+</Text>
                      </View>
                    ) : null}
                    {flags.isAfter ? (
                      <View style={[styles.chip, styles.chipAfter]}>
                        <MCIcon name="weather-night" size={14} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.chipTextDark}>AFTER</Text>
                      </View>
                    ) : null}
                  </>
                );
              })()}
            </View>
            <View style={{ marginTop: 8 }}>
              <HeroImagen imageUrl={(eventData as any).imageUrl} onPress={() => setImageModalVisible(true)} />
              <Text style={styles.imageHint}>Tocar imagen para verla completa</Text>
            </View>
          </View>

          {/* Fechas y Horarios */}
          <Text style={styles.sectionTitle}>Fechas y Horarios</Text>
          <View style={[styles.infoCard, styles.sectionContainer]}>
            {/* fila fechas */}
            <View style={styles.rowTwoCols}>
              <View style={styles.colBox}>
                <Text style={styles.smallLabel}>Fecha inicio</Text>
                <Text style={styles.strongValue}>{formatDatePretty((eventData as any)?.fechas?.[0]?.inicio || (eventData as any)?.__raw?.inicio || (eventData as any)?.__raw?.inicioEvento || null)}</Text>
              </View>
              <View style={styles.colBox}>
                <Text style={styles.smallLabel}>Fecha fin</Text>
                <Text style={styles.strongValue}>{formatDatePretty((eventData as any)?.fechas?.[0]?.fin || (eventData as any)?.__raw?.fin || (eventData as any)?.__raw?.finEvento || null)}</Text>
              </View>
            </View>
            {/* fila horas */}
            <View style={[styles.rowTwoCols, { marginTop: 8 }]}>
              <View style={styles.colBox}>
                <Text style={styles.smallLabel}>Hora inicio</Text>
                <Text style={styles.strongValue}>{formatHHmm((eventData as any)?.fechas?.[0]?.inicio || (eventData as any)?.__raw?.inicio || (eventData as any)?.__raw?.inicioEvento || "")}</Text>
              </View>
              <View style={styles.colBox}>
                <Text style={styles.smallLabel}>Hora fin</Text>
                <Text style={styles.strongValue}>{formatHHmm((eventData as any)?.fechas?.[0]?.fin || (eventData as any)?.__raw?.fin || (eventData as any)?.__raw?.finEvento || "")}</Text>
              </View>
            </View>
          </View>

          {/* Dirección */}
          <Text style={styles.sectionTitle}>Dirección</Text>
          <View style={[styles.infoCard, styles.sectionContainer]}>
            <Text style={styles.summaryValue}>{(eventData as any).address || ""}</Text>
          </View>

          {/* Artistas */}
          <Text style={styles.sectionTitle}>Artistas</Text>
          <View style={[styles.infoCard, styles.sectionContainer]}>
            <View style={[styles.summaryRow, { alignItems: "flex-start" }]}>
              <Icon name="mic" size={18} color={COLORS.textSecondary || "#666"} style={{ marginRight: 6, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                {(() => {
                  const parsed = parseArtists((eventData as any).artistas || []);
                  return (
                    <>
                      {parsed.length ? (
                        parsed.map((a) => (
                          <View key={`${a.id ?? a.name}`} style={styles.inactiveRow}>
                            <Text style={styles.summaryValue}>{a.name || "(sin nombre)"}</Text>
                            {a.active ? (
                              <View style={styles.statusPill}><Text style={styles.statusPillText}>Activo</Text></View>
                            ) : (
                              a.id ? (
                                <TouchableOpacity style={styles.activateBtn} onPress={() => openEditArtistPopup({ id: a.id!, name: a.name })}>
                                  <Text style={styles.activateBtnText}>Activar</Text>
                                </TouchableOpacity>
                              ) : null
                            )}
                          </View>
                        ))
                      ) : (
                        <Text style={styles.summaryValue}>—</Text>
                      )}
                    </>
                  );
                })()}
              </View>
            </View>
          </View>

          {/* Tipos de Entradas */}
          <Text style={styles.sectionTitle}>Tipos de Entradas</Text>
          <View style={[styles.infoCard, styles.sectionContainer]}>
            {entradasLoading ? (
              <View style={{ paddingVertical: 8 }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : (() => {
              const fechas = Array.isArray((eventData as any).fechas) ? (eventData as any).fechas : [];
              // calcular si todas las fechas no tienen entradas
              const totalEntradas = fechas.reduce((acc: number, f: any) => acc + ((entradasByFecha[String(f.idFecha)] || []).length), 0);
              if (!fechas.length || totalEntradas === 0) {
                return <Text style={styles.summaryValue}>No hay entradas configuradas.</Text>;
              }
              return (
                <View>
                  {fechas.map((f: any, ix: number) => {
                    const idF = String(f?.idFecha || "");
                    const list = entradasByFecha[idF] || [];
                    const fechaLabel = formatDate(f?.inicio || f?.FechaInicio || f?.dtInicio || "");
                    return (
                      <View key={idF} style={{ marginBottom: 8 }}>
                        <Text style={styles.ticketsDate}>{(fechaLabel || "—") + ` - día ${ix + 1}`}</Text>
                        {list.length === 0 ? (
                          <Text style={styles.summaryValue}>—</Text>
                        ) : (
                          list.map((e, idx) => (
                            <View key={`${idF}-${idx}`} style={styles.ticketItem}>
                              <View>
                                <Text style={styles.ticketName}>{getTipoNombreEntrada(e)}</Text>
                                <Text style={styles.ticketPrice}>{formatCurrency(e?.precio)}</Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.ticketDate}>Entradas</Text>
                                <Text style={styles.ticketCount}>{Number(e?.cantidad ?? 0)} entradas</Text>
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>

          <Text style={styles.sectionTitle}>Descripción del Evento</Text>
          <View style={[styles.infoCard, styles.sectionContainer]}>
            <Text style={styles.descriptionText}>{(eventData as any).description || ""}</Text>
          </View>

          {/* La imagen principal ya se muestra en HeroImagen arriba; evitamos duplicados */}

          {/* Multimedia (mostrar solo si existe contenido) */}
          {(() => {
            const scUrl = (eventData as any)?.musica || (eventData as any)?.soundCloud || (eventData as any)?.soundcloud || null;
            const ytUrl = (eventData as any)?.youTubeEmbedUrl || (eventData as any)?.youtubeUrl || (eventData as any)?.youtube || null;
            if (!scUrl && !ytUrl) return null;
            return (
              <>
                <Text style={styles.sectionTitle}>Multimedia</Text>
                <View style={[styles.infoCard, { marginTop: 8, paddingHorizontal: 8, paddingVertical: 8 }]}> 
                  {scUrl ? <ReproductorSoundCloud soundCloudUrl={scUrl} /> : null}
                  {ytUrl ? <ReproductorYouTube youTubeEmbedUrl={ytUrl} /> : null}
                </View>
              </>
            );
          })()}

          <Text style={[styles.rejectTitle, { marginTop: 12 }]}>Motivo de Rechazo</Text>
          <Text style={styles.rejectSubtitle}>Es obligatorio escribir un motivo si vas a rechazar el evento. Este motivo se enviará al equipo y al creador del evento vía mail y quedará registrado.</Text>
          <InputDesc
            label=""
            value={rejectReason}
            isEditing={true}
            onBeginEdit={() => {}}
            onChangeText={setRejectReason}
            placeholder="Escribir motivo de rechazo..."
            autoFocus={false}
            containerStyle={{ width: "100%", alignItems: "stretch" }}
            labelStyle={{ width: "100%", textAlign: "left" }}
            inputStyle={{ width: "100%" }}
          />

          {/* Confirmación modal antes de rechazar */}
          <Modal visible={rejectModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Confirmar rechazo</Text>
                <Text style={styles.modalMessage}>
                  {`Estás por rechazar este evento. Se enviará el motivo al equipo`}
                  {creatorEmail ? ` y al creador vía mail.` : ` y al creador vía mail.`}
                </Text>
                {creatorEmail ? <Text style={styles.modalEmail}>{creatorEmail}</Text> : null}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity style={[styles.button, styles.modalCancel]} onPress={() => setRejectModalVisible(false)}>
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.modalConfirm]} onPress={handleRejectConfirmed}>
                    <Text style={styles.buttonText}>Confirmar rechazo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.button, styles.validateButton]} onPress={handleValidate}>
              <Text style={styles.buttonText}>Validar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={handleReject}>
              <Text style={styles.buttonText}>Rechazar</Text>
            </TouchableOpacity>
          </View>

          

          {/* Modal de imagen en pantalla completa */}
          <Modal visible={imageModalVisible} transparent animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
            <View style={styles.imageModalOverlay}>
              <Image source={{ uri: (eventData as any).imageUrl }} style={styles.imageModalImage} resizeMode="contain" />
              <TouchableOpacity style={styles.imageModalCloseBtn} onPress={() => setImageModalVisible(false)}>
                <Text style={styles.imageModalCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </Modal>

          {/* Popup: Editar/Activar artista (igual a EditarArtistaPantalla) */}
          <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { maxHeight: "90%" }]}> 
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 12 }}
                >
                  <Text style={styles.modalTitle}>Editar y activar artista</Text>
                  <InputText
                    label="Nombre del artista"
                    value={name}
                    isEditing={true}
                    onBeginEdit={() => {}}
                    onChangeText={setName}
                    containerStyle={{ width: "100%", alignItems: "stretch" }}
                    labelStyle={{ width: "100%", textAlign: "left" }}
                    inputStyle={{ width: "100%" }}
                  />
                  <Text style={[styles.summaryLabel, { marginTop: 12, marginBottom: 4 }]}>Foto del artista:</Text>
                  <View style={{ alignItems: "center", marginBottom: 8 }}>
                    {imageUri ? (
                      <>
                        <Image source={{ uri: imageUri }} style={{ width: 140, height: 140, borderRadius: 70, marginBottom: 12 }} />
                        {idMedia ? (
                          <TouchableOpacity style={[styles.button, styles.modalCancel]} onPress={handleDeleteImage}>
                            <Text style={styles.buttonText}>Eliminar imagen actual</Text>
                          </TouchableOpacity>
                        ) : null}
                      </>
                    ) : (
                      <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: "#ddd", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                        <Text style={{ color: "#666" }}>Sin imagen</Text>
                      </View>
                    )}
                    <TouchableOpacity style={[styles.button, styles.validateButton]} onPress={handleSelectImage}>
                      <Text style={styles.buttonText}>Seleccionar imagen</Text>
                    </TouchableOpacity>
                    <Text style={{ marginTop: 6, fontSize: 12, color: "#666" }}>Se permiten imágenes JPG, JPEG o PNG. Peso máximo: 2MB.</Text>
                  </View>
                  <InputDesc
                    label="Información sobre el artista"
                    value={description}
                    isEditing={true}
                    onBeginEdit={() => {}}
                    onChangeText={setDescription}
                    autoFocus={false}
                    containerStyle={{ width: "100%", alignItems: "stretch" }}
                    labelStyle={{ width: "100%", textAlign: "left" }}
                    inputStyle={{ width: "100%" }}
                  />
                  <InputText
                    label="URL del Instagram del artista"
                    value={instagramURL}
                    isEditing={true}
                    onBeginEdit={() => {}}
                    onChangeText={setInstagramURL}
                    keyboardType="url"
                    containerStyle={{ width: "100%", alignItems: "stretch" }}
                    labelStyle={{ width: "100%", textAlign: "left" }}
                    inputStyle={{ width: "100%" }}
                  />
                  <InputText
                    label="URL del SoundCloud del artista"
                    value={soundcloudURL}
                    isEditing={true}
                    onBeginEdit={() => {}}
                    onChangeText={setSoundcloudURL}
                    keyboardType="url"
                    containerStyle={{ width: "100%", alignItems: "stretch" }}
                    labelStyle={{ width: "100%", textAlign: "left" }}
                    inputStyle={{ width: "100%" }}
                  />
                  <InputText
                    label="URL del Spotify del artista"
                    value={spotifyURL}
                    isEditing={true}
                    onBeginEdit={() => {}}
                    onChangeText={setSpotifyURL}
                    keyboardType="url"
                    containerStyle={{ width: "100%", alignItems: "stretch" }}
                    labelStyle={{ width: "100%", textAlign: "left" }}
                    inputStyle={{ width: "100%" }}
                  />
                  <View style={[styles.modalButtonsRow, { marginTop: 12 }]}>
                    <TouchableOpacity style={[styles.button, styles.modalCancel]} onPress={() => setEditVisible(false)} disabled={editBusy}>
                      <Text style={styles.buttonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.modalConfirm]} onPress={handleConfirmEditAndActivate} disabled={editBusy}>
                      <Text style={styles.buttonText}>{editBusy ? "Guardando..." : "Confirmar y Activar"}</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 16 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#f00" },

  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontWeight: "bold",
    width: 100,
  },
  value: {
    flex: 1,
  },
  descriptionBox: {
    backgroundColor: "#f3f3f3",
    padding: 8,
    borderRadius: 6,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
    borderRadius: 6,
    marginVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  noImageText: {
    color: "#666",
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  validateButton: {
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: COLORS.negative,
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  previewNoteWrap: {
    marginTop: 18,
    backgroundColor: "#fff7e6",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ffe9b8",
  },
  previewNote: {
    color: "#7a5a00",
    fontSize: 13,
    lineHeight: 18,
  },
  rejectTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary || "#222",
    marginBottom: 6,
  },
  rejectSubtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#444",
    marginBottom: 14,
  },
  modalEmail: {
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 12,
    fontWeight: "600",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalCancel: {
    backgroundColor: "#ccc",
    marginRight: 8,
  },
  modalConfirm: {
    backgroundColor: COLORS.negative,
  },
  // Summary (encabezado similar a la web)
  pageTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary || "#222",
    marginTop: 6,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#cfd3da",
    marginBottom: 8,
    fontFamily: FONTS.titleBold,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary || "#111",
    marginBottom: 8,
    fontFamily: FONTS.titleBold,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ownerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#ddd',
  },
  ownerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  ownerName: {
    fontWeight: '700',
    color: COLORS.textPrimary || '#222',
  },
  summaryContainer: {
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryLabel: {
    fontWeight: "700",
    color: COLORS.textPrimary || "#222",
    marginRight: 6,
    fontFamily: FONTS.subTitleMedium,
  },
  summaryValue: {
    color: COLORS.textSecondary || "#444",
    flexShrink: 1,
    fontFamily: FONTS.bodyRegular,
  },
  summaryLabelInline: {
    color: COLORS.textSecondary || "#444",
    fontFamily: FONTS.bodyRegular,
  },
  summaryEmail: {
    color: COLORS.textSecondary || "#555",
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONTS.bodyRegular,
  },
  sectionContainer: {
    marginTop: 8,
    marginBottom: 10,
  },
  imageHint: {
    fontSize: 10,
    color: COLORS.textSecondary || "#777",
    marginTop: 4,
    marginLeft: 4,
  },
  linkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.primary,
    alignSelf: "center",
    marginLeft: 8,
  },
  linkBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: FONTS.subTitleMedium,
  },
  ticketsDate: {
    fontWeight: "700",
    color: COLORS.textPrimary || "#222",
    marginBottom: 6,
    fontFamily: FONTS.subTitleMedium,
  },
  ticketLine: {
    color: COLORS.textSecondary || "#555",
    fontSize: 13,
    marginLeft: 6,
    marginBottom: 2,
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  ticketName: {
    color: COLORS.textPrimary || '#222',
    fontWeight: '700',
  },
  ticketPrice: {
    color: COLORS.textSecondary || '#666',
    fontSize: 12,
  },
  ticketDate: {
    color: COLORS.textSecondary || '#666',
    fontSize: 12,
  },
  ticketCount: {
    color: COLORS.textSecondary || '#444',
    fontSize: 12,
  },
  // Polished cards and sections
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary || "#222",
    marginTop: 12,
    marginBottom: 6,
    fontFamily: FONTS.titleBold,
  },
  rowTwoCols: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  colBox: { flex: 1 },
  smallLabel: {
    color: COLORS.textSecondary || '#555',
    fontSize: 13,
    marginBottom: 2,
    fontFamily: FONTS.bodyRegular,
  },
  strongValue: {
    color: COLORS.textPrimary || '#222',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: FONTS.subTitleMedium,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.primary,
    marginRight: 8,
    marginBottom: 8,
  },
  chipGenre: {
    backgroundColor: '#eef2ff',
    borderColor: '#e5e7eb',
  },
  chipLGBT: {
    backgroundColor: COLORS.tagLGBT,
    borderColor: COLORS.tagLGBT,
  },
  chipAfter: {
    backgroundColor: COLORS.tagAfter,
    borderColor: COLORS.tagAfter,
  },
  chipText: {
    color: COLORS.textPrimary || "#222",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: FONTS.subTitleMedium,
  },
  chipTextGenre: {
    color: COLORS.textPrimary || '#222',
  },
  chipTextDark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.subTitleMedium,
  },
  descriptionText: {
    color: COLORS.textSecondary || "#444",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.bodyRegular,
  },
  // Fullscreen image modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalImage: {
    width: "100%",
    height: "80%",
  },
  imageModalCloseBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  imageModalCloseText: {
    color: "#fff",
    fontWeight: "700",
  },
  inactiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  activateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  activateBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary || '#333',
    fontFamily: FONTS.subTitleMedium,
  },
});
