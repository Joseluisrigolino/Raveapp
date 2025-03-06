// app/main/ArtistScreen.tsx
import React, { useState, useEffect } from "react";
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
// Si usas Expo Router v2:
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import { Artist } from "@/interfaces/Artist";
import { getArtistByName } from "@/utils/artistHelpers";

export default function ArtistScreen() {
  // 1. Leer param "name" con useLocalSearchParams (versión v2).
  // Si tu versión es v1, esta función no existe.
  const { name } = useLocalSearchParams<{ name?: string }>();

  // 2. Estado local
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);

  // 3. useEffect para buscar el artista cuando cambie `name`
  useEffect(() => {
    if (name) {
      const found = getArtistByName(name);
      if (found) {
        setArtist(found);
        // Iniciamos el likeCount con found.likes, si existe
        setLikeCount(found.likes ?? 0);
      } else {
        setArtist(null);
      }
    }
  }, [name]);

  // 4. Si no se encontró, mostrar mensaje
  if (!artist) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.contentWrapper}>
          <Text style={{ textAlign: "center", marginTop: 50 }}>
            Artista no encontrado.
          </Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  // 5. Renderizar la info del artista
  const handleSpotifyPress = () => {
    Linking.openURL("https://www.spotify.com");
  };
  const handleInstagramPress = () => {
    Linking.openURL("https://www.instagram.com");
  };
  const handleFavoritesPress = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <Text style={styles.artistTitle}>{artist.name}</Text>
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
                icon={isLiked ? "heart" : "heart-outline"}
                size={24}
                iconColor={isLiked ? "red" : "#000"}
                onPress={handleFavoritesPress}
                style={styles.icon}
              />
            </View>
          </View>

          <Image source={{ uri: artist.image }} style={styles.artistImage} />

          <Text style={styles.likesText}>{likeCount} bombers les gusta</Text>

          {artist.description && (
            <Text style={styles.description}>{artist.description}</Text>
          )}
        </ScrollView>
      </View>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentWrapper: { flex: 1 },
  scrollContent: { padding: 20 },
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
