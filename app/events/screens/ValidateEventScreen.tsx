// src/screens/admin/EventsValidateScreens/ValidateEventScreen.tsx

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, Linking, TextInput } from "react-native";
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
import { sendGenericEmail } from "@/app/apis/mailsApi";
import * as nav from "@/utils/navigation";
import ROUTES from "@/routes";
import { EventItem } from "@/interfaces/EventItem";
import HeroImagen from "@/app/events/components/evento/HeroImagen";
import ReproductorSoundCloud from "@/app/events/components/evento/ReproductorSoundCloud";
import ReproductorYouTube from "@/app/events/components/evento/ReproductorYouTube";
// Las reseñas no se muestran en el preview de validación
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { MaterialCommunityIcons as MCIcon } from "@expo/vector-icons";
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
  // Eliminamos modal, ahora rechazo inline
  const [genreMap, setGenreMap] = useState<Map<number, string>>(new Map());
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [entradasByFecha, setEntradasByFecha] = useState<Record<string, ApiEntradaFechaRaw[]>>({});
  const [entradasLoading, setEntradasLoading] = useState(false);
  const [tipoMap, setTipoMap] = useState<Map<number, string>>(new Map());
  // Popup de edición/activación inline (igual a EditArtistScreen)
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
  // Fullscreen image modal
  const [heroOpen, setHeroOpen] = useState(false);
  // Cache de imágenes por artista
  const [artistImages, setArtistImages] = useState<Record<string, string>>({});
  // track subscriptions
  useEffect(() => {
    // Listen for artist activation updates coming back from EditArtistScreen
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

  // Normaliza URL absoluta (agrega baseURL si viene relativa)
  const ensureAbs = (url?: string | null): string => {
    const u = String(url || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    const base = apiClient.defaults.baseURL ?? "";
    return base ? `${base}${u.startsWith("/") ? "" : "/"}${u}` : u;
  };

  // Resolver imágenes de artistas cuando cambia la lista
  useEffect(() => {
    (async () => {
      const list = ((eventData as any)?.artistas || []) as any[];
      if (!Array.isArray(list) || list.length === 0) {
        setArtistImages({});
        return;
      }
      try {
        const pairs = await Promise.all(
          list.map(async (a: any) => {
            const id = String(a?.idArtista ?? a?.id ?? a?.artistId ?? "");
            if (!id) return null;
            // usar media existente si viene en el objeto
            const existing = a?.image || a?.imagen || a?.media?.[0]?.url || null;
            let url = ensureAbs(existing);
            if (!url) {
              try {
                // Primero probamos Media API directa
                const fromMedia = await mediaApi.getFirstImage(id);
                url = ensureAbs(fromMedia);
                // Si aún no hay, probar fetchOneArtistFromApi (que también resuelve absoluta)
                if (!url) {
                  try {
                    const det = await fetchOneArtistFromApi(id);
                    url = ensureAbs((det as any)?.image);
                  } catch {}
                }
              } catch {}
            }
            return url ? ([id, url] as [string, string]) : null;
          })
        );
        const map: Record<string, string> = {};
        for (const p of pairs) {
          if (p && p[0] && p[1]) map[p[0]] = p[1];
        }
        setArtistImages(map);
      } catch {
        // mantener cache anterior si algo falla
      }
    })();
  }, [(eventData as any)?.artistas]);

  const handleValidate = () => {
    if (!eventData?.id) return;
    // prevenir validación si hay artistas inactivos
    try {
      const inactive = splitArtistsByActive((eventData as any)?.artistas || []).inactive;
      if (Array.isArray(inactive) && inactive.length > 0) {
        Alert.alert(
          'No se puede validar',
          `Activá los artistas inactivos antes de validar el evento. Artistas inactivos: ${inactive.slice(0,5).join(', ')}`
        );
        return;
      }
    } catch (e) {
      // no bloquear en caso de error inesperado en la comprobación
    }

    (async () => {
      try {
        setLoading(true);
        await setEventStatus(String(eventData.id), ESTADO_CODES.APROBADO);

        // Enviar mail genérico de aprobación (best-effort)
            try {
          const raw: any = (eventData as any)?.__raw ?? {};
          const to: string = String(
            (eventData as any)?.ownerEmail ||
            raw?.ownerEmail ||
            raw?.propietario?.correo ||
            (eventData as any)?.usuario?.correo ||
            ""
          ).trim();

          if (to) {
            const nombreEvento: string = String(
              (eventData as any)?.title || raw?.nombre || raw?.dsNombre || raw?.titulo || "Evento"
            ).trim();
            const titulo = `Evento aprobado: ${nombreEvento}`;
            const cuerpo = `<p>El evento puede tardar algunos minutos en aparecer en RaveApp.</p>`;
            const botonUrl = `https://raveapp.com.ar/evento/${String(eventData.id)}`;
            const botonTexto = "Ver evento";
            await sendGenericEmail({ to, titulo, cuerpo, botonUrl, botonTexto });
          }
        } catch (mailErr) {
          console.warn("[ValidateEvent] Error enviando mail de aprobación:", (mailErr as any)?.message || mailErr);
        }

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
    if (!eventData?.id) return;
    if (!rejectReason.trim()) {
      Alert.alert("Falta el motivo", "Por favor, escribí el motivo del rechazo.");
      return;
    }
    handleRejectConfirmed();
  };

  const handleRejectConfirmed = () => {
    if (!eventData?.id) return;
    const prev = eventData; // capture previous state for rollback
    (async () => {
      try {
        setLoading(true);
        // optimistic update: marcar localmente como RECHAZADO (cdEstado y estado)
        setEventData(prevData => prevData ? { ...prevData, cdEstado: ESTADO_CODES.RECHAZADO, estado: ESTADO_CODES.RECHAZADO } : prevData);

        // 1) Cambiar estado en backend
        await setEventStatus(String(eventData.id), ESTADO_CODES.RECHAZADO, { motivoRechazo: rejectReason.trim() });

        // 2) Enviar mail al propietario (best-effort)
        try {
          // Intentar resolver email y nombre de evento desde eventData y su raw
          const raw: any = (eventData as any)?.__raw ?? {};
          const to: string = String(
            (eventData as any)?.ownerEmail ||
            raw?.ownerEmail ||
            raw?.propietario?.correo ||
            (eventData as any)?.usuario?.correo ||
            ""
          ).trim();

          if (to) {
            const nombreEvento: string = String(
              (eventData as any)?.title || raw?.nombre || raw?.dsNombre || raw?.titulo || "Evento"
            ).trim();
            const motivo = String(rejectReason || "").trim();
            const titulo = `Evento rechazado: ${nombreEvento}`;
            const cuerpo = `<p><strong>Motivo de rechazo:</strong> ${motivo.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
            await sendGenericEmail({ to, titulo, cuerpo });
          }
        } catch (mailErr) {
          console.warn("[ValidateEvent] Error enviando mail de rechazo:", (mailErr as any)?.message || mailErr);
          // No interrumpimos el flujo de rechazo si el mail falla
        }

        Alert.alert("Evento rechazado", "El evento fue marcado como rechazado.");
        // navegar a listado
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

  const openMaps = (query: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => {});
  };

  // Detectar localmente artistas inactivos para bloquear validación
  const _artistsSplit = splitArtistsByActive((eventData as any)?.artistas || []);
  const hasInactiveArtists = Array.isArray(_artistsSplit.inactive) && _artistsSplit.inactive.length > 0;
  const inactiveNamesText = (_artistsSplit.inactive || []).slice(0, 5).join(', ');

  // Render principal: resumen, multimedia y acciones
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Título */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>{eventData.title}</Text>
          </View>

          {/* Hero imagen clickable */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => setHeroOpen(true)}>
            <HeroImagen imageUrl={eventData.imageUrl} />
          </TouchableOpacity>

          {/* Título debajo de la imagen */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>{eventData.title}</Text>
          </View>

          {/* Flags + Géneros (debajo de la imagen) */}
          <View style={styles.pillsBlock}>
            <View style={styles.flagsRow}>
              {(() => {
                const flags = getEventFlags(eventData);
                const items: Array<{ key: string; label: string }> = [];
                if (flags.isLGBT) items.push({ key: 'lgbt', label: 'LGTB' });
                if (flags.isAfter) items.push({ key: 'after', label: 'AFTER' });
                return items.map((f) => (
                  <View key={f.key} style={styles.darkChip}>
                    <Text style={styles.darkChipText}>{f.label}</Text>
                  </View>
                ));
              })()}
            </View>
            <Text style={styles.sectionLabel}>Géneros</Text>
            <View style={styles.genresRow}>
              {getGenresText(eventData)
                .split(',')
                .filter((g) => g.trim().length > 0)
                .map((g, i) => (
                  <View key={`genre-below-${i}`} style={styles.genreChip}>
                    <Text style={styles.genreChipText}>{g.trim()}</Text>
                  </View>
                ))}
            </View>
          </View>

          {/* Propietario */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Propietario</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
              {ownerAvatarUrl ? (
                <Image source={{ uri: ownerAvatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: COLORS.borderInput }]} />
              )}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.ownerName}>{ownerName}</Text>
                {!!creatorEmail && <Text style={styles.ownerEmail}>{creatorEmail}</Text>}
              </View>
            </View>
          </View>

          {/* Fecha y Horario */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fecha y Horario</Text>
            <View style={{ marginTop: 10, gap: 10 }}>
              {Array.isArray((eventData as any).fechas) && (eventData as any).fechas.length > 0 ? (
                (eventData as any).fechas.map((f: any, idx: number) => (
                  <View key={`fh-${String(f.idFecha || idx)}`} style={styles.miniCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MCIcon name="calendar" size={18} color={COLORS.textSecondary} />
                      <Text style={[styles.miniCardTitle, { marginLeft: 8 }]}>{formatFechaTitulo(f.inicio, true)}</Text>
                    </View>
                    <Text style={styles.miniCardSubtitle}>{formatHorasRango(f.inicio, f.fin)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.infoTextMuted}>Sin fechas asignadas</Text>
              )}
            </View>
          </View>

          {/* Descripción */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>{(eventData.description || '').trim() ? eventData.description : 'Sin descripción'}</Text>
          </View>

          {/* Dirección */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dirección</Text>
            {(() => {
              // Mostrar sólo nombre de la dirección y la localidad (pedido usuario)
              const d = (eventData as any).domicilio || {};
              const direccion = pickName(d.direccion) || 'Dirección no especificada';
              const localidad = pickName(d.localidad);
              const query = [direccion, localidad].filter(Boolean).join(', ');
              return (
                <View style={{ marginTop: 10 }}>
                  <View style={styles.miniCard}>
                    <Text style={styles.miniCardTitle}>{direccion}</Text>
                    {!!localidad && <Text style={styles.miniCardSubtitle}>{localidad}</Text>}
                  </View>
                  {!!query && (
                    <TouchableOpacity style={styles.goBtn} onPress={() => openMaps(query)}>
                      <MCIcon name="map-marker" color="#fff" size={16} />
                      <Text style={styles.goBtnText}>Cómo llegar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}
          </View>

          {/* Artistas (cards con activar) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Artistas</Text>
            <View style={{ marginTop: 8 }}>
              {(() => {
                const list = ((eventData as any).artistas || []) as any[];
                if (!Array.isArray(list) || list.length === 0) return <Text style={styles.infoTextMuted}>Sin artistas</Text>;
                return list.map((a: any, i: number) => {
                  const name = a?.nombre || a?.name || a?.dsNombre || a?.titulo || a?.tituloArtist || a?.artistName || `Artista ${i+1}`;
                  const activeFlag = (() => {
                    const v = a?.isActivo ?? a?.activo ?? a?.isActive ?? a?.estaActivo ?? a?.enabled ?? null;
                    if (typeof v === 'boolean') return v;
                    if (typeof v === 'number') return v === 1;
                    const st = a?.estado ?? a?.cdEstado ?? a?.status;
                    if (typeof st === 'number') return st === 1;
                    if (typeof st === 'string') return ['1','aprobado','activo','true'].includes(st.toLowerCase());
                    return true;
                  })();
                  const img = a?.image || a?.imagen || a?.media?.[0]?.url || null;
                  return (
                    <View key={`artist-card-${i}`} style={styles.artistCard}>
                      <View style={styles.artistLeft}>
                        {(() => {
                          const idA = a?.idArtista || a?.id || a?.artistId;
                          const resolved = ensureAbs(artistImages[String(idA)] || img);
                          return resolved ? (
                            <Image source={{ uri: resolved }} style={styles.artistAvatar} />
                          ) : (
                            <View style={[styles.artistAvatar, styles.artistAvatarPlaceholder]} />
                          );
                        })()}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.artistName}>{name}</Text>
                          <Text style={[styles.artistStatus, { color: activeFlag ? COLORS.positive : COLORS.textSecondary }]}>{activeFlag ? 'Activo' : 'Inactivo'}</Text>
                        </View>
                      </View>
                      {!activeFlag && (
                        <TouchableOpacity
                          style={styles.activateBtn}
                          onPress={() => {
                            try {
                              const idA = a?.idArtista || a?.id || a?.artistId;
                              if (!idA) { Alert.alert('Error', 'ID de artista faltante'); return; }
                              // Navegar a la pantalla de edición/activación con prefill y flag de activación
                              nav.push(router, {
                                pathname: ROUTES.ADMIN.ARTISTS.EDIT,
                                params: { id: String(idA), activate: '1', prefillName: String(name || '') },
                              });
                            } catch (e:any) {
                              Alert.alert('Error', e?.message || 'No se pudo abrir la edición del artista');
                            }
                          }}
                        >
                          <Text style={styles.activateBtnText}>Activar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                });
              })()}
            </View>
          </View>

          {/* Información de Entradas */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Información de Entradas</Text>
            {entradasLoading ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : Array.isArray((eventData as any).fechas) && (eventData as any).fechas.length ? (
              (eventData as any).fechas.map((f: any, idx: number) => {
                const idF = String(f.idFecha || "");
                const arr = entradasByFecha[idF] || [];
                return (
                  <View key={`entr-${idF || idx}`} style={{ marginTop: idx === 0 ? 6 : 14 }}>
                    <Text style={styles.entryDateTitle}>{formatFechaTitulo(f.inicio, false)}</Text>
                    {(() => {
                      // Mostrar inicio/fin de venta como items visualmente iguales a entradas
                      const starts: Date[] = [];
                      const ends: Date[] = [];
                      for (const it of arr) {
                        const s = (it as any)?.fecha?.inicioVenta;
                        const e = (it as any)?.fecha?.finVenta;
                        if (s) { const d = new Date(s); if (!isNaN(d as any)) starts.push(d); }
                        if (e) { const d = new Date(e); if (!isNaN(d as any)) ends.push(d); }
                      }
                      const startIso = starts.length ? new Date(Math.min(...starts.map(d=>d.getTime()))).toISOString() : undefined;
                      const endIso = ends.length ? new Date(Math.max(...ends.map(d=>d.getTime()))).toISOString() : undefined;

                      const blocks: React.ReactNode[] = [];
                      if (startIso) {
                        blocks.push(
                          <View key={`venta-start-${idF}`} style={styles.entryItem}>
                            <Text style={styles.entryTipo}>Inicio de venta de entradas</Text>
                            <Text style={styles.entryPrice}>{formatFechaHoraAR(startIso)}</Text>
                          </View>
                        );
                      }
                      if (endIso) {
                        blocks.push(
                          <View key={`venta-end-${idF}`} style={styles.entryItem}>
                            <Text style={styles.entryTipo}>Fin venta de entradas</Text>
                            <Text style={styles.entryPrice}>{formatFechaHoraAR(endIso)}</Text>
                          </View>
                        );
                      }
                      return blocks.length ? <View style={{ marginTop: 6 }}>{blocks}</View> : null;
                    })()}
                    {/* Separador visual entre ventana de venta y lista de tipos */}
                    {arr.length ? <View style={styles.divider} /> : null}
                    {arr.length ? (
                      arr.map((it: any, j: number) => {
                        // Resolver nombre de tipo (usa objeto tipo { cdTipo, dsTipo } si viene)
                        const cdTipo = Number(it?.tipo?.cdTipo ?? it?.cdTipo ?? it?.tipoEntrada ?? it?.tipo);
                        const nombreTipo = (it?.tipo?.dsTipo && String(it.tipo.dsTipo).trim())
                          || (Number.isFinite(cdTipo) && tipoMap.get(cdTipo))
                          || (Number.isFinite(cdTipo) ? `Tipo ${cdTipo}` : 'Sin tipo');
                        const qty = toNumber(it?.cantidad ?? it?.stock ?? it?.disponible ?? it?.cantidadDisponible);
                        const price = Number(it?.precio);
                        return (
                          <View key={`e-${j}`} style={styles.entryItem}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.entryTipo}>{nombreTipo}</Text>
                              {qty ? <Text style={styles.entryQty}>{`Cantidad: ${qty}`}</Text> : null}
                            </View>
                            <Text style={styles.entryPrice}>{formatMoneyARS(price)}</Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.infoTextMuted}>Sin entradas cargadas para este día</Text>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.infoTextMuted}>Este evento no tiene fechas para mostrar entradas.</Text>
            )}
          </View>

          {/* Multimedia (solo si hay algo) */}
          {((eventData as any).musica || (eventData as any).video) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contenido Multimedia</Text>
              <View style={{ marginTop: 10 }}>
                {(eventData as any).musica && (
                  <View style={styles.mediaBox}>
                    <ReproductorSoundCloud soundCloudUrl={(eventData as any).musica || ''} />
                  </View>
                )}
                {(eventData as any).video && (
                  <View style={styles.mediaBox}>
                    <ReproductorYouTube youTubeEmbedUrl={(eventData as any).video || ''} />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Sección validación / rechazo */}
          <View style={styles.validationBlock}>
            <Text style={styles.validationInfo}>En caso de rechazar el evento, completar el motivo de rechazo:</Text>
            <TextInput
              placeholder="Escribir motivo del rechazo..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              style={styles.rejectInput}
              placeholderTextColor={COLORS.textSecondary}
            />
            {/* Aviso si hay artistas inactivos */}
            {hasInactiveArtists ? (
              <Text style={styles.validationInfoWarning}>{`Para validar el evento, activá todos los artistas.${inactiveNamesText ? ` Artistas inactivos: ${inactiveNamesText}` : ''}`}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.primaryBtn, hasInactiveArtists && styles.primaryBtnDisabled]}
              onPress={hasInactiveArtists ? undefined : handleValidate}
              disabled={Boolean(hasInactiveArtists)}
            >
              <Text style={styles.primaryBtnText}>Validar Evento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.outlineBtn]} onPress={handleReject}>
              <Text style={styles.outlineBtnText}>Rechazar Evento</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
        <Footer />

        {/* Modal Imagen */}
        <Modal visible={heroOpen} transparent onRequestClose={() => setHeroOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setHeroOpen(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {eventData?.imageUrl ? (
              <Image source={{ uri: eventData.imageUrl }} resizeMode="contain" style={styles.fullImage} />
            ) : null}
          </View>
        </Modal>

        {/* Modal rechazo eliminado (usamos sección inline) */}
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.negative },
  scrollContent: { paddingBottom: 56 },
  headerBlock: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.titleMain, color: COLORS.textPrimary },
  pillsBlock: { paddingHorizontal: 16, paddingTop: 10 },
  flagsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  darkChip: { backgroundColor: '#0F172A', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  darkChipText: { color: '#fff', fontSize: 12, fontFamily: FONTS.subTitleMedium },
  sectionLabel: { color: COLORS.textSecondary, marginBottom: 8 },
  genresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreChip: { backgroundColor: '#fff', borderColor: COLORS.borderInput, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  genreChipText: { color: COLORS.textPrimary, fontSize: 12 },
  card: { backgroundColor: COLORS.cardBg, marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: COLORS.borderInput },
  cardTitle: { fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.subTitle, color: COLORS.textPrimary },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  ownerName: { fontFamily: FONTS.subTitleMedium, color: COLORS.textPrimary },
  ownerEmail: { color: COLORS.textSecondary, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  infoText: { color: COLORS.textPrimary },
  infoTextMuted: { color: COLORS.textSecondary, marginTop: 6 },
  descriptionText: { color: COLORS.textPrimary, marginTop: 10 },
  fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  badgeText: { color: '#fff', fontSize: 12 },
  badgeGroupTitle: { color: COLORS.textSecondary, fontSize: 12 },
  /* Entradas (Total) */
  entryDateTitle: { color: COLORS.textPrimary, marginBottom: 8 },
  entryItem: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.borderInput, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  entryTipo: { color: COLORS.textPrimary, fontFamily: FONTS.subTitleMedium },
  entryQty: { color: COLORS.textSecondary },
  entryPrice: { color: COLORS.textPrimary, fontFamily: FONTS.subTitleMedium },
  divider: { height: 1, backgroundColor: COLORS.borderInput, marginVertical: 6, opacity: 0.6 },
  actionsBar: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 8, paddingHorizontal: 16 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontFamily: FONTS.subTitleMedium },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '90%', height: '70%' },
  modalClose: { position: 'absolute', top: 40, right: 20, padding: 8 },
  rejectCard: { width: '90%', backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: COLORS.borderInput },
  rejectTitle: { fontFamily: FONTS.subTitleMedium, fontSize: FONT_SIZES.subTitle, color: COLORS.textPrimary, marginBottom: 10 },
  rejectActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rejectBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  rejectText: { color: '#fff' },
  /* Artists */
  artistCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.borderInput, marginBottom: 10 },
  artistLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  artistAvatar: { width: 46, height: 46, borderRadius: 8, backgroundColor: '#eee' },
  artistAvatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  artistName: { fontFamily: FONTS.subTitleMedium, color: COLORS.textPrimary, fontSize: 14 },
  artistStatus: { fontSize: 12, marginTop: 2 },
  activateBtn: { backgroundColor: '#0F172A', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  activateBtnText: { color: '#fff', fontSize: 12, fontFamily: FONTS.subTitleMedium },
  /* Media */
  mediaBox: { backgroundColor: '#ECEEF2', borderRadius: 12, padding: 16, marginBottom: 14 },
  /* Mini Cards (fecha/ubicación) */
  miniCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.borderInput, borderRadius: 12, padding: 12 },
  miniCardTitle: { color: COLORS.textPrimary, fontFamily: FONTS.subTitleMedium },
  miniCardSubtitle: { color: COLORS.textSecondary, marginTop: 4 },
  goBtn: { marginTop: 10, backgroundColor: '#0F172A', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  goBtnText: { color: '#fff', fontFamily: FONTS.subTitleMedium },
  /* Validation Block */
  validationBlock: { marginHorizontal: 16, marginTop: 20, marginBottom: 40 },
  validationInfo: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 },
  rejectInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.borderInput, borderRadius: 12, minHeight: 120, padding: 12, textAlignVertical: 'top', color: COLORS.textPrimary, marginBottom: 16 },
  primaryBtn: { backgroundColor: '#0F172A', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontFamily: FONTS.subTitleMedium },
  primaryBtnDisabled: { backgroundColor: '#9ca3af' },
  outlineBtn: { backgroundColor: 'transparent', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#0F172A' },
  outlineBtnText: { color: '#0F172A', fontFamily: FONTS.subTitleMedium },
  validationInfoWarning: { color: COLORS.negative, fontSize: 12, marginBottom: 8 },
});

// Helpers locales
function isFiniteNum(n: any): n is number {
  return typeof n === 'number' && isFinite(n);
}

function formatFechaRango(inicio?: string, fin?: string): string {
  const fmt = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const dd = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${dd} ${hh}:${mm}`;
  };
  const a = fmt(inicio);
  const b = fmt(fin);
  if (a && b) return `${a} — ${b}`;
  return a || b || 'Sin horario';
}

// Nuevo: formato de título de fecha ("Viernes 15 de Marzo, 2025")
function formatFechaTitulo(iso?: string, includeYear: boolean = true): string {
  if (!iso) return 'Fecha';
  const d = new Date(iso);
  const diaSemana = d.toLocaleDateString('es-AR', { weekday: 'long' });
  const dia = d.getDate();
  const mes = d.toLocaleDateString('es-AR', { month: 'long' });
  const año = d.getFullYear();
  const base = `${capitalize(diaSemana)} ${dia} de ${capitalize(mes)}`;
  return includeYear ? `${base}, ${año}` : base;
}

// Nuevo: rango de horas ("23:00 - 06:00")
function formatHorasRango(inicio?: string, fin?: string): string {
  const fmt = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };
  const a = fmt(inicio);
  const b = fmt(fin);
  if (a && b) return `${a} - ${b}`;
  return a || b || 'Sin horario';
}

function toNumber(v: any): number {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

// Formatea número a moneda ARS simple (sin locales costosos en RN)
function formatMoneyARS(v: number): string {
  if (!Number.isFinite(v)) return '$0';
  // Mostrar sin decimales si es entero, sino con 2 decimales
  const opts = Number.isInteger(v) ? 0 : 2;
  return '$' + v.toFixed(opts).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Fecha y hora corta en formato d/m/aaaa - hh:mm a. m./p. m.
function formatFechaHoraAR(iso?: string): string {
  if (!iso) return 'N/D';
  const d = new Date(iso);
  if (isNaN(d as any)) return 'N/D';
  const dia = String(d.getDate()).padStart(1, '0');
  const mes = String(d.getMonth() + 1);
  const año = d.getFullYear();
  let horas = d.getHours();
  const minutos = String(d.getMinutes()).padStart(2, '0');
  const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
  if (horas === 0) horas = 12; else if (horas > 12) horas -= 12;
  const hh = String(horas).padStart(2, '0');
  return `${dia}/${mes}/${año} - ${hh}:${minutos} ${ampm}`;
}

// Normaliza valores que pueden venir como string u objeto { nombre, codigo }
function pickName(val: any): string {
  if (!val) return "";
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const n = (val as any).nombre || (val as any).name || (val as any).dsNombre || (val as any).descripcion;
    if (typeof n === 'string') return n;
  }
  try { return String(val); } catch { return ""; }
}
