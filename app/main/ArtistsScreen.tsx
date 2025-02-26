// screens/ArtistsScreen.js
import React, { useState } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView, Text } from "react-native";
import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import ArtistCard from "@/components/ArtistCardComponent";
import SearchBar from "@/components/SearchBarComponent";

export default function ArtistsScreen() {
  const [searchText, setSearchText] = useState("");
  const artists = [
    // Letra A
    { name: "Ariana Grande", image: "https://picsum.photos/200/200?random=1" },
    { name: "Alicia Keys", image: "https://picsum.photos/200/200?random=2" },
    { name: "Adele", image: "https://picsum.photos/200/200?random=3" },

    // Letra B
    { name: "Beyoncé", image: "https://picsum.photos/200/200?random=4" },
    { name: "Bruno Mars", image: "https://picsum.photos/200/200?random=5" },
    { name: "Billie Eilish", image: "https://picsum.photos/200/200?random=6" },

    // Letra C
    { name: "Charlie Puth", image: "https://picsum.photos/200/200?random=7" },
    { name: "Coldplay", image: "https://picsum.photos/200/200?random=8" },
    { name: "Chris Brown", image: "https://picsum.photos/200/200?random=9" },

    // Letra D
    { name: "Drake", image: "https://picsum.photos/200/200?random=10" },
    { name: "David Guetta", image: "https://picsum.photos/200/200?random=11" },
    { name: "Dua Lipa", image: "https://picsum.photos/200/200?random=12" },

    // Letra E
    { name: "Ed Sheeran", image: "https://picsum.photos/200/200?random=13" },
    { name: "Elton John", image: "https://picsum.photos/200/200?random=14" },
    { name: "Emeli Sandé", image: "https://picsum.photos/200/200?random=15" },

    // Letra F
    {
      name: "Freddie Mercury",
      image: "https://picsum.photos/200/200?random=16",
    },
    { name: "Future", image: "https://picsum.photos/200/200?random=17" },
    {
      name: "Florence Welch",
      image: "https://picsum.photos/200/200?random=18",
    },

    // Letra G
    { name: "Gwen Stefani", image: "https://picsum.photos/200/200?random=19" },
    { name: "Green Day", image: "https://picsum.photos/200/200?random=20" },
    { name: "Galantis", image: "https://picsum.photos/200/200?random=21" },

    // Letra I
    {
      name: "Imagine Dragons",
      image: "https://picsum.photos/200/200?random=22",
    },
    { name: "Iggy Azalea", image: "https://picsum.photos/200/200?random=23" },
    { name: "Iron Maiden", image: "https://picsum.photos/200/200?random=24" },

    // Letra J
    { name: "Justin Bieber", image: "https://picsum.photos/200/200?random=25" },
    {
      name: "Jennifer Lopez",
      image: "https://picsum.photos/200/200?random=26",
    },
    { name: "John Legend", image: "https://picsum.photos/200/200?random=27" },

    // Letra K
    { name: "Katy Perry", image: "https://picsum.photos/200/200?random=28" },
    {
      name: "Kendrick Lamar",
      image: "https://picsum.photos/200/200?random=29",
    },
    { name: "Kesha", image: "https://picsum.photos/200/200?random=30" },

    // Letra L
    { name: "Lorde", image: "https://picsum.photos/200/200?random=31" },
    { name: "Lana Del Rey", image: "https://picsum.photos/200/200?random=32" },
    { name: "Lil Nas X", image: "https://picsum.photos/200/200?random=33" },

    // Letra M
    { name: "Mariah Carey", image: "https://picsum.photos/200/200?random=34" },
    { name: "Miley Cyrus", image: "https://picsum.photos/200/200?random=35" },
    { name: "Maroon 5", image: "https://picsum.photos/200/200?random=36" },

    // Letra N
    { name: "Nicki Minaj", image: "https://picsum.photos/200/200?random=37" },
    { name: "Niall Horan", image: "https://picsum.photos/200/200?random=38" },
    { name: "Ne-Yo", image: "https://picsum.photos/200/200?random=39" },

    // Letra O
    {
      name: "Olivia Rodrigo",
      image: "https://picsum.photos/200/200?random=40",
    },
    { name: "OneRepublic", image: "https://picsum.photos/200/200?random=41" },
    { name: "OutKast", image: "https://picsum.photos/200/200?random=42" },

    // Letra P
    { name: "Post Malone", image: "https://picsum.photos/200/200?random=43" },
    { name: "P!nk", image: "https://picsum.photos/200/200?random=44" },
    {
      name: "Pharrell Williams",
      image: "https://picsum.photos/200/200?random=45",
    },

    // Letra Q
    { name: "Queen", image: "https://picsum.photos/200/200?random=46" },
    { name: "Quavo", image: "https://picsum.photos/200/200?random=47" },
    { name: "Quinn XCII", image: "https://picsum.photos/200/200?random=48" },

    // Letra R
    { name: "Rihanna", image: "https://picsum.photos/200/200?random=49" },
    {
      name: "Red Hot Chili Peppers",
      image: "https://picsum.photos/200/200?random=50",
    },
    { name: "Rod Stewart", image: "https://picsum.photos/200/200?random=51" },

    // Letra S
    { name: "Shakira", image: "https://picsum.photos/200/200?random=52" },
    { name: "Sia", image: "https://picsum.photos/200/200?random=53" },
    { name: "Selena Gomez", image: "https://picsum.photos/200/200?random=54" },

    // Letra T
    { name: "Taylor Swift", image: "https://picsum.photos/200/200?random=55" },
    { name: "The Weeknd", image: "https://picsum.photos/200/200?random=56" },
    { name: "Travis Scott", image: "https://picsum.photos/200/200?random=57" },

    // Letra U
    { name: "Usher", image: "https://picsum.photos/200/200?random=58" },
    { name: "U2", image: "https://picsum.photos/200/200?random=59" },
    { name: "Underoath", image: "https://picsum.photos/200/200?random=60" },

    // Letra W
    { name: "Wiz Khalifa", image: "https://picsum.photos/200/200?random=61" },
    { name: "Wham!", image: "https://picsum.photos/200/200?random=62" },
    {
      name: "The White Stripes",
      image: "https://picsum.photos/200/200?random=63",
    },

    // Letra X - Sin artistas (dejar vacía)

    // Letra Y
    { name: "Yoncé", image: "https://picsum.photos/200/200?random=64" },
    { name: "Yo-Yo Ma", image: "https://picsum.photos/200/200?random=65" },
    { name: "Yungblud", image: "https://picsum.photos/200/200?random=66" },

    // Letra Z
    { name: "Zayn Malik", image: "https://picsum.photos/200/200?random=67" },
    { name: "Zedd", image: "https://picsum.photos/200/200?random=68" },
    {
      name: "Zac Brown Band",
      image: "https://picsum.photos/200/200?random=69",
    },
  ];

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getLetterGroup = (letter) => {
    return filteredArtists.filter(
      (artist) => artist.name[0].toLowerCase() === letter.toLowerCase()
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />
      <SearchBar value={searchText} onChangeText={setSearchText} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {[
          "a",
          "b",
          "c",
          "d",
          "e",
          "f",
          "g",
          "h",
          "i",
          "j",
          "k",
          "l",
          "m",
          "n",
          "o",
          "p",
          "q",
          "r",
          "s",
          "t",
          "u",
          "v",
          "w",
          "x",
          "y",
          "z",
        ].map((letter) => (
          <View key={letter} style={styles.letterGroup}>
            <Text style={styles.letterTitle}>{letter.toUpperCase()}</Text>
            <View style={styles.artistCardsRow}>
              {getLetterGroup(letter).map((artist, index) => (
                <ArtistCard
                  key={index}
                  artistName={artist.name}
                  artistImage={artist.image}
                />
              ))}
            </View>
          </View>
        ))}
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
