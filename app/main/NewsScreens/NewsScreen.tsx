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

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x200?text=Sin+imagen";

export default function NewsScreen() {
  const router = useRouter();
  const path = usePathname();
  const { user } = useAuth();

  const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles];
  const isAdmin = roles.includes("admin");

  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getNews();
        setNewsList(data);
      } catch (err) {
        console.error("[debug] Error fetching news:", err);
        setError("Error al cargar las noticias");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentScreen = path.split("/").pop() || "";
  const tabs = [
    {
      label: "Administrar Noticias",
      route: "/admin/NewsScreens/ManageNewScreen",
      isActive: currentScreen === "ManageNewsScreen",
      visible: isAdmin,
    },
    {
      label: "Noticias",
      route: "/main/NewsScreens/NewsScreen",
      isActive: currentScreen === "NewsScreen",
      visible: true,
    },
    {
      label: "Artistas",
      route: "/main/ArtistsScreens/ArtistsScreen",
      isActive: currentScreen === "ArtistsScreen",
      visible: true,
    },
  ].filter((tab) => tab.visible);

  const goToDetail = (item: NewsItem) =>
    router.push(`/main/NewsScreens/NewScreen?id=${item.idNoticia}`);

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
          </View>
        ) : newsList.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>No hay noticias disponibles.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.containerCards}>
              {newsList.map((item) => (
                <TouchableOpacity
                  key={item.idNoticia}
                  style={styles.newsCard}
                  onPress={() => goToDetail(item)}
                  activeOpacity={0.8}
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
                  <Text style={styles.newsDate}>
                    {new Date(item.dtPublicado).toLocaleDateString()}
                  </Text>
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
});
