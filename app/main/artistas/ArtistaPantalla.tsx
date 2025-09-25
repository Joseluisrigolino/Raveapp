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
  Dimensions,
  Linking,
} from "react-native";
import { IconButton, Avatar } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { fetchOneArtistFromApi, toggleArtistFavoriteOnApi } from "@/utils/artists/artistApi";
import NameArtistComponent from "@/components/artists/NameArtistComponent";
import SocialsComponent from "@/components/artists/SocialsComponent";
import LikesArtistComponent from "@/components/artists/LikesArtistComponent";
import ImageArtistComponent from "@/components/artists/ImageArtistComponent";
import DescriptionArtistComponent from "@/components/artists/DescriptionArtistComponent";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";


export default function ArtistaPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!id || !user) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const data = await fetchOneArtistFromApi(id, user.id);
        if (!data) {
          setArtist(null);
          setIsLiked(false);
          return;
        }
        setArtist(data);
        setIsLiked(!!data.isLiked);
      } catch (err) {
        setArtist(null);
        setIsLiked(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  const toggleLike = async () => {
    if (!user || !artist) return;
    try {
      const updated = await toggleArtistFavoriteOnApi(user.id, artist.idArtista);
      if (updated) {
        setArtist(updated);
        setIsLiked(!!updated.isLiked);
      } else {
        // Fallback: re-fetch
        const refreshed = await fetchOneArtistFromApi(id, user.id);
        setArtist(refreshed);
        setIsLiked(!!refreshed.isLiked);
      }
    } catch (e) {
      // Podrías mostrar un error si falla
    }
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

  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "user"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <NameArtistComponent name={artist.name} />
            <SocialsComponent
              instagramURL={artist.instagramURL}
              spotifyURL={artist.spotifyURL}
              soundcloudURL={artist.soundcloudURL}
            />
          </View>

          <LikesArtistComponent
            idArtista={artist.idArtista}
            currentUserId={user?.id}
            likedByImages={artist.likedByImages}
            likedByIds={artist.likedByIds}
            isLiked={isLiked}
            onToggleLike={toggleLike}
            avatarMarginLeft={-4}
          />

          <ImageArtistComponent image={artist.image} />

          <DescriptionArtistComponent description={artist.description} />
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const screenWidth = Dimensions.get("window").width;
const IMG_SIZE = screenWidth > 600 ? 250 : 200;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20 },
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
  socialRow: { flexDirection: "row" },
  likesRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatars: { flexDirection: "row", marginLeft: 8 },
  avatar: { borderWidth: 2, borderColor: COLORS.cardBg },
  likeText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  image: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: IMG_SIZE / 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  description: {
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
