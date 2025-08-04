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
import { fetchOneArtistFromApi } from "@/utils/artists/artistApi";
import { mediaApi } from "@/utils/mediaApi";
import { apiClient } from "@/utils/apiConfig";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [avatarUris, setAvatarUris] = useState<string[]>([]);

  const baseURL = apiClient.defaults.baseURL;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        // 1) Datos del artista + isFavorito
        const data = await fetchOneArtistFromApi(id, user?.idUsuario);
        setArtist(data);
        setLikeCount(data.likes);
        setIsLiked(data.isFavorito);

        // 2) IDs de usuarios que dieron like
        const resp = await apiClient.get<string[]>(
          "/v1/Artista/GetImgLikesArtista",
          { params: { id } }
        );
        const likeIds = Array.isArray(resp.data) ? resp.data : [];

        // 3) Para cada userId, obtenemos su media (primera imagen)
        const uris = await Promise.all(
          likeIds.map(async (userId) => {
            try {
              const raw = (await mediaApi.getByEntidad(userId)) as any;
              const arr = Array.isArray(raw.media) ? raw.media : [];
              const m = arr[0];
              let ruta = m?.url ?? m?.imagen ?? "";
              if (ruta && !/^https?:\/\//.test(ruta)) {
                ruta = `${baseURL}${ruta.startsWith("/") ? "" : "/"}${ruta}`;
              }
              return ruta || "";
            } catch {
              return "";
            }
          })
        );
        // filtramos uris válidas
        setAvatarUris(uris.filter((u) => u));
      } catch (err) {
        console.error("Error en ArtistScreen:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  const toggleLike = () => {
    // aquí podrías llamar a tu endpoint de like/unlike
    setIsLiked((v) => !v);
    setLikeCount((c) => c + (isLiked ? -1 : 1));
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
          {/* Título + redes */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{artist.name}</Text>
            <View style={styles.socialRow}>
              <IconButton
                icon="spotify"
                size={24}
                iconColor={artist.spotifyURL ? "#1DB954" : COLORS.textSecondary}
                onPress={() =>
                  artist.spotifyURL && Linking.openURL(artist.spotifyURL)
                }
                disabled={!artist.spotifyURL}
              />
              <IconButton
                icon="soundcloud"
                size={24}
                iconColor={
                  artist.soundcloudURL ? "#FF5500" : COLORS.textSecondary
                }
                onPress={() =>
                  artist.soundcloudURL && Linking.openURL(artist.soundcloudURL)
                }
                disabled={!artist.soundcloudURL}
              />
              <IconButton
                icon="instagram"
                size={24}
                iconColor={
                  artist.instagramURL ? "#C13584" : COLORS.textSecondary
                }
                onPress={() =>
                  artist.instagramURL && Linking.openURL(artist.instagramURL)
                }
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
              {avatarUris.map((uri, idx) => (
                <Avatar.Image
                  key={uri + idx}
                  source={{ uri }}
                  size={32}
                  style={[styles.avatar, { marginLeft: idx === 0 ? 0 : -12 }]}
                />
              ))}
            </View>
            <Text
              style={[
                styles.likeText,
                { marginLeft: avatarUris.length ? 8 : 0 },
              ]}
            >
              A {likeCount} persona{likeCount !== 1 ? "s" : ""} le gusta esto
            </Text>
          </View>

          {/* Imagen redondeada del artista */}
          <Image
            source={{ uri: artist.image }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Descripción */}
          <Text style={styles.description}>{artist.description}</Text>
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
