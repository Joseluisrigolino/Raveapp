// src/screens/ArtistsScreens/ArtistsScreen.tsx

import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter, usePathname } from "expo-router";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import ArtistCard from "@/components/artists/ArtistCardComponent";
import SearchBar from "@/components/common/SearchBarComponent";

import { Artist } from "@/interfaces/Artist";
import { fetchArtistsFromApi } from "@/utils/artists/artistApi";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

export default function ArtistsScreen() {
  const router = useRouter();
  const path = usePathname();
  const { user } = useAuth();

  const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles];
  const isAdmin = roles.includes("admin");

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
    router.push(
      `/main/ArtistsScreens/ArtistScreen?id=${encodeURIComponent(
        artist.idArtista
      )}`
    );
  };

  const tabs = [
    ...(isAdmin
      ? [
          {
            label: "Adm Noticias",
            route: "/admin/NewsScreens/ManageNewScreen",
            isActive: path === "/admin/NewsScreens/ManageNewScreen",
          },
          {
            label: "Adm Artistas",
            route: "/admin/ArtistScreens/ManageArtistsScreen",
            isActive: path === "/admin/ArtistScreens/ManageArtistsScreen",
          },
        ]
      : []),
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
    <ProtectedRoute allowedRoles={["admin", "owner", "user"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <TabMenuComponent tabs={tabs} />

        <View style={styles.searchWrapper}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar artista"
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

              const rowStyle =
                group.length === 1
                  ? styles.rowOne
                  : group.length === 2
                  ? styles.rowTwo
                  : styles.rowThree;

              return (
                <View key={letter} style={styles.letterGroup}>
                  {letter !== alphabet[0] && <View style={styles.separator} />}
                  <Text style={styles.letterTitle}>{letter}</Text>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.cardBg,
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
  letterTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  rowOne: {
    justifyContent: "center",
  },
  rowTwo: {
    justifyContent: "space-evenly",
  },
  rowThree: {
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: "30%",
    marginBottom: 16,
    marginHorizontal: "1.5%",
  },
});
