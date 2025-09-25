// app/main/EventsScreens/EventScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { IconButton } from "react-native-paper";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ROUTES } from "../../../routes";
import * as nav from "@/utils/navigation";
import { Linking } from "react-native";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ReviewComponent from "@/components/events/ReviewComponent";
import TicketSelector from "@/components/tickets/TicketSelector";

import { fetchEvents, getEventFlags } from "@/utils/events/eventApi";
import { ReviewItem } from "@/interfaces/ReviewProps";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

import { useAuth } from "@/context/AuthContext";
import {
  getEventosFavoritos,
  putEventoFavorito,
} from "@/utils/auth/userHelpers";

// Traemos directamente el raw de la API por fecha (fetchEntradasFechaRaw)
// y resolvemos tipos/estados con los helpers del módulo de entradas.
import {
  fetchEntradasFechaRaw,
  fetchTiposEntrada,
  getTipoMap,
  getEstadoMap,
  UiEntrada,
  } from "@/utils/events/entradaApi";
  import { EventItemWithExtras } from "@/utils/events/eventApi";
import { ESTADO_CODES } from "@/utils/events/eventApi";

type FechaLite = { idFecha: string; inicio: string; fin: string };

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  // Usar el contexto de autenticación centralizado. Esto expone helpers como
  // `isAuthenticated`, `hasRole`, `hasAnyRole` para chequear permisos.
  const { user, isAuthenticated, hasRole } = useAuth();

  // Normalizamos userId localmente: preferimos `id` y si no existe usamos `idUsuario`.
  const userId: string | null = (user as any)?.id ?? (user as any)?.idUsuario ?? null;

  const [eventData, setEventData] = useState<EventItemWithExtras | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const [fechas, setFechas] = useState<FechaLite[]>([]);
  const [entradasPorFecha, setEntradasPorFecha] = useState<Record<string, UiEntrada[]>>({});
  const [loadingEntradas, setLoadingEntradas] = useState(false);

  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [showArtistsModal, setShowArtistsModal] = useState(false);

  const mockReviews: ReviewItem[] = [
    {
      id: 1,
      user: "Usuario99",
      comment: "Me gustó mucho la fiesta.",
      rating: 5,
      daysAgo: 6,
    },
    {
      id: 2,
      user: "Usuario27",
      comment: "Buena organización, pero faltó variedad.",
      rating: 4,
      daysAgo: 6,
    },
  ];

  // --- helpers YouTube ---
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be"))
        return u.pathname.replace("/", "") || null;
      if (u.hostname.includes("youtube.com")) {
        if (u.pathname.startsWith("/watch")) return u.searchParams.get("v");
        if (u.pathname.startsWith("/embed/"))
          return u.pathname.split("/embed/")[1] || null;
        if (u.pathname.startsWith("/shorts/"))
          return u.pathname.split("/shorts/")[1] || null;
      }
    } catch {}
    return null;
  };
  const findYouTubeUrl = (ev: any): string | null => {
    if (!ev) return null;
    if (Array.isArray(ev.media)) {
      const item = ev.media.find(
        (m: any) =>
          (typeof m?.mdVideo === "string" && /youtu\.?be/.test(m.mdVideo)) ||
          (typeof m?.url === "string" && /youtu\.?be/.test(m.url))
      );
      if (item?.mdVideo && /youtu\.?be/.test(item.mdVideo)) return item.mdVideo;
      if (item?.url && /youtu\.?be/.test(item.url)) return item.url;
    }
    return null;
  };

  // 1) Cargar evento + favorito
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) {
          setLoading(false);
          return;
        }
        setLoading(true);

        const all = await fetchEvents();
        const found = all.find((e) => String(e.id) === String(id));
        if (found && mounted) {
          setEventData(found);
          setFechas(found.fechas || []);

          if (userId) {
            try {
              const favIds = await getEventosFavoritos(String(userId));
              setIsFavorite(favIds.map(String).includes(String(found.id)));
            } catch {}
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, userId]);

  // 2) Cargar tipos y entradas por cada fecha (y mergear nombres)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!fechas.length) return;
      setLoadingEntradas(true);
      try {
        // Aseguramos caches de tipos y estados
        await fetchTiposEntrada();
        const tipoMap = await getTipoMap();

        // Intentamos también traer mapa de estados (por si queremos mostrar estado de la entrada)
        // Nota: getEstadoMap es opcional si no necesitamos labels ahora
        // const estadoMap = await getEstadoMap().catch(() => new Map());

        const results = await Promise.all(
          fechas.map(async (f): Promise<[string, UiEntrada[]]> => {
            // Traemos raw para conservar idEntrada, cantidad, tipo.dsTipo, etc.
            const raw = await fetchEntradasFechaRaw(f.idFecha).catch(() => []);

            // Si la fecha no está en EN_VENTA, no devolvemos entradas para esa fecha
            const fechaEstado = raw?.[0]?.fecha?.estado ?? null;
            if (fechaEstado !== ESTADO_CODES.EN_VENTA) {
              return [f.idFecha, [] as UiEntrada[]];
            }

            const merged: UiEntrada[] = (raw || []).map((r: any, idx: number) => {
              const tipoObj = r.tipo ?? null;
              const fechaObj = r.fecha ?? null;

              const cdTipo = Number(tipoObj?.cdTipo ?? 0);
              const nombreTipo =
                tipoMap.get(cdTipo) ?? tipoObj?.dsTipo ?? String(cdTipo);

              const cantidad =
                typeof r.cantidad === "number" ? Number(r.cantidad) : undefined;

              const maxPorUsuario =
                typeof r.maxPorUsuario === "number" ? r.maxPorUsuario : undefined;

              // asegurar idEntrada único: si backend no provee id, generamos uno con índice
              const idEntradaRaw = r.idEntrada ?? null;
              const idEntrada = String(
                idEntradaRaw ?? `gen-${f.idFecha}-${cdTipo}-${idx}`
              );

              return {
                idEntrada,
                idFecha: String(fechaObj?.idFecha ?? f.idFecha),
                cdTipo,
                precio: Number(r.precio ?? 0),
                stock: cantidad,
                maxPorUsuario,
                nombreTipo,
                // maxCompra: preferir maxPorUsuario, sino stock, sino 10
                maxCompra:
                  typeof maxPorUsuario === "number"
                    ? maxPorUsuario
                    : typeof cantidad === "number"
                    ? cantidad
                    : 10,
              } as UiEntrada;
            });

            return [f.idFecha, merged];
          })
        );

        if (mounted) {
          const dict: Record<string, UiEntrada[]> = {};
          results.forEach(([idFecha, arr]) => {
            dict[idFecha] = arr;
          });
          setEntradasPorFecha(dict);
        }
      } catch (e) {
        console.warn("[EventScreen] Error cargando entradas", e);
        if (mounted) setEntradasPorFecha({});
      } finally {
        if (mounted) setLoadingEntradas(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fechas]);

  const youTubeEmbedUrl = useMemo(() => {
    if (!eventData) return null;
    const url = findYouTubeUrl(eventData);
    const vid = url ? extractYouTubeId(url) : null;
    return vid ? `https://www.youtube.com/embed/${vid}` : null;
  }, [eventData]);

  // Favorito
  const toggleFavorite = async () => {
    if (!eventData?.id) return;
    if (!userId) {
      Alert.alert(
        "Iniciá sesión",
        "Necesitás estar logueado para marcar favoritos."
      );
      return;
    }
    const prev = isFavorite;
    setIsFavorite(!prev);
    setFavBusy(true);
    try {
      await putEventoFavorito({
        idUsuario: String(userId),
        idEvento: String(eventData.id),
      });
    } catch {
      setIsFavorite(prev);
      Alert.alert(
        "Error",
        "No se pudo actualizar el favorito. Probá de nuevo."
      );
    } finally {
      setFavBusy(false);
    }
  };

  // Selección y subtotal
  const updateTicketCount = (key: string, delta: number) => {
    setSelectedTickets((prev) => {
      const next = (prev[key] || 0) + delta;
      if (next < 0) return prev;
      return { ...prev, [key]: next };
    });
  };

  const subtotal = useMemo(() => {
    let sum = 0;
    Object.entries(entradasPorFecha).forEach(([idFecha, arr]) => {
      arr.forEach((ent) => {
        const entryKey = `entrada-${ent.idEntrada}`;
        const qty = selectedTickets[entryKey] || 0;
        sum += qty * (ent.precio || 0);
      });
    });
    return sum;
  }, [entradasPorFecha, selectedTickets]);

  const noEntradasAvailable = useMemo(() => {
    if (loadingEntradas) return false;
    if (!fechas || fechas.length === 0) return true;
    const hasAny = Object.values(entradasPorFecha).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );
    return !hasAny;
  }, [loadingEntradas, fechas, entradasPorFecha]);

  const handleBuyPress = () => {
    if (!eventData) return;
    const sel = encodeURIComponent(JSON.stringify(selectedTickets));
    nav.push(router, { pathname: ROUTES.MAIN.TICKETS.BUY, params: { id: eventData.id, selection: sel } });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderWrapper}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }
  if (!eventData) {
    return (
      <SafeAreaView style={styles.loaderWrapper}>
        <Text style={styles.errorText}>Evento no encontrado.</Text>
      </SafeAreaView>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Título + corazón */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{eventData.title}</Text>
            <TouchableOpacity
              onPress={toggleFavorite}
              disabled={favBusy}
              style={styles.heartBtn}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isFavorite ? "heart" : "heart-outline"}
                size={28}
                color={COLORS.negative}
              />
            </TouchableOpacity>
          </View>

          {/* Imagen banner con recuadro superpuesto */}
          <View style={styles.heroImageWrapper}>
            {eventData.imageUrl && eventData.imageUrl.trim() !== "" ? (
              <Image
                source={{ uri: eventData.imageUrl }}
                style={styles.heroImage}
              />
            ) : null}
          </View>
          <View style={styles.eventInfoBlockImproved}>
            {/* Artistas principales y modal */}
            {eventData.artistas && eventData.artistas.length > 0 && (
              <View style={styles.artistRowImproved}>
                <MaterialCommunityIcons name="volume-high" size={24} color={COLORS.textPrimary} style={{ marginRight: 10 }} />
                <Text style={styles.artistLabelImproved}>Artistas:</Text>
                <Text style={styles.artistNameImproved} numberOfLines={1} ellipsizeMode="tail">
                  {eventData.artistas.slice(0,2).map((a: any) => a.nombre).join(", ")}
                  {eventData.artistas.length > 2 ? <Text>...</Text> : null}
                </Text>
                {eventData.artistas.length > 2 && (
                  <TouchableOpacity style={styles.seeAllArtistsBtn} onPress={() => setShowArtistsModal(true)}>
                    <MaterialCommunityIcons name="plus-circle" size={28} color="#2196F3" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {/* Modal de artistas */}
            {showArtistsModal && (
              <View style={styles.artistsModalOverlay}>
                <View style={styles.artistsModalContent}>
                  <Text style={styles.artistsModalTitle}>Artistas</Text>
                  <ScrollView style={{ maxHeight: 260 }}>
                    {(eventData.artistas ?? []).map((a: any, idx: number) => (
                      <View key={idx} style={styles.artistsModalItem}>
                        <MaterialCommunityIcons name="account-music" size={18} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
                        {typeof a.nombre === "string" ? (
                          <Text style={styles.artistsModalName}>{a.nombre}</Text>
                        ) : null}
                      </View>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.artistsModalCloseBtn} onPress={() => setShowArtistsModal(false)}>
                    <Text style={styles.artistsModalCloseText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.dataRowImproved}>
              <MaterialCommunityIcons name="calendar-month" size={20} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.dataLabelImproved}>Fecha:</Text>
              <Text style={styles.dataValueImproved}>{eventData.date}</Text>
            </View>
            <View style={styles.dataRowImproved}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.dataLabelImproved}>Horario:</Text>
              <Text style={styles.dataValueImproved}>{eventData.timeRange}</Text>
            </View>
            <View style={styles.dataRowImproved}>
              <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.info} style={{ marginRight: 8 }} />
              <Text style={styles.dataValueImproved}>{eventData.address}</Text>
              <TouchableOpacity
                style={styles.arrivalBtnImproved}
                activeOpacity={0.8}
                onPress={() => {
                  const query = encodeURIComponent(eventData.address || "");
                  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                  Linking.openURL(url);
                }}
              >
                <Text style={styles.arrivalBtnTextImproved}>CÓMO LLEGAR</Text>
              </TouchableOpacity>
            </View>

            {/* Etiquetas LGBT y AFTER usando getEventFlags */}
            {eventData && (getEventFlags(eventData).isLGBT || getEventFlags(eventData).isAfter) && (
              <View style={styles.tagsRowImproved}>
                {getEventFlags(eventData).isLGBT ? (
                  <View style={styles.tagItemImproved}>
                    <MaterialCommunityIcons name="rainbow" size={16} color="#E040FB" style={{ marginRight: 2 }} />
                    <Text style={styles.tagTextImproved}>LGBT</Text>
                  </View>
                ) : null}
                {getEventFlags(eventData).isAfter ? (
                  <View style={styles.tagItemImproved}>
                    <MaterialCommunityIcons name="party-popper" size={16} color="#FF4081" style={{ marginRight: 2 }} />
                    <Text style={styles.tagTextImproved}>AFTER</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* ...existing code... */}

          {/* Video YouTube */}
          {youTubeEmbedUrl && (
            <View style={styles.videoSection}>
              <Text style={styles.sectionTitle}>Video</Text>
              <View style={styles.videoWrapper}>
                <WebView
                  source={{ uri: youTubeEmbedUrl }}
                  allowsFullscreenVideo
                  javaScriptEnabled
                  domStorageEnabled
                  style={styles.webview}
                />
              </View>
            </View>
          )}

          {/* Descripción */}
          <Text style={styles.description}>{eventData.description}</Text>

          {/* Entradas */}
          <View style={styles.ticketSection}>
            <Text style={styles.sectionTitle}>Selecciona tus entradas</Text>

            {loadingEntradas && (
              <View style={{ paddingVertical: 8 }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            )}

            {!loadingEntradas && noEntradasAvailable ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Text style={{ color: COLORS.textSecondary }}>Entradas no disponibles.</Text>
              </View>
            ) : (
              !loadingEntradas &&
              fechas.map((f, idx) => {
                const entradas = entradasPorFecha[f.idFecha] || [];
                return (
                  <View key={f.idFecha} style={styles.dayBlock}>
                    <Text style={styles.dayLabel}>
                      {fechas.length > 1
                        ? `Día ${idx + 1} de ${fechas.length}`
                        : "Día único"}
                    </Text>

                    {entradas.length === 0 ? (
                      <Text style={{ color: COLORS.textSecondary }}>
                        No hay entradas para esta fecha.
                      </Text>
                    ) : (
                      entradas.map((ent) => {
                        const entryKey = `entrada-${ent.idEntrada}`;
                        return (
                          <TicketSelector
                            key={entryKey}
                            label={`${ent.nombreTipo} ($${ent.precio})`}
                            maxQty={ent.maxCompra}
                            currentQty={selectedTickets[entryKey] || 0}
                            onChange={(d) => updateTicketCount(entryKey, d)}
                          />
                        );
                      })
                    )}
                  </View>
                );
              })
            )}

            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalText}>Subtotal: ${subtotal}</Text>
              <TouchableOpacity
                style={[
                  styles.buyButton,
                  (noEntradasAvailable || subtotal <= 0) && styles.buyButtonDisabled,
                ]}
                onPress={handleBuyPress}
                disabled={noEntradasAvailable || subtotal <= 0}
              >
                <Text style={styles.buyButtonText}>Comprar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reseñas (si se requiere mostrar, agregar lógica aquí) */}
          {/* Ejemplo: <View style={styles.reviewSection}><Text style={styles.sectionTitle}>Reseñas</Text><ReviewComponent reviews={mockReviews} /></View> */}
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const HERO_RATIO = 16 / 9;

const styles = StyleSheet.create({
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  artistLabel: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
  artistName: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginLeft: 2,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  dateLabel: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
  dateValue: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginLeft: 2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  timeLabel: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
  timeValue: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginLeft: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  locationValue: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.info,
    marginRight: 8,
    maxWidth: "60%",
  },
  arrivalBtn: {
    backgroundColor: COLORS.info,
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginLeft: 8,
    alignSelf: "center",
  },
  arrivalBtnText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.info,
  },
  tagText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.info,
    fontWeight: "bold",
  },
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loaderWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 32 },

  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
    marginRight: 8,
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textDecorationLine: "underline",
  },

  heartBtn: {},

  heroImageWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: HERO_RATIO,
    marginBottom: 18,
  },
  eventInfoBlockImproved: {
    backgroundColor: "rgba(245,248,255,0.96)", // azul claro moderno
    borderRadius: RADIUS.card,
    paddingVertical: 38,
    paddingHorizontal: 24,
    marginHorizontal: 12,
    marginTop: 0,
    marginBottom: 24,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    minHeight: 180,
    maxHeight: 400,
    overflow: "visible",
    justifyContent: "center",
  },
  seeAllArtistsBtn: {
    marginLeft: 8,
    backgroundColor: "#2196F3",
    borderRadius: 14,
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignSelf: "center",
  },
  seeAllArtistsText: {
    color: "#fff",
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
  },
  artistsModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  artistsModalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    minWidth: 260,
    maxWidth: 340,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center",
  },
  artistsModalTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    fontWeight: "bold",
    marginBottom: 12,
  },
  artistsModalItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  artistsModalName: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  artistsModalCloseBtn: {
    marginTop: 16,
    backgroundColor: COLORS.negative,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  artistsModalCloseText: {
    color: "#fff",
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
  },
  artistRowImproved: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    maxWidth: "100%",
  },
  artistLabelImproved: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: "bold",
    marginRight: 2,
  },
  artistNameImproved: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  dataRowImproved: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  dataLabelImproved: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle + 2,
    color: COLORS.textPrimary,
    fontWeight: "bold",
    marginRight: 6,
  },
  dataValueImproved: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.subTitle + 2,
    color: COLORS.textPrimary,
    marginRight: 10,
  },
  arrivalBtnImproved: {
    backgroundColor: "#2196F3", // azul moderno
    borderRadius: 22,
    paddingVertical: 7,
    paddingHorizontal: 22,
    marginLeft: 8,
    alignSelf: "center",
    elevation: 2,
    shadowColor: "#1976D2",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  arrivalBtnTextImproved: {
    color: "#fff",
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textShadowColor: "#1976D2",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagsRowImproved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  tagItemImproved: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.info,
  },
  tagTextImproved: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.info,
    fontWeight: "bold",
  },
  eventInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  eventInfoTextBlock: {
    flexDirection: "column",
  },
  eventDate: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  eventTime: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.info,
    letterSpacing: 0.2,
  },
  locationSimpleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.positive,
    marginTop: 2,
  },
  locationSimpleText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.info,
    textDecorationLine: "underline",
    fontWeight: "bold",
    marginRight: 2,
  },

  heroImage: {
    width: "100%",
    aspectRatio: HERO_RATIO,
    resizeMode: "cover",
  },

  videoSection: { marginTop: 16, marginBottom: 8, paddingHorizontal: 16 },
  videoWrapper: {
    overflow: "hidden",
    borderRadius: RADIUS.card,
    backgroundColor: "#000",
    aspectRatio: 16 / 9,
    width: "100%",
  },
  webview: { width: "100%", height: "100%", backgroundColor: "transparent" },

  description: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.body * 1.5,
    textAlign: "justify",
  },

  ticketSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  dayBlock: { marginBottom: 16 },
  dayLabel: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.info,
    marginBottom: 8,
  },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  subtotalText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  buyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.button,
    color: COLORS.cardBg,
  },

  reviewSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    elevation: 2,
    marginHorizontal: 16,
  },

  errorText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.negative,
  },
});
