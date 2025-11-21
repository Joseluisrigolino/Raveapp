// src/screens/NewsScreens/NewsScreen.tsx
import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";

import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import SearchBarComponent from "@/components/common/SearchBarComponent";

import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";
import { useAuth } from "@/app/auth/AuthContext";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

import { NewsItem } from "@/interfaces/NewsProps";
import useNewsList from "../services/useNewsList";
import NewsListCardComponent from "../components/new/NewsListCardComponent";
import NewsEmptyPlaceholderComponent from "../components/new/NewsEmptyPlaceholderComponent";

export default function NewsScreen() {
  const router = useRouter();
  const path = usePathname();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [searchText, setSearchText] = useState("");

  const { news, loading, refreshing, error, reload } = useNewsList();

  const currentScreen = path?.split("/").pop() || "";

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

    baseTabs.push({
      label: "Artistas",
      route: ROUTES.MAIN.ARTISTS.LIST,
      isActive: currentScreen === ROUTES.MAIN.ARTISTS.LIST.split("/").pop(),
    });

    return baseTabs;
  }, [currentScreen, isAdmin]);

  const goToDetail = useCallback(
    (item: NewsItem) =>
      nav.push(router, {
        pathname: ROUTES.MAIN.NEWS.ITEM,
        params: { id: item.idNoticia },
      }),
    [router]
  );

  const filteredList = useMemo(() => {
    if (!searchText.trim()) return news;
    const q = searchText.toLowerCase();
    return news.filter(
      (n) =>
        n.titulo.toLowerCase().includes(q) ||
        (n.contenido || "").toLowerCase().includes(q)
    );
  }, [news, searchText]);

  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "user"]}>
      <SafeAreaView style={styles.mainContainer}>
        <Header />
        <TabMenuComponent tabs={tabs} />

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
            <TouchableOpacity
              onPress={() => reload({ refresh: true })}
              style={styles.retryButton}
              activeOpacity={0.85}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : news.length === 0 ? (
          <NewsEmptyPlaceholderComponent />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => reload({ refresh: true })}
              />
            }
          >
            <View style={styles.containerCards}>
              {filteredList.length === 0 ? (
                <View style={styles.centered}>
                  <Text style={styles.emptySearchText}>
                    No se encontraron noticias para tu búsqueda.
                  </Text>
                </View>
              ) : (
                filteredList.map((item) => (
                  <NewsListCardComponent
                    key={item.idNoticia}
                    item={item}
                    onPress={() => goToDetail(item)}
                  />
                ))
              )}
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
  emptySearchText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 16,
  },
});
