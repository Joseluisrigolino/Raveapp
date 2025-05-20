// src/screens/ArtistsScreens/ArtistScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  View,
  ActivityIndicator,
  Linking,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { Artist } from "@/interfaces/Artist";
// IMPORTAR DESDE la carpeta correcta "artists"
import { fetchOneArtistFromApi } from "@/utils/artists/artistApi";

import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (!id) {
      setError("Falta el ID del artista.");
      setLoading(false);
      return;
    }

    fetchOneArtistFromApi(id)
      .then((data) => {
        setArtist(data);
        setLikeCount(data.likes ?? 0);
      })
      .catch((err) => {
        console.error("Error fetching artist:", err);
        setError(err.message || "Artista no encontrado.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.contentWrapper}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  if (!artist) return null;

  const handleSpotifyPress = () => {
    if (artist.spotifyURL) Linking.openURL(artist.spotifyURL);
  };
  const handleInstagramPress = () => {
    if (artist.instagramURL) Linking.openURL(artist.instagramURL);
  };
  const handleSoundcloudPress = () => {
    if (artist.soundcloudURL) Linking.openURL(artist.soundcloudURL);
  };
  const handleFavoritesPress = () => {
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => prev + (isLiked ? -1 : 1));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <Text style={styles.artistTitle}>{artist.name}</Text>
            <View style={styles.iconsRow}>
              {/* Mostrar siempre los iconos, deshabilitados si no hay URL */}
              <IconButton
                icon="spotify"
                size={24}
                iconColor={COLORS.textPrimary}
                onPress={handleSpotifyPress}
                disabled={!artist.spotifyURL}
                style={styles.icon}
              />
              <IconButton
                icon="instagram"
                size={24}
                iconColor={COLORS.textPrimary}
                onPress={handleInstagramPress}
                disabled={!artist.instagramURL}
                style={styles.icon}
              />
              <IconButton
                icon="soundcloud"
                size={24}
                iconColor={COLORS.textPrimary}
                onPress={handleSoundcloudPress}
                disabled={!artist.soundcloudURL}
                style={styles.icon}
              />
              <IconButton
                icon={isLiked ? "heart" : "heart-outline"}
                size={24}
                iconColor={isLiked ? COLORS.negative : COLORS.textPrimary}
                onPress={handleFavoritesPress}
                style={styles.icon}
              />
            </View>
          </View>

          <Image
            source={{
              uri: artist.image || "https://picsum.photos/200/200?random=999",
            }}
            style={styles.artistImage}
          />

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
    backgroundColor: COLORS.backgroundLight,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
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
    borderRadius: RADIUS.round,
    alignSelf: "center",
    marginBottom: 10,
  },
  likesText: {
    textAlign: "center",
    marginTop: 5,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  description: {
    textAlign: "center",
    marginTop: 10,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  errorText: {
    textAlign: "center",
    marginTop: 50,
    color: COLORS.error,
    fontSize: FONT_SIZES.body,
  },
});