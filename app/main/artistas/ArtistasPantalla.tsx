// src/screens/ArtistsScreens/ArtistsScreen.tsx

import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { ROUTES } from "../../../routes";
import * as nav from "@/utils/navigation";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import ArtistCard from "@/components/artists/ArtistCardComponent";

import { Artist } from "@/interfaces/Artist";
import { fetchArtistsFromApi } from "@/utils/artists/artistApi";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import SearchBarComponent from "@/components/common/SearchBarComponent";

export default function ArtistasPantalla() {
  const router = useRouter();
  const path = usePathname();
  // Usar helpers del contexto para roles y autenticación
  const { user, isAuthenticated, hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [searchText, setSearchText] = useState<string>("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchArtistsFromApi();
        setArtists(data);
      } catch (err) {
        console.error("Error al traer artistas:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredArtists = useMemo<Artist[]>(() => {
    const q = searchText.toLowerCase();
    return artists
      .filter(a => a.isActivo)
      .filter(a => a.name.toLowerCase().includes(q));
  }, [artists, searchText]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const handlePress = (artist: Artist) => {
    nav.push(router, { pathname: ROUTES.MAIN.ARTISTS.ITEM, params: { id: artist.idArtista } });
  };

  const currentScreen = path.split("/").pop() || "";
  // Si el usuario es admin, mostrar sólo 'ADM ARTISTAS' seguido de 'ARTISTAS'
  // Si no, mostrar 'Noticias' y 'Artistas' (como antes)
  const tabs = isAdmin
    ? [
        {
          label: "Administrar artistas",
          route: ROUTES.ADMIN.ARTISTS.MANAGE,
          isActive: currentScreen === ROUTES.ADMIN.ARTISTS.MANAGE.split("/").pop(),
        },
        {
          label: "Artistas",
          route: ROUTES.MAIN.ARTISTS.LIST,
          isActive: currentScreen === ROUTES.MAIN.ARTISTS.LIST.split("/").pop(),
        },
      ]
    : [
        {
          label: "Noticias",
          route: ROUTES.MAIN.NEWS.LIST,
          isActive: currentScreen === ROUTES.MAIN.NEWS.LIST.split("/").pop(),
        },
        {
          label: "Artistas",
          route: ROUTES.MAIN.ARTISTS.LIST,
          isActive: currentScreen === ROUTES.MAIN.ARTISTS.LIST.split("/").pop(),
        },
      ];

  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "user"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <TabMenuComponent tabs={tabs} />

        <View style={styles.searchWrapper}>
          <SearchBarComponent
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar artista..."
          />
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {filteredArtists.length === 0 && (
              <Text style={styles.emptyText}>
                No se encontraron artistas.
              </Text>
            )}
            {alphabet.map(letter => {
              const group = filteredArtists.filter(
                a => a.name.charAt(0).toUpperCase() === letter
              );
              if (!group.length) return null;

              const rowStyle = styles.rowTwo;

              return (
                <View key={letter} style={styles.letterGroup}>
                  <View style={styles.letterHeader}>
                    <View style={styles.letterBubble}>
                      <Text style={styles.letterBubbleText}>{letter}</Text>
                    </View>
                    <View style={styles.letterDivider} />
                  </View>
                  <View style={[styles.cardsRow, rowStyle]}>
                    {group.map(artist => (
                      <View
                        key={artist.idArtista}
                        style={styles.cardWrapper}
                      >
                        <ArtistCard
                          artist={artist}
                          onPress={() => handlePress(artist)}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
  },
  searchWrapper: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.cardBg,
    width: '100%',
    alignSelf: 'stretch',
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: "center",
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 20,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderInput,
    marginVertical: 12,
  },
  letterGroup: {
    marginTop: 16,
  },
  letterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  letterBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  letterBubbleText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
  },
  letterDivider: {
    height: 1,
    flex: 1,
    backgroundColor: COLORS.borderInput,
  },
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  rowOne: {
    justifyContent: "flex-start",
  },
  rowTwo: {
    justifyContent: "space-between",
  },
  rowThree: {
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 16,
    marginHorizontal: "1%",
  },
});
