// screens/NewsScreens/NewScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import { ScrollView, View, Text, Image, StyleSheet, Linking, TouchableOpacity, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../../routes";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { NewsItem } from "@/interfaces/NewsProps";
import { getNewsById, extractEventIdFromUrl } from "@/utils/news/newsApi";
import globalStyles, { COLORS, FONT_SIZES } from "@/styles/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getSafeImageSource } from "@/utils/image";
import { fetchEventById } from "@/utils/events/eventApi";
// Autor oculto: se eliminan imports de autor
import CirculoCarga from "@/components/general/CirculoCarga";

export default function NewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [linkedEventId, setLinkedEventId] = useState<string | null>(null);
  const [relatedEventTitle, setRelatedEventTitle] = useState<string | null>(null);
  const [relatedEventImage, setRelatedEventImage] = useState<string | null>(null);
  // Autor oculto: ya no se utiliza ownerId para autor
  const [loading, setLoading] = useState(true);
  const [loadingRelatedEvent, setLoadingRelatedEvent] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function fetchNews() {
      if (!id) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const found = await getNewsById(String(id));
        if (!found) {
          if (isMounted) setLoading(false);
          return;
        }
        if (isMounted) {
          setNewsItem(found);
          // Preferimos el id ya enriquecido por newsApi; si no, extraemos acá (defensivo)
          const fromApi = (found as any).urlEventoId as string | undefined;
          const fallback = extractEventIdFromUrl((found as any).urlEvento);
          setLinkedEventId(fromApi ?? fallback ?? null);
        }
      } catch (err) {
        console.error("Error al cargar noticia:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchNews();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Fetch related event details (image + title)
  useEffect(() => {
    let active = true;
    (async () => {
      if (!linkedEventId) {
        if (active) {
          setRelatedEventTitle(null);
          setRelatedEventImage(null);
        }
        return;
      }
      if (active) setLoadingRelatedEvent(true);
      try {
        const ev = await fetchEventById(linkedEventId);
        if (active && ev) {
          setRelatedEventTitle(ev.title || null);
          setRelatedEventImage(ev.imageUrl || null);
        }
      } catch (e) {
        if (active) {
          setRelatedEventTitle(null);
          setRelatedEventImage(null);
        }
      } finally {
        if (active) setLoadingRelatedEvent(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [linkedEventId]);

  // Autor oculto: se elimina toda la lógica de autor

  // Eliminado: resolución de autor (id/nombre/avatar)

  // Prefetch de imágenes (noticia, evento relacionado, avatar autor) para que renderice todo junto
  useEffect(() => {
    let mounted = true;
    const urls = [newsItem?.imagen, relatedEventImage]
      .filter(Boolean)
      .map(String)
      // evitar duplicados exactos
      .filter((url, idx, arr) => arr.indexOf(url) === idx);

    if (urls.length === 0) {
      setLoadingImages(false);
      return;
    }

    setLoadingImages(true);

    const withTimeout = <T,>(p: Promise<T>, ms = 4000): Promise<T> => {
      return new Promise((resolve, reject) => {
        const to = setTimeout(() => reject(new Error("timeout")), ms);
        p.then((v) => { clearTimeout(to); resolve(v); })
         .catch((e) => { clearTimeout(to); reject(e); });
      });
    };

    Promise.allSettled(
      urls.map((u) => withTimeout(Image.prefetch(u)))
    ).finally(() => {
      if (mounted) setLoadingImages(false);
    });

    return () => { mounted = false; };
  }, [newsItem?.imagen, relatedEventImage]);

  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const tokens = text.split(urlRegex);
    return tokens.map((token, i) =>
      urlRegex.test(token) ? (
        <Text
          key={`url-${i}`}
          style={styles.link}
          onPress={() => Linking.openURL(token)}
        >
          {token}
        </Text>
      ) : (
        <Text key={`txt-${i}`} style={styles.descriptionTextChunk}>
          {token}
        </Text>
      )
    );
  };

  const handleGoToEvent = () => {
    if (!linkedEventId) return;
  // Pasamos SOLO el UUID (no la URL)
  // Además, por compatibilidad, EventScreen puede leer 'id' o 'idEvento'
  nav.push(router, { pathname: ROUTES.MAIN.EVENTS.EVENT, params: { id: linkedEventId, idEvento: linkedEventId } });
  };

  const handleShare = async () => {
    if (!newsItem) return;
    try {
      const excerpt = (newsItem.contenido || "").slice(0, 180);
      await Share.share({
        title: newsItem.titulo,
        message: `${newsItem.titulo}\n\n${excerpt}${excerpt.length === 180 ? "…" : ""}`,
      });
    } catch (e) {
      // noop
    }
  };

  // Eliminado: cálculo de minutos de lectura

  const formattedDate = useMemo(() => {
    if (!newsItem?.dtPublicado) return "";
    try {
      const d = new Date(newsItem.dtPublicado);
      const day = d.getDate().toString().padStart(2, "0");
      const month = d.toLocaleString("es-ES", { month: "long" });
      const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
      const year = d.getFullYear();
      return `${day} ${capMonth} ${year}`;
    } catch {
      return new Date(newsItem!.dtPublicado).toLocaleDateString();
    }
  }, [newsItem?.dtPublicado]);

  const busy = loading || loadingRelatedEvent || loadingImages;
  if (busy) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <CirculoCarga visible text="Cargando noticia…" />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  if (!newsItem) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Noticia no encontrada.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <SafeAreaView style={styles.container}>
        <Header title="EventApp" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            {/* Image with category pill */}
            <View>
              {newsItem.imagen ? (
                <Image
                  source={getSafeImageSource(newsItem.imagen)}
                  style={styles.newsImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.newsImage, styles.noImage]}>
                  <Text style={styles.noImageText}>Imagen de la noticia</Text>
                </View>
              )}
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>MÚSICA</Text>
              </View>
            </View>

            {/* Meta row */}
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{newsItem.titulo}</Text>

            {/* Autor oculto: no se muestra sección de autor */}

            {/* Content */}
            {newsItem.contenido ? (
              <Text style={styles.description}>{linkifyText(newsItem.contenido)}</Text>
            ) : null}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Actions row: only share (no like, no save) */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
                <MaterialCommunityIcons name="share-variant" size={18} color={COLORS.textPrimary} />
                <Text style={styles.actionText}>Compartir</Text>
              </TouchableOpacity>
            </View>

            {/* Related event card */}
            {linkedEventId && (
              <View style={styles.relatedCard}>
                <View style={styles.relatedHeader}>
                  {relatedEventImage ? (
                    <Image
                      source={getSafeImageSource(relatedEventImage)}
                      style={styles.relatedThumb}
                    />
                  ) : (
                    <View style={styles.relatedIconWrap}>
                      <MaterialCommunityIcons name="calendar-blank" size={20} color={COLORS.textPrimary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.relatedTitle}>Evento relacionado</Text>
                    <Text style={styles.relatedSubtitle} numberOfLines={2}>
                      {relatedEventTitle || "Ver evento"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.relatedBtn} onPress={handleGoToEvent}>
                  <Text style={styles.relatedBtnText}>Ver evento completo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalStyles.COLORS.backgroundLight,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  contentContainer: {
    marginHorizontal: 12,
    alignItems: "stretch",
  },
  newsImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginBottom: 0,
  },
  noImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.borderInput,
  },
  noImageText: {
    color: COLORS.textSecondary,
  },
  categoryPill: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#eef2f7",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  metaSeparator: {
    color: COLORS.textSecondary,
  },
  title: {
    marginTop: 8,
    fontSize: 24,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.borderInput,
  },
  authorAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.borderInput,
  },
  authorName: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  authorRole: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  description: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "left",
    marginTop: 12,
    marginBottom: 16,
    alignSelf: "stretch",
  },
  descriptionTextChunk: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  link: {
    color: COLORS.info,
    textDecorationLine: "underline",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderInput,
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: COLORS.textPrimary,
  },
  relatedCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  relatedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  relatedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.borderInput,
  },
  relatedTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  relatedSubtitle: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  relatedBtn: {
    backgroundColor: "#0F172A",
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedBtnText: {
    color: globalStyles.COLORS.backgroundLight,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: 50,
    textAlign: "center",
    fontSize: FONT_SIZES.body,
    color: COLORS.negative,
  },
});
