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
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { Artist } from "@/interfaces/Artist";
import { getArtistByName } from "@/utils/artists/artistHelpers";

// Importa tus estilos globales
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function ArtistScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);

  useEffect(() => {
    if (name) {
      const found = getArtistByName(name);
      if (found) {
        setArtist(found);
        setLikeCount(found.likes ?? 0);
      } else {
        setArtist(null);
      }
    }
  }, [name]);

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
                iconColor={COLORS.textPrimary}
                onPress={handleSpotifyPress}
                style={styles.icon}
              />
              <IconButton
                icon="instagram"
                size={24}
                iconColor={COLORS.textPrimary}
                onPress={handleInstagramPress}
                style={styles.icon}
              />
              <IconButton
                icon={isLiked ? "heart" : "heart-outline"}
                size={24}
                // Rojo si liked, gris oscuro si no
                iconColor={isLiked ? COLORS.negative : COLORS.textPrimary}
                onPress={handleFavoritesPress}
                style={styles.icon}
              />
            </View>
          </View>

          <Image source={{ uri: artist.image }} style={styles.artistImage} />

          <Text style={styles.likesText}>{likeCount} usuarios les gusta</Text>

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
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight, // Fondo claro principal
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
    fontSize: FONT_SIZES.titleMain,       // Ej. 22-24 px
    color: COLORS.textPrimary,            // Gris oscuro
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
    borderRadius: 100, // redondo
    alignSelf: "center",
    marginBottom: 10,
  },
  likesText: {
    textAlign: "center",
    marginTop: 5,
    fontSize: FONT_SIZES.body,   // 14-16 px
    color: COLORS.textPrimary,
  },
  description: {
    textAlign: "center",
    marginTop: 10,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
});
