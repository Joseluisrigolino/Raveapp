import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "../../../routes";
import * as nav from "@/utils/navigation";
import ProtectedRoute from "@/utils/auth/ProtectedRoute";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import { getNews, extractEventIdFromUrl } from "@/utils/news/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SearchBarComponent from "@/components/common/SearchBarComponent";
import { getSafeImageSource } from "@/utils/image";
import { mediaApi } from "@/utils/mediaApi";
import { getUsuarioById, getProfile } from "@/utils/auth/userHelpers";
import { fetchEventById } from "@/utils/events/eventApi";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x200?text=Sin+imagen";

export default function NewsScreen() {
  const router = useRouter();
  const path = usePathname();
  // Usar helpers del contexto para roles y autenticación
  const { user, isAuthenticated, hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [authorById, setAuthorById] = useState<Record<string, { name?: string; avatarUrl?: string }>>({});
  const [emailToId, setEmailToId] = useState<Record<string, string>>({});

  const loadNews = useCallback(async (opts: { refresh?: boolean } = {}) => {
    if (opts.refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getNews();
      setNewsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[NewsScreen] Error fetching news:", err);
      setError("Error al cargar las noticias");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Helpers to derive author info from a news item
  const normalizeId = useCallback((val: any): string | undefined => {
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
  }, []);

  const extractAuthorId = useCallback((n: any): string | undefined => {
    return (
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
      normalizeId(n?.usuarioCreador)
    );
  }, [normalizeId]);

  const extractAuthorEmail = useCallback((n: any): string | undefined => {
    return (
      n?.autorEmail ||
      n?.email ||
      n?.usuario?.correo ||
      n?.usuario?.email ||
      n?.creadoPorEmail ||
      n?.createdByEmail ||
      undefined
    );
  }, []);

  const heuristicAuthorName = useCallback((n: any): string | undefined => {
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
  }, []);

  // Resolve authors for the current news list and cache results (replicates NewScreen fallbacks)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!Array.isArray(newsList) || newsList.length === 0) return;

      const idsToFetch = new Set<string>();
      const emailsToResolve = new Set<string>();
      const eventsToResolve = new Set<string>();

      for (const item of newsList) {
        const id = extractAuthorId(item as any);
        if (id) {
          if (!authorById[id]) idsToFetch.add(id);
          continue;
        }
        const email = extractAuthorEmail(item as any);
        if (email && !emailToId[email]) emailsToResolve.add(email);
        // If no id/email, try to resolve from related event owner as a final fallback (like NewScreen)
        if (!id && !email) {
          const evId = (item as any)?.urlEventoId || extractEventIdFromUrl((item as any)?.urlEvento);
          if (evId) eventsToResolve.add(String(evId));
        }
      }

      // Resolve emails to IDs
      const newEmailToId: Record<string, string> = {};
      if (emailsToResolve.size > 0) {
        await Promise.all(
          Array.from(emailsToResolve).map(async (mail) => {
            try {
              const prof = await getProfile(mail);
              if (prof?.idUsuario) newEmailToId[mail] = String(prof.idUsuario);
            } catch {}
          })
        );
      }

      if (Object.keys(newEmailToId).length) {
        if (!cancelled) setEmailToId((prev) => ({ ...prev, ...newEmailToId }));
      }

      // Any newly resolved IDs to fetch profiles/media for
      for (const [mail, id] of Object.entries(newEmailToId)) {
        if (!authorById[id]) idsToFetch.add(id);
      }

      // Resolve events to ownerIds (fallback)
      if (eventsToResolve.size > 0) {
        const ownerIds = await Promise.all(
          Array.from(eventsToResolve).map(async (evId) => {
            try {
              const ev = await fetchEventById(evId);
              const owner = (ev as any)?.ownerId;
              return owner ? String(owner) : undefined;
            } catch { return undefined; }
          })
        );
        for (const oid of ownerIds) {
          if (oid && !authorById[oid]) idsToFetch.add(oid);
        }
      }

      if (idsToFetch.size === 0) return;

      const newAuthorById: Record<string, { name?: string; avatarUrl?: string }> = {};
      await Promise.all(
        Array.from(idsToFetch).map(async (id) => {
          try {
            const [profile, avatar] = await Promise.all([
              getUsuarioById(id),
              mediaApi.getFirstImage(id).catch(() => ""),
            ]);
            const name = profile?.nombre && profile?.apellido
              ? `${profile.nombre} ${profile.apellido}`
              : (profile?.nombreFantasia || profile?.nombre);
            newAuthorById[id] = { name: name || undefined, avatarUrl: avatar || undefined };
          } catch {
            // ignore individual failures
          }
        })
      );

      if (!cancelled && Object.keys(newAuthorById).length) {
        setAuthorById((prev) => ({ ...prev, ...newAuthorById }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [newsList, extractAuthorEmail, extractAuthorId]);

  const currentScreen = path?.split("/").pop() || "";

  // Tabs: si es administrador mostrar "Administrar Noticias" seguido de "Noticias";
  // si no es administrador mostrar "Noticias" y opcionalmente "Artistas".
  const tabs = useMemo(() => {
    if (isAdmin) {
      return [
        {
          label: "Administrar Noticias",
          route: ROUTES.ADMIN.NEWS.MANAGE,
          isActive: currentScreen === ROUTES.ADMIN.NEWS.MANAGE.split("/").pop(),
        },
        {
          label: "Noticias",
          route: ROUTES.MAIN.NEWS.LIST,
          isActive: currentScreen === ROUTES.MAIN.NEWS.LIST.split("/").pop(),
        },
      ];
    }

    const baseTabs: any[] = [
      {
        label: "Noticias",
        route: ROUTES.MAIN.NEWS.LIST,
        isActive: currentScreen === ROUTES.MAIN.NEWS.LIST.split("/").pop(),
      },
    ];

    // Mostrar "Artistas" sólo si NO es administrador
    if (!isAdmin) {
      baseTabs.push({
        label: "Artistas",
        route: ROUTES.MAIN.ARTISTS.LIST,
        isActive: currentScreen === ROUTES.MAIN.ARTISTS.LIST.split("/").pop(),
      });
    }

    return baseTabs;
  }, [currentScreen, isAdmin]);

  const goToDetail = useCallback(
    (item: NewsItem) => nav.push(router, { pathname: ROUTES.MAIN.NEWS.ITEM, params: { id: item.idNoticia } }),
    [router]
  );

  const filteredList = useMemo(() => {
    if (!searchText.trim()) return newsList;
    const q = searchText.toLowerCase();
    return newsList.filter((n) =>
      n.titulo.toLowerCase().includes(q) || (n.contenido || "").toLowerCase().includes(q)
    );
  }, [newsList, searchText]);

  const readingMinutes = (content?: string) => {
    const words = String(content || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  };

  const getCategory = (title: string, content?: string) => {
    const t = (title + " " + (content || "")).toLowerCase();
    if (/seguridad/.test(t)) return "SEGURIDAD";
    if (/música|musica/.test(t)) return "MÚSICA";
    if (/tendencia|tendencias/.test(t)) return "TENDENCIAS";
    if (/tecnolog/.test(t)) return "TECNOLOGÍA";
    return "NOTICIA";
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "user"]}>
      <SafeAreaView style={styles.mainContainer}>
  <Header />
        <TabMenuComponent tabs={tabs} />

        {/* Search */}
        <SearchBarComponent
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar noticias..."
        />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadNews({ refresh: true })} style={styles.retryButton}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : newsList.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>No hay noticias disponibles.</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNews({ refresh: true })} />}
          >
            <View style={styles.containerCards}>
              {filteredList.map((item) => (
                <TouchableOpacity
                  key={item.idNoticia}
                  style={styles.newsCard}
                  onPress={() => goToDetail(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.imageWrapper}>
                    <Image
                      source={getSafeImageSource(item.imagen || PLACEHOLDER_IMAGE)}
                      style={styles.newsImage}
                      resizeMode="cover"
                    />
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryText}>{getCategory(item.titulo, item.contenido)}</Text>
                    </View>
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons name="clock-time-three-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>
                        {new Date(item.dtPublicado).toLocaleDateString()} • {readingMinutes(item.contenido)} min de lectura
                      </Text>
                    </View>

                    <Text style={styles.newsTitle} numberOfLines={2}>{item.titulo}</Text>
                    <Text style={styles.newsExcerpt} numberOfLines={2}>{String(item.contenido || "").replace(/\n+/g, " ").trim()}</Text>

                    <View style={styles.footerRow}>
                      <View style={styles.authorRow}>
                        {(() => {
                          const aId = extractAuthorId(item as any);
                          const email = extractAuthorEmail(item as any);
                          const resolvedId = aId || (email ? emailToId[email] : undefined);
                          const info = resolvedId ? authorById[resolvedId] : undefined;
                          const heuristic = heuristicAuthorName(item as any);
                          const displayName = info?.name || heuristic || "";
                          return (
                            <>
                              {info?.avatarUrl ? (
                                <Image source={getSafeImageSource(info.avatarUrl)} style={styles.avatarImage} />
                              ) : (
                                <View style={styles.avatarCircle}>
                                  <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textPrimary} />
                                </View>
                              )}
                                  <Text style={styles.authorText}>Por {displayName || "Equipo EventApp"}</Text>
                            </>
                          );
                        })()}
                      </View>
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => {
                            const excerpt = String(item.contenido || "").replace(/\n+/g, " ").trim();
                            const short = excerpt.length > 140 ? excerpt.slice(0, 137) + "..." : excerpt;
                            Share.share({
                              title: `RaveApp - ${item.titulo}`,
                              message: `RaveApp - ${item.titulo}\n\n${short}`,
                            }).catch(() => {});
                          }}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="share-variant" size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  containerCards: {
    marginTop: 10,
    paddingHorizontal: 12,
  },
  newsCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  imageWrapper: {
    position: "relative",
  },
  newsImage: {
    width: "100%",
    height: 180,
  },
  categoryPill: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#ECEFF4",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.subTitleMedium,
  },
  cardContent: {
    padding: 12,
    backgroundColor: COLORS.backgroundLight,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  newsTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  newsExcerpt: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundLight,
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.borderInput,
  },
  authorText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  errorText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.negative,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
  },
});
