// src/screens/ArtistsScreens/ArtistsScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Text,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ArtistCard from "@/components/artists/ArtistCardComponent";
import SearchBar from "@/components/common/SearchBarComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";

import { Artist } from "@/interfaces/Artist";
import { fetchArtistsFromApi } from "@/utils/artists/artistApi";
import globalStyles, { COLORS, FONT_SIZES } from "@/styles/globalStyles";

export default function ArtistsScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistsFromApi()
      .then((result) => setArtists(result))
      .catch((error) => console.error("Error fetching artists:", error))
      .finally(() => setLoading(false));
  }, []);

  // Filtrar solo artistas activos y luego aplicar búsqueda
  const filteredArtists = useMemo(() => {
    const lowerSearch = searchText.toLowerCase();
    return artists
      .filter((artist) => artist.isActivo)
      .filter((artist) =>
        artist.name.toLowerCase().includes(lowerSearch)
      );
  }, [artists, searchText]);

  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

  const getLetterGroup = (letter: string) =>
    filteredArtists.filter(
      (artist) => artist.name[0]?.toLowerCase() === letter.toLowerCase()
    );

  const handleArtistPress = (artist: Artist) => {
    router.push(
      `/main/ArtistsScreens/ArtistScreen?id=${encodeURIComponent(
        artist.idArtista
      )}`
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />

      <TabMenuComponent
        tabs={[
          { label: "Noticias", route: "/main/NewsScreens/NewsScreen", isActive: false },
          { label: "Artistas", route: "/main/ArtistsScreens/ArtistsScreen", isActive: true },
        ]}
      />

      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Buscar artista"
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {alphabet.map((letter) => {
            const group = getLetterGroup(letter);
            if (group.length === 0) return null;

            return (
              <View key={letter} style={styles.letterGroup}>
                <Text style={styles.letterTitle}>{letter.toUpperCase()}</Text>
                <View style={styles.artistCardsRow}>
                  {group.map((artist) => (
                    <ArtistCard
                      key={artist.idArtista}
                      artistName={artist.name}
                      artistImage={artist.image}
                      onPress={() => handleArtistPress(artist)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  letterGroup: {
    marginTop: 20,
  },
  letterTitle: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
  artistCardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
  },
});