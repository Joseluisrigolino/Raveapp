// src/screens/ArtistsScreens/ArtistScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Dimensions,
} from "react-native";
import { IconButton, Avatar } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { Artist } from "@/interfaces/Artist";
import { fetchOneArtistFromApi } from "@/utils/artists/artistApi";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (!id) return setLoading(false);
    fetchOneArtistFromApi(id)
      .then((data) => {
        setArtist(data);
        setLikeCount(data.likes ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const toggleLike = () => {
    setIsLiked(v => !v);
    setLikeCount(c => c + (isLiked ? -1 : 1));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }
  if (!artist) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorText}>Artista no encontrado.</Text>
      </SafeAreaView>
    );
  }

  const avatarUrls = Array.from({ length: Math.min(likeCount, 5) })
    .map((_, i) => `https://i.pravatar.cc/150?img=${i + 10}`);

  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "user"]}>
      <SafeAreaView style={styles.container}>
        <Header />

        <ScrollView contentContainerStyle={styles.content}>
          {/* Título + iconos */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{artist.name}</Text>
            <View style={styles.socialRow}>
              <IconButton
                icon="spotify"
                size={24}
                iconColor={artist.spotifyURL ? "#1DB954" : COLORS.textSecondary}
                onPress={() => artist.spotifyURL && Linking.openURL(artist.spotifyURL)}
                disabled={!artist.spotifyURL}
              />
              <IconButton
                icon="soundcloud"
                size={24}
                iconColor={artist.soundcloudURL ? "#FF5500" : COLORS.textSecondary}
                onPress={() => artist.soundcloudURL && Linking.openURL(artist.soundcloudURL)}
                disabled={!artist.soundcloudURL}
              />
              <IconButton
                icon="instagram"
                size={24}
                iconColor={artist.instagramURL ? "#C13584" : COLORS.textSecondary}
                onPress={() => artist.instagramURL && Linking.openURL(artist.instagramURL)}
                disabled={!artist.instagramURL}
              />
            </View>
          </View>

          {/* Likes */}
          <View style={styles.likesRow}>
            <TouchableOpacity onPress={toggleLike}>
              <IconButton
                icon={isLiked ? "heart" : "heart-outline"}
                size={28}
                iconColor={isLiked ? COLORS.negative : COLORS.textPrimary}
              />
            </TouchableOpacity>

            <View style={styles.avatars}>
              {avatarUrls.map((uri, idx) => (
                <Avatar.Image
                  key={idx}
                  source={{ uri }}
                  size={32}
                  style={[styles.avatar, { marginLeft: idx === 0 ? 0 : -12 }]}
                />
              ))}
            </View>

            <Text style={[styles.likeText, { marginLeft: avatarUrls.length > 0 ? 8 : 0 }]}>
              A {likeCount} persona{likeCount !== 1 ? "s" : ""} le gusta esto
            </Text>
          </View>

          {/* Imagen + descripción */}
          <View style={styles.mainRow}>
            <Image
              source={{ uri: artist.image || "https://picsum.photos/200/200" }}
              style={styles.image}
            />
            <Text style={styles.description}>{artist.description}</Text>
          </View>

        </ScrollView>

        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const screenWidth = Dimensions.get("window").width;
const IMAGE_SIZE = 200;

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
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textDecorationLine: "underline",
  },
  socialRow: {
    flexDirection: "row",
  },
  likesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatars: {
    flexDirection: "row",
    marginLeft: 8,
  },
  avatar: {
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  likeText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  mainRow: {
    flexDirection: screenWidth > 600 ? "row" : "column",
    alignItems: screenWidth > 600 ? "flex-start" : "center",
    justifyContent: "space-between",
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    alignSelf: "center",
    marginBottom: screenWidth > 600 ? 0 : 16,
    marginRight: screenWidth > 600 ? 20 : 0,
  },
  description: {
    flex: 1,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.body * 1.4,
  },
  errorText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.negative,
  },
});
