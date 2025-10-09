import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "../../../routes";
import * as nav from "@/utils/navigation";
import ProtectedRoute from "@/utils/auth/ProtectedRoute";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import { getNews } from "@/utils/news/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

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
  const [error, setError] = useState<string | null>(null);

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

  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "user"]}>
      <SafeAreaView style={styles.mainContainer}>
        <Header />
        <TabMenuComponent tabs={tabs} />

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
              {newsList.map((item) => (
                <TouchableOpacity
                  key={item.idNoticia}
                  style={styles.newsCard}
                  onPress={() => goToDetail(item)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: item.imagen || PLACEHOLDER_IMAGE }}
                    style={styles.newsImage}
                    resizeMode="cover"
                  />
                  <View style={styles.textRow}>
                    <Text style={styles.newsTitle} numberOfLines={1}>
                      {item.titulo}
                    </Text>
                    <Text style={styles.readMore}>→</Text>
                  </View>
                  <Text style={styles.newsDate}>{new Date(item.dtPublicado).toLocaleDateString()}</Text>
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
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    overflow: "hidden",
    marginBottom: 16,
  },
  newsImage: {
    width: "100%",
    height: 180,
  },
  textRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  newsTitle: {
    flex: 1,
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
  },
  readMore: {
    marginLeft: 8,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
  },
  newsDate: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
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
