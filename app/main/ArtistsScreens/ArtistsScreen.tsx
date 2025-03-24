// screens/ArtistsScreens/ArtistsScreen.tsx
import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView, Text } from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ArtistCard from "@/components/artists/ArtistCardComponent";
import SearchBar from "@/components/common/SearchBarComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";

import { Artist } from "@/interfaces/Artist";
import globalStyles, { COLORS, FONT_SIZES } from "@/styles/globalStyles";

// <-- Importamos el helper:
import { getAllArtists } from "@/utils/artists/artistHelpers";

export default function ArtistsScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  // Obtenemos todo el array de artistas (con datos completos)
  const [artists] = useState<Artist[]>(() => getAllArtists());

  // Filtra en memoria (por el inicio del nombre, en este ejemplo)
  const filteredArtists = useMemo(() => {
    return artists.filter((artist) =>
      artist.name.toLowerCase().startsWith(searchText.toLowerCase())
    );
  }, [artists, searchText]);

  // Agrupación por letra
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

  const getLetterGroup = (letter: string) => {
    return filteredArtists.filter(
      (artist) => artist.name[0].toLowerCase() === letter.toLowerCase()
    );
  };

  // Navegar a detalle por "name"
  const handleArtistPress = (artist: Artist) => {
    router.push(
      `/main/ArtistsScreens/ArtistScreen?name=${encodeURIComponent(artist.name)}`
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
                    key={artist.id}
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

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: globalStyles.COLORS.backgroundLight,
  },
  letterGroup: {
    marginTop: 20,
  },
  letterTitle: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: globalStyles.COLORS.textPrimary,
    marginLeft: 10,
  },
  artistCardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
  },
});
