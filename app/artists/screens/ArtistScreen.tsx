// src/screens/ArtistsScreens/ArtistScreen.tsx

// Imports principales
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Avatar moved to component files
import { useLocalSearchParams } from "expo-router";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import useLikeArtist from "@/app/artists/services/useLikeArtist";
import { useAuth } from "@/app/auth/AuthContext";
import { COLORS } from "@/styles/globalStyles";
import useGetArtistById from "@/app/artists/services/useGetArtistById";
import SocialArtist from "@/app/artists/components/artist/artist-profile/ArtistProfileSocialsComponent";
import ArtistName from "@/app/artists/components/artist/artist-profile/ArtistProfileNameComponent";
import Subtitle from "@/app/artists/components/artist/artist-profile/ArtistProfileSubtitleComponent";
import Description from "@/app/artists/components/artist/artist-profile/ArtistProfileDescriptionComponent";
import ArtistProfileImage from "@/app/artists/components/artist/artist-profile/ArtistProfileImageComponent";
import ArtistProfileLikes from "@/app/artists/components/artist/artist-profile/ArtistProfileLikesComponent";

// Nota: la apertura de enlaces la manejan los componentes sociales individuales

// Lista simple de redes sociales (los campos del artista vienen desde la API)
const SOCIAL_ITEMS = [
  { key: "spotify", icon: "spotify", color: "#1DB954", field: "spotifyURL" },
  {
    key: "soundcloud",
    icon: "soundcloud",
    color: "#FF7700",
    field: "soundcloudURL",
  },
  {
    key: "instagram",
    icon: "instagram",
    color: "#C13584",
    field: "instagramURL",
  },
];

// Componente principal de la pantalla del artista
export default function ArtistScreen() {
  // id del artista desde la ruta
  const { id } = useLocalSearchParams<{ id: string }>();
  // usuario autenticado
  const { user } = useAuth();

  // estados sencillos
  const {
    data: artistData,
    isLoading,
    error,
    refresh,
  } = useGetArtistById(id as string, user?.id);
  const { isLiked, setIsLiked, toggleLike } = useLikeArtist();
  // sincronizar isLiked cuando cambia el artista traído por el hook
  useEffect(() => {
    if (artistData) setIsLiked(!!artistData.isLiked);
    else setIsLiked(false);
  }, [artistData, setIsLiked]);

  // cambiar favorito: delega en el hook y actualiza artistData si hay refresh
  const handleToggleLike = async () => {
    if (!user || !artistData) return;
    await toggleLike(user.id, artistData.idArtista);
    await refresh();
  };

  // mientras carga
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  // si no existe artista
  if (!artistData) {
    return (
      <SafeAreaView style={styles.loader}>
        <Text style={styles.errorText}>Artista no encontrado</Text>
      </SafeAreaView>
    );
  }

  // últimas imágenes de likes (máx 3)
  const recentLikes = Array.isArray(artistData.likedByImages)
    ? artistData.likedByImages.slice(-3)
    : [];

  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "user"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.content}>
          {/* título */}
          <ArtistName name={artistData.name} />

          {/* redes sociales */}
          <View style={styles.socialRow}>
            <View style={styles.socialIconsRow}>
              {SOCIAL_ITEMS.map((s) => (
                <SocialArtist key={s.key} item={s} url={artistData[s.field]} />
              ))}
            </View>
          </View>

          {/* likes y avatars */}
          <ArtistProfileLikes
            isLiked={isLiked}
            onToggle={handleToggleLike}
            recentLikes={recentLikes}
            likesCount={artistData.likes}
          />

          {/* imagen principal o placeholder */}
          <ArtistProfileImage image={artistData.image} />

          {/* descripción */}
          <Subtitle text={"Sobre el artista"} />
          <Description text={artistData.description || ""} />

          <View style={styles.divider} />
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

// Estilos limpios para esta pantalla (solo lo usado aquí)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20 },
  socialRow: { alignItems: "center", marginBottom: 8 },
  socialIconsRow: { flexDirection: "row", gap: 14 },
  divider: {
    marginTop: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.borderInput,
  },
  errorText: { color: COLORS.negative },
});
