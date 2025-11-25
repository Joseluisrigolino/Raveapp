// src/screens/ArtistsScreens/ArtistsScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";

import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import ArtistCard from "@/app/artists/components/ArtistCardComponent";
import ArtistListLetter from "@/app/artists/components/artist/artist-list/ArtistListLetterComponent";

import { Artist } from "@/app/artists/types/Artist";
import useGetArtists from "@/app/artists/services/useGetArtists";
import { useAuth } from "@/app/auth/AuthContext";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import SearchBarComponent from "@/components/common/SearchBarComponent";

export default function ArtistsScreen() {
  const router = useRouter();
  const path = usePathname();
  // Usar helpers del contexto para roles y autenticación
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  // estados en inglés, comentarios en español
  const [search, setSearch] = useState<string>("");
  const { data: artistsList, isLoading, refresh } = useGetArtists();

  // cargar artistas al montar (hook maneja la carga)
  useEffect(() => {
    // refresh está manejado internamente por el hook, pero lo dejamos
    // disponible si queremos forzar una recarga en el futuro.
  }, [refresh]);

  // filtrar artistas activos por búsqueda (lógica simple)
  const filteredArtists = artistsList
    .filter((a) => a.isActivo)
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // abrir detalle de artista
  const openArtist = (artist: Artist) => {
    nav.push(router, { pathname: ROUTES.MAIN.ARTISTS.ITEM, params: { id: artist.idArtista } });
  };

  const currentScreen = path.split("/").pop() || "";
  const tabs = [
    ...(isAdmin
      ? [
          {
            label: "Administrar artistas",
            route: ROUTES.ADMIN.ARTISTS.MANAGE,
            isActive:
              currentScreen === ROUTES.ADMIN.ARTISTS.MANAGE.split("/").pop(),
          },
        ]
      : []),
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
          <SearchBarComponent value={search} onChangeText={setSearch} placeholder="Buscar artista..." containerStyle={{ marginHorizontal: 0 }} />
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {filteredArtists.length === 0 && (
              <Text style={styles.emptyText}>No se encontraron artistas.</Text>
            )}
            {alphabet.map((letter) => {
              const group = filteredArtists.filter(
                (a) => a.name.charAt(0).toUpperCase() === letter
              );
              if (!group.length) return null;

              const rowStyle = styles.rowTwo;

              return (
                <View key={letter} style={styles.letterGroup}>
                    <ArtistListLetter letter={letter} />
                  <View style={[styles.cardsRow, rowStyle]}>
                    {group.map((artist) => (
                      <View key={artist.idArtista} style={styles.cardWrapper}>
                        <ArtistCard artist={artist} onPress={() => openArtist(artist)} />
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
    width: "100%",
    alignSelf: "stretch",
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
  letterGroup: {
    marginTop: 16,
  },
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  rowTwo: {
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 16,
    marginHorizontal: "1%",
  },
});
