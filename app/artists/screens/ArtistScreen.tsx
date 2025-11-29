// Pantalla de detalle de un artista: nombre, redes, foto, likes y descripción.

import React, { useEffect } from "react"; // React + useEffect para sincronizar likes
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native"; // Componentes base de React Native
import { SafeAreaView } from "react-native-safe-area-context"; // Respeta las safe areas de cada dispositivo
import { useLocalSearchParams } from "expo-router"; // Para leer parámetros de la ruta (id del artista)

import ProtectedRoute from "@/app/auth/ProtectedRoute"; // Protege la pantalla por roles
import Header from "@/components/layout/HeaderComponent"; // Header principal de la app
import Footer from "@/components/layout/FooterComponent"; // Footer común
import { useAuth } from "@/app/auth/AuthContext"; // Contexto de autenticación (user, roles, etc.)

import { COLORS } from "@/styles/globalStyles"; // Colores globales de la app

import useGetArtistById from "@/app/artists/services/useGetArtistById"; // Hook que trae un artista por id
import useLikeArtist from "@/app/artists/services/useLikeArtist"; // Hook que encapsula la lógica de like

import SocialArtist from "@/app/artists/components/artist/artist-profile/ArtistProfileSocialsComponent"; // Botones de redes
import ArtistName from "@/app/artists/components/artist/artist-profile/ArtistProfileNameComponent"; // Título con el nombre
import Subtitle from "@/app/artists/components/artist/artist-profile/ArtistProfileSubtitleComponent"; // Subtítulo simple
import Description from "@/app/artists/components/artist/artist-profile/ArtistProfileDescriptionComponent"; // Texto descriptivo
import ArtistProfileImage from "@/app/artists/components/artist/artist-profile/ArtistProfileImageComponent"; // Imagen de perfil
import ArtistProfileLikes from "@/app/artists/components/artist/artist-profile/ArtistProfileLikesComponent"; // Corazón + contadores de likes

// Config de las redes sociales que se muestran en el perfil.
// field indica qué propiedad se lee del artista (spotifyURL, soundcloudURL, instagramURL).
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
] as const;

// Componente principal de la pantalla de perfil de artista
export default function ArtistScreen() {
  // Leemos el id del artista desde los parámetros de la ruta
  const { id } = useLocalSearchParams<{ id: string }>();

  // Usuario autenticado (para saber quién da like)
  const { user } = useAuth();

  // Trae los datos del artista desde la API usando el id
  const {
    data: artistData,
    isLoading,
    refresh,
  } = useGetArtistById(id as string, user?.id);

  // Hook que encapsula el estado de "me gusta" y la acción de toggle
  const { isLiked, setIsLiked, toggleLike } = useLikeArtist();

  // Cada vez que cambia artistData, sincronizamos el estado local de isLiked
  useEffect(() => {
    if (artistData) {
      setIsLiked(!!artistData.isLiked);
    } else {
      setIsLiked(false);
    }
  }, [artistData, setIsLiked]);

  // Handler para dar/quitar like al artista
  const handleToggleLike = async () => {
    // Si no hay usuario autenticado o artista cargado, no hacemos nada
    if (!user || !artistData) return;

    // Delegamos la lógica de like al hook
    await toggleLike(user.id, artistData.idArtista);

    // Volvemos a pedir los datos del artista para reflejar el nuevo conteo de likes
    await refresh();
  };

  // Estado de carga: mientras se trae el artista, mostramos solo el loader
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  // Si no se encontró el artista, mostramos un mensaje simple
  if (!artistData) {
    return (
      <SafeAreaView style={styles.loader}>
        <Text style={styles.errorText}>Artista no encontrado</Text>
      </SafeAreaView>
    );
  }

  // Tomamos las últimas imágenes de usuarios que dieron like (máximo 3)
  const recentLikes = Array.isArray(artistData.likedByImages)
    ? artistData.likedByImages.slice(-3)
    : [];

  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "user"]}>
      <SafeAreaView style={styles.container}>
        {/* Header común de la app */}
        <Header />

        {/* Contenido scrolleable del perfil */}
        <ScrollView contentContainerStyle={styles.content}>
          {/* Nombre del artista */}
          <ArtistName name={artistData.name} />

          {/* Redes sociales del artista */}
          <View style={styles.socialRow}>
            <View style={styles.socialIconsRow}>
              {SOCIAL_ITEMS.map((social) => (
                <SocialArtist
                  key={social.key}
                  item={social}
                  // Cada item sabe qué campo del artista leer (spotifyURL, etc.)
                  url={artistData[social.field as keyof typeof artistData]}
                />
              ))}
            </View>
          </View>

          {/* Likes: corazón + contador + últimos usuarios que dieron like */}
          <ArtistProfileLikes
            isLiked={isLiked}
            onToggle={handleToggleLike}
            recentLikes={recentLikes}
            likesCount={artistData.likes}
          />

          {/* Imagen principal del artista (o placeholder si no hay) */}
          <ArtistProfileImage image={artistData.image} />

          {/* Descripción "Sobre el artista" */}
          <Subtitle text="Sobre el artista" />
          <Description text={artistData.description || ""} />

          {/* Separador visual al final del contenido */}
          <View style={styles.divider} />
        </ScrollView>

        {/* Footer común de la app */}
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

// Estilos locales específicos de esta pantalla
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  socialRow: {
    alignItems: "center",
    marginBottom: 8,
  },
  socialIconsRow: {
    flexDirection: "row",
    gap: 14,
  },
  divider: {
    marginTop: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.borderInput,
  },
  errorText: {
    color: COLORS.negative,
  },
});
