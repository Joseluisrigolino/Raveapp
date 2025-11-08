import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/app/auth/AuthContext";
import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";
import ProtectedRoute from "@/app/auth/ProtectedRoute";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import { getNews } from "@/app/news/apis/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SearchBarComponent from "@/components/common/SearchBarComponent";
import { getSafeImageSource } from "@/utils/image";

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
  // Autor oculto en UI (se elimina resolución de autor)

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
  // Eliminados helpers de autor (no se muestra el creador en la UI)

  // Resolve authors for the current news list and cache results (replicates NewScreen fallbacks)
  // Eliminada la resolución de autor en lista (no se muestra)

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

  // Eliminado: cálculo de minutos de lectura

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
            <View style={styles.placeholderCard}>
              <View style={styles.placeholderIconBox}>
                <MaterialCommunityIcons name="newspaper-variant-outline" size={34} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.placeholderTitle}>No hay noticias por ahora</Text>
              <Text style={styles.placeholderSubtitle}>Por el momento, no hay noticias para mostrar. Próximamente estaremos subiendo las últimas novedades.</Text>
            </View>
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
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons name="clock-time-three-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>
                        {new Date(item.dtPublicado).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text style={styles.newsTitle} numberOfLines={2}>{item.titulo}</Text>
                    <Text style={styles.newsExcerpt} numberOfLines={2}>{String(item.contenido || "").replace(/\n+/g, " ").trim()}</Text>

                    <View style={styles.footerRow}>
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
    justifyContent: "flex-end",
    marginTop: 10,
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
  /* Placeholder styles for empty news list */
  placeholderCard: {
    width: 320,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  placeholderIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
