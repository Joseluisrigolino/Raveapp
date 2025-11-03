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
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import { fetchEvents, setEventStatus, ESTADO_CODES, getEventFlags, EventItemWithExtras, fetchGenres, ApiGenero } from "@/app/events/apis/eventApi";
import { fetchEntradasFechaRaw, ApiEntradaFechaRaw, getTipoMap } from "@/app/events/apis/entradaApi";
import { apiClient, login } from "@/app/apis/apiConfig";
import * as nav from "@/utils/navigation";
import ROUTES from "@/routes";
import { EventItem } from "@/interfaces/EventItem";
import HeroImagen from "@/app/events/components/evento/HeroImagen";
import ReproductorSoundCloud from "@/app/events/components/evento/ReproductorSoundCloud";
import ReproductorYouTube from "@/app/events/components/evento/ReproductorYouTube";
// Las reseñas no se muestran en el preview de validación
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";
import Icon from "react-native-vector-icons/MaterialIcons";
import MCIcon from "react-native-vector-icons/MaterialCommunityIcons";
import { getProfile, getUsuarioById } from "@/app/auth/userHelpers";
import { updateArtistOnApi, fetchOneArtistFromApi } from "@/app/artists/apis/artistApi";
import { mediaApi } from "@/app/apis/mediaApi";
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
    const activeFlag = (a: any) => { return true; };
    return Array.isArray(arr) ? arr.map((a:any) => ({ id: toId(a), name: toName(a), active: activeFlag(a), raw: a })) : [];
  };

  const openImage = async (uri?: string) => {
    const url = uri || eventData?.imageUrl;
    if (!url) return;
    try { await Linking.openURL(String(url)); } catch {};
  };

  // Render principal: resumen, multimedia y acciones
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ padding: 12 }}>
            <Text style={{ fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.titleMain }}>{eventData.title}</Text>
            <Text style={{ color: COLORS.textSecondary, marginTop: 6 }}>{getGenresText(eventData)}</Text>
          </View>

          <HeroImagen imageUrl={eventData.imageUrl} />

          <View style={{ padding: 12 }}>
            <Text style={{ fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.subTitle }}>Propietario</Text>
            <Text>{ownerName} {creatorEmail ? `· ${creatorEmail}` : ''}</Text>
          </View>

          <View style={{ padding: 12 }}>
            <Text style={{ fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.subTitle }}>Artistas</Text>
            <Text>{getArtistsText((eventData as any).artistas || [])}</Text>
          </View>

          <View style={{ padding: 12 }}>
            <Text style={{ fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.subTitle }}>Multimedia</Text>
            <ReproductorSoundCloud soundCloudUrl={(eventData as any).musica || ''} />
            <ReproductorYouTube youTubeEmbedUrl={(eventData as any).video || ''} />
          </View>

          <View style={{ padding: 12, flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={{ backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 }} onPress={handleValidate}>
              <Text style={{ color: '#fff' }}>Aprobar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: COLORS.negative, padding: 12, borderRadius: 10 }} onPress={() => setRejectModalVisible(true)}>
              <Text style={{ color: '#fff' }}>Rechazar</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.negative }
});
