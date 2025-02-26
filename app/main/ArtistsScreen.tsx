// screens/ArtistsScreen.tsx
import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView, Text } from "react-native";
import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import ArtistCard from "@/components/ArtistCardComponent";
import SearchBar from "@/components/SearchBarComponent";
import { Artist } from "@/interfaces/Artist";

type Alphabet =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J"
  | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T"
  | "U" | "V" | "W" | "X" | "Y" | "Z";

const artistData: Record<Alphabet, string[]> = {
  A: ["Ariana Grande", "Alicia Keys", "Adele"],
  B: ["Beyoncé", "Bruno Mars", "Billie Eilish"],
  C: ["Charlie Puth", "Coldplay", "Chris Brown"],
  D: ["Drake", "David Guetta", "Dua Lipa"],
  E: ["Ed Sheeran", "Elton John", "Emeli Sandé"],
  F: ["Freddie Mercury", "Future", "Florence Welch"],
  G: ["Gwen Stefani", "Green Day", "Galantis"],
  H: [],
  I: ["Imagine Dragons", "Iggy Azalea", "Iron Maiden"],
  J: ["Justin Bieber", "Jennifer Lopez", "John Legend"],
  K: ["Katy Perry", "Kendrick Lamar", "Kesha"],
  L: ["Lorde", "Lana Del Rey", "Lil Nas X"],
  M: ["Mariah Carey", "Miley Cyrus", "Maroon 5"],
  N: ["Nicki Minaj", "Niall Horan", "Ne-Yo"],
  O: ["Olivia Rodrigo", "OneRepublic", "OutKast"],
  P: ["Post Malone", "P!nk", "Pharrell Williams"],
  Q: ["Queen", "Quavo", "Quinn XCII"],
  R: ["Rihanna", "Red Hot Chili Peppers", "Rod Stewart"],
  S: ["Shakira", "Sia", "Selena Gomez"],
  T: ["Taylor Swift", "The Weeknd", "Travis Scott"],
  U: ["Usher", "U2", "Underoath"],
  V: [],
  W: ["Wiz Khalifa", "Wham!", "The White Stripes"],
  X: [],
  Y: ["Yoncé", "Yo-Yo Ma", "Yungblud"],
  Z: ["Zayn Malik", "Zedd", "Zac Brown Band"],
};

const generateArtists = (): Artist[] => {
  const artistsList: Artist[] = [];
  (Object.keys(artistData) as Alphabet[]).forEach((letter: Alphabet) => {
    artistData[letter].forEach((name: string) => {
      const randomNum = Math.floor(Math.random() * 100) + 1;
      artistsList.push({
        name,
        image: `https://picsum.photos/200/200?random=${randomNum}`,
      });
    });
  });
  return artistsList;
};

export default function ArtistsScreen() {
  const [searchText, setSearchText] = useState<string>("");
  const [artists] = useState<Artist[]>(() => generateArtists());

  // Se filtra usando startsWith para que el nombre inicie con el texto ingresado.
  const filteredArtists = useMemo(() => {
    return artists.filter((artist: Artist) =>
      artist.name.toLowerCase().startsWith(searchText.toLowerCase())
    );
  }, [artists, searchText]);

  // Agrupa los artistas filtrados por la primera letra de su nombre.
  const getLetterGroup = (letter: string): Artist[] => {
    return filteredArtists.filter(
      (artist: Artist) => artist.name[0].toLowerCase() === letter.toLowerCase()
    );
  };

  const alphabet: string[] = "abcdefghijklmnopqrstuvwxyz".split("");

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />
      {/* Se pasa el placeholder personalizado */}
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Buscar artista"
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {alphabet.map((letter: string) => {
          const group = getLetterGroup(letter);
          if (group.length === 0) return null;
          return (
            <View key={letter} style={styles.letterGroup}>
              <Text style={styles.letterTitle}>{letter.toUpperCase()}</Text>
              <View style={styles.artistCardsRow}>
                {group.map((artist: Artist, index: number) => (
                  <ArtistCard
                    key={index}
                    artistName={artist.name}
                    artistImage={artist.image}
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
  },
  letterGroup: {
    marginTop: 20,
  },
  letterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  artistCardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
  },
});
