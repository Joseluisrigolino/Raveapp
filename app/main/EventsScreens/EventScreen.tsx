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

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ReviewComponent from "@/components/events/ReviewComponent";
import TicketSelector from "@/components/tickets/TicketSelector";

import { fetchEvents } from "@/utils/events/eventApi";
import { ReviewItem } from "@/interfaces/ReviewProps";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

import { useAuth } from "@/context/AuthContext";
import {
  getEventosFavoritos,
  putEventoFavorito,
} from "@/utils/auth/userHelpers";

import {
  fetchEntradasByFecha,
  fetchTiposEntrada,
  getTipoMap,
  mergeEntradasConTipos,
  UiEntrada,
} from "@/utils/events/entradaApi";

type FechaLite = { idFecha: string; inicio: string; fin: string };

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const userId: string | null =
    (user as any)?.idUsuario ?? (user as any)?.id ?? null;

  const [eventData, setEventData] = useState<any | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const [fechas, setFechas] = useState<FechaLite[]>([]);
  const [entradasPorFecha, setEntradasPorFecha] = useState<
    Record<string, UiEntrada[]>
  >({});
  const [loadingEntradas, setLoadingEntradas] = useState(false);

  const [selectedTickets, setSelectedTickets] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);

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
        await fetchTiposEntrada();
        const tipoMap = await getTipoMap();

        const results = await Promise.all(
          fechas.map(async (f) => {
            const raw = await fetchEntradasByFecha(f.idFecha);
            const merged = mergeEntradasConTipos(raw, tipoMap, 10);
            return [f.idFecha, merged] as const;
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
        const key = `fecha-${idFecha}-tipo-${ent.cdTipo}`;
        const qty = selectedTickets[key] || 0;
        sum += qty * (ent.precio || 0);
      });
    });
    return sum;
  }, [entradasPorFecha, selectedTickets]);

  const handleBuyPress = () => {
    if (!eventData) return;
    const sel = encodeURIComponent(JSON.stringify(selectedTickets));
    router.push(
      `/main/TicketsScreens/BuyTicketScreen?id=${eventData.id}&selection=${sel}`
    );
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

          {/* Fecha/ubicación principal (del primer día) */}
          <View style={styles.infoRow}>
            <IconButton
              icon="calendar-month"
              size={20}
              iconColor={COLORS.primary}
            />
            <Text style={styles.infoText}>
              {eventData.date} • {eventData.timeRange}
            </Text>
            <IconButton
              icon="map-marker"
              size={20}
              iconColor={COLORS.primary}
            />
            <Text style={styles.infoText}>{eventData.address}</Text>
          </View>

          {/* Imagen banner */}
          <Image
            source={{ uri: eventData.imageUrl }}
            style={styles.heroImage}
          />

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

            {!loadingEntradas &&
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
                        const key = `fecha-${f.idFecha}-tipo-${ent.cdTipo}`;
                        return (
                          <TicketSelector
                            key={key}
                            label={`${ent.nombreTipo} ($${ent.precio})`}
                            maxQty={ent.maxCompra}
                            currentQty={selectedTickets[key] || 0}
                            onChange={(d) => updateTicketCount(key, d)}
                          />
                        );
                      })
                    )}
                  </View>
                );
              })}

            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalText}>Subtotal: ${subtotal}</Text>
              <TouchableOpacity
                style={styles.buyButton}
                onPress={handleBuyPress}
              >
                <Text style={styles.buyButtonText}>Comprar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reseñas si recurrente */}
          {eventData.isRecurrent && (
            <View style={styles.reviewSection}>
              <Text style={styles.sectionTitle}>Reseñas</Text>
              <ReviewComponent reviews={mockReviews} />
            </View>
          )}
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const HERO_RATIO = 16 / 9;

const styles = StyleSheet.create({
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

  infoRow: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  infoText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginHorizontal: 4,
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
