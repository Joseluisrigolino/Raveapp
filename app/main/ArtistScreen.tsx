// screens/ArtistScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  View,
  Linking,
} from "react-native";
import { IconButton } from "react-native-paper";
import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import { Artist } from "@/interfaces/Artist";

// Datos de ejemplo. En un caso real vendrían por props o route.params
const mockArtist: Artist = {
  name: "A-Trak",
  image: "https://picsum.photos/400/400?random=1",
  likes: 294,
  description:
    "A-Trak es uno de los DJs más innovadores y emocionantes de la escena actual...",
};

export default function ArtistScreen() {
  // Extraemos la info del artista
  const { name, image, description } = mockArtist;

  // Estado local para manejar likes e isLiked
  // Iniciamos 'likes' con el valor en mockArtist (294), si existe
  const [likes, setLikes] = useState<number>(mockArtist.likes ?? 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  const handleSpotifyPress = () => {
    Linking.openURL("https://www.spotify.com");
  };

  const handleInstagramPress = () => {
    Linking.openURL("https://www.instagram.com");
  };

  const handleFavoritesPress = () => {
    if (isLiked) {
      // Si ya está en like, al presionar se quita el like
      setIsLiked(false);
      setLikes((prev) => prev - 1);
    } else {
      // Si no está en like, al presionar se pone el like
      setIsLiked(true);
      setLikes((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <Text style={styles.artistTitle}>{name}</Text>
            <View style={styles.iconsRow}>
              <IconButton
                icon="spotify"
                size={24}
                iconColor="#000"
                onPress={handleSpotifyPress}
                style={styles.icon}
              />
              <IconButton
                icon="instagram"
                size={24}
                iconColor="#000"
                onPress={handleInstagramPress}
                style={styles.icon}
              />
              <IconButton
                // Cambia el icono según isLiked
                icon={isLiked ? "heart" : "heart-outline"}
                size={24}
                // Cambia el color según isLiked
                iconColor={isLiked ? "red" : "#000"}
                onPress={handleFavoritesPress}
                style={styles.icon}
              />
            </View>
          </View>

          <Image source={{ uri: image }} style={styles.artistImage} />

          {/* Muestra la cantidad de "bombers les gusta" */}
          <Text style={styles.likesText}>{likes} bombers les gusta</Text>

          {description && <Text style={styles.description}>{description}</Text>}
        </ScrollView>
      </View>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  artistTitle: {
    fontSize: 24,
    fontWeight: "bold",
    maxWidth: "70%",
  },
  iconsRow: {
    flexDirection: "row",
  },
  icon: {
    marginLeft: 5,
  },
  artistImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignSelf: "center",
    marginBottom: 10,
  },
  likesText: {
    textAlign: "center",
    marginTop: 5,
    fontSize: 16,
    color: "#333",
  },
  description: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
  },
});
