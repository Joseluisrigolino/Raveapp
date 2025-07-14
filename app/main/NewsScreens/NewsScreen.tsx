// src/screens/NewsScreens/NewsScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/utils/auth/ProtectedRoute";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import { getNews } from "@/utils/news/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/400x200?text=Sin+imagen";

export default function NewsScreen() {
  const router = useRouter();
  const path = usePathname(); // para detectar la pestaña activa
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("admin");

  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getNews();
        setNewsList(data);
      } catch (err) {
        console.error(err);
        setError("Error al cargar las noticias");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const goToDetail = (item: NewsItem) =>
    router.push(`/main/NewsScreens/NewScreen?id=${item.idNoticia}`);
  const goToCreateEvent = () =>
    router.push("/main/EventsScreens/CreateEventScreen");
  const goToManageNews = () =>
    router.push("/admin/NewsScreens/ManageNewScreen");
  const goToManageArtists = () =>
    router.push("/admin/ArtistScreens/ManageArtistsScreen");

  if (loading || error) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <Header />
        <View style={styles.centered}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  // Construcción del array de pestañas:
  const tabs = [
    // Si es admin, agrego primero las pestañas de gestión:
    ...(isAdmin
      ? [
          {
            label: "Administrar Noticias",
            route: "/admin/NewsScreens/ManageNewScreen",
            isActive: path === "/admin/NewsScreens/ManageNewScreen",
          },
          {
            label: "Administrar Artistas",
            route: "/admin/ArtistScreens/ManageArtistsScreen",
            isActive: path === "/admin/ArtistScreens/ManageArtistsScreen",
          },
        ]
      : []),
    // Luego las pestañas públicas
    {
      label: "Noticias",
      route: "/main/NewsScreens/NewsScreen",
      isActive: path === "/main/NewsScreens/NewsScreen",
    },
    {
      label: "Artistas",
      route: "/main/ArtistsScreens/ArtistsScreen",
      isActive: path === "/main/ArtistsScreens/ArtistsScreen",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <SafeAreaView style={styles.mainContainer}>
        <Header />

        <TabMenuComponent tabs={tabs} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {isAdmin && (
            <TouchableOpacity
              style={styles.createEventButton}
              onPress={goToCreateEvent}
            >
              <Text style={styles.createEventButtonText}>
                Crear evento
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.containerCards}>
            {newsList.map((item) => (
              <TouchableOpacity
                key={item.idNoticia}
                style={styles.newsCard}
                onPress={() => goToDetail(item)}
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri: item.imagen || PLACEHOLDER_IMAGE,
                  }}
                  style={styles.newsImage}
                  resizeMode="cover"
                />
                <View style={styles.textRow}>
                  <Text style={styles.newsTitle} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  <Text style={styles.readMore}>→</Text>
                </View>
                <Text style={styles.newsDate}>
                  {new Date(item.dtPublicado).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
  },
  scrollContent: {
    paddingBottom: 16,
    backgroundColor: COLORS.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  createEventButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    alignItems: "center",
  },
  createEventButtonText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
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
});
