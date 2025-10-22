// screens/NewsScreens/NewScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import { ScrollView, View, Text, Image, StyleSheet, Linking, TouchableOpacity, ActivityIndicator, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../../routes";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { NewsItem } from "@/interfaces/NewsProps";
import { getNewsById, extractEventIdFromUrl } from "@/utils/news/newsApi";
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getSafeImageSource } from "@/utils/image";
import { fetchEventById } from "@/utils/events/eventApi";
import { mediaApi } from "@/utils/mediaApi";
import { getProfile, getUsuarioById } from "@/utils/auth/userHelpers";

export default function NewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [linkedEventId, setLinkedEventId] = useState<string | null>(null);
  const [relatedEventTitle, setRelatedEventTitle] = useState<string | null>(null);
  const [relatedEventImage, setRelatedEventImage] = useState<string | null>(null);
  const [relatedOwnerId, setRelatedOwnerId] = useState<string | null>(null);
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(null);
  const [authorIdResolved, setAuthorIdResolved] = useState<string | null>(null);
  const [authorNameResolved, setAuthorNameResolved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      try {
        const ev = await fetchEventById(linkedEventId);
        if (active && ev) {
          setRelatedEventTitle(ev.title || null);
          setRelatedEventImage(ev.imageUrl || null);
          setRelatedOwnerId((ev as any)?.ownerId ? String((ev as any).ownerId) : null);
        }
      } catch (e) {
        if (active) {
          setRelatedEventTitle(null);
          setRelatedEventImage(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [linkedEventId]);

  // Heuristic author name from the news object (fallback)
  const authorName = useMemo(() => {
    const n: any = newsItem;
    if (!n) return undefined;
    return (
      n?.autorNombre ||
      n?.autor ||
      n?.createdByName ||
      n?.creadoPorNombre ||
      n?.usuario?.nombre ||
      n?.usuario?.nombreFantasia ||
      (n?.usuario?.nombre && n?.usuario?.apellido
        ? `${n.usuario.nombre} ${n.usuario.apellido}`
        : undefined)
    );
  }, [newsItem]);

  const authorRole = useMemo(() => {
    const n: any = newsItem;
    return n?.autorRol || n?.usuario?.rol || undefined;
  }, [newsItem]);

  const displayAuthorName = useMemo(() => {
    return authorNameResolved || authorName;
  }, [authorNameResolved, authorName]);

  useEffect(() => {
    let active = true;
    (async () => {
      const n: any = newsItem;
      if (!n) {
        if (active) setAuthorAvatarUrl(null);
        if (active) setAuthorIdResolved(null);
        if (active) setAuthorNameResolved(null);
        return;
      }
      // Discover an author user id from several likely fields and fallbacks
      const normalizeId = (val: any): string | undefined => {
        if (!val && val !== 0) return undefined;
        if (typeof val === "number") return String(val);
        if (typeof val === "string") return val;
        if (typeof val === "object") {
          return (
            normalizeId(val.idUsuario) ||
            normalizeId(val.IdUsuario) ||
            normalizeId(val.id) ||
            normalizeId(val.Id) ||
            undefined
          );
        }
        return undefined;
      };

      let candidateId: string | undefined =
        normalizeId(n?.autorId) ||
        normalizeId(n?.idAutor) ||
        normalizeId(n?.createdById) ||
        normalizeId(n?.creadoPorId) ||
        normalizeId(n?.idUsuarioAutor) ||
        normalizeId(n?.idUsuarioCreador) ||
        normalizeId(n?.idUsuario) ||
        normalizeId(n?.IdUsuario) ||
        normalizeId(n?.usuario?.idUsuario) ||
        normalizeId(n?.usuario?.IdUsuario) ||
        normalizeId(n?.createdBy) ||
        normalizeId(n?.creadoPor) ||
        normalizeId(n?.usuarioCreador);

      // If not found, try resolve by author email
      if (!candidateId) {
        const candidateEmail: string | undefined =
          n?.autorEmail ||
          n?.email ||
          n?.usuario?.correo ||
          n?.usuario?.email ||
          n?.creadoPorEmail ||
          n?.createdByEmail ||
          undefined;
        if (candidateEmail) {
          try {
            const profile = await getProfile(String(candidateEmail));
            if (profile?.idUsuario) candidateId = String(profile.idUsuario);
          } catch {
            // ignore
          }
        }
      }

      // As a final fallback, try event owner
      if (!candidateId && relatedOwnerId) {
        candidateId = relatedOwnerId;
      }

      if (!candidateId) {
        if (active) setAuthorAvatarUrl(null);
        if (active) setAuthorIdResolved(null);
        return;
      }
      if (active) setAuthorIdResolved(String(candidateId));

      // Try to resolve author name from user profile by id
      try {
        const prof = await getUsuarioById(String(candidateId));
        if (active && prof) {
          const fullName = prof?.nombre && prof?.apellido ? `${prof.nombre} ${prof.apellido}` : (prof?.nombreFantasia || prof?.nombre);
          if (fullName) setAuthorNameResolved(fullName);
        }
      } catch {
        // ignore
      }
      try {
        const url = await mediaApi.getFirstImage(String(candidateId));
        if (active) setAuthorAvatarUrl(url || null);
      } catch {
        if (active) setAuthorAvatarUrl(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [newsItem, relatedOwnerId]);

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

  const readingMinutes = useMemo(() => {
    const words = (newsItem?.contenido || "").trim().split(/\s+/).filter(Boolean).length;
    const min = Math.max(1, Math.round(words / 200));
    return min;
  }, [newsItem?.contenido]);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.metaText}>{readingMinutes} min de lectura</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{newsItem.titulo}</Text>

            {/* Author row (from API + media) */}
            {(displayAuthorName || authorAvatarUrl) && (
              <View style={styles.authorRow}>
                {authorAvatarUrl ? (
                  <Image source={getSafeImageSource(authorAvatarUrl)} style={styles.authorAvatarImg} />
                ) : (
                  <View style={styles.authorAvatar} />
                )}
                <View>
                  {displayAuthorName ? <Text style={styles.authorName}>{displayAuthorName}</Text> : null}
                  {authorRole ? <Text style={styles.authorRole}>{authorRole}</Text> : null}
                </View>
              </View>
            )}

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
