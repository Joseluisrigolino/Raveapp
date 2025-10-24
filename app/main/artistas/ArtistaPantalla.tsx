// src/screens/ArtistsScreens/ArtistScreen.tsx

import React, { useState, useEffect, useRef } from "react";
import { ScrollView, View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { fetchOneArtistFromApi, toggleArtistFavoriteOnApi } from "@/utils/artists/artistApi";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getSafeImageSource } from "@/utils/image";


export default function ArtistaPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Usar helpers del contexto para roles y autenticación
  const { user, isAuthenticated, hasRole } = useAuth();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const likeRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Cambiamos solo el estado del corazón para feedback inmediato
    setIsLiked((prev) => !prev);

    // Ejecutamos el toggle en el backend (sin depender del resultado inmediato)
    try {
      await toggleArtistFavoriteOnApi(user.id, artist.idArtista);
    } catch (e) {
      console.error("Error al marcar favorito:", e);
      // Si falla, revertimos el corazón visual y avisamos
      setIsLiked((prev) => !prev);
      Alert.alert("Error", "No se pudo actualizar el favorito. Probá de nuevo.");
      return;
    }

    // Limpiar timeout previo si existe y agendar un refetch en 1 segundo
    if (likeRefreshTimer.current) clearTimeout(likeRefreshTimer.current);
    likeRefreshTimer.current = setTimeout(async () => {
      try {
        const refreshed = await fetchOneArtistFromApi(id, user.id);
        if (refreshed) {
          setArtist(refreshed);
          // Sincronizamos icono con el backend por si hubo cambios intermedios
          setIsLiked(!!refreshed.isLiked);
        }
      } catch (err) {
        console.warn('No se pudo refrescar likes del artista:', err);
      }
    }, 1000);
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (likeRefreshTimer.current) clearTimeout(likeRefreshTimer.current);
    };
  }, []);

  const openExternal = (raw?: string) => {
    if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
      Alert.alert('Enlace no disponible');
      return;
    }
    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    Linking.openURL(url).catch(() => Alert.alert('No se pudo abrir el enlace'));
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
          {/* Title centered like mock */}
          <Text style={styles.bigTitle} numberOfLines={2} ellipsizeMode="tail">{artist.name}</Text>

          {/* Social icons row - colored if present, grey if empty */}
          <View style={styles.socialRowCentered}>
            {(() => {
              const items: Array<{ key: string; icon: any; url?: string; color: string }> = [
                { key: 'spotify', icon: 'spotify', url: artist.spotifyURL, color: '#1DB954' },
                { key: 'soundcloud', icon: 'soundcloud', url: artist.soundcloudURL, color: '#FF7700' },
                { key: 'instagram', icon: 'instagram', url: artist.instagramURL, color: '#C13584' },
              ];
              return (
                <View style={styles.socialBubblesRow}>
                  {items.map((it) => {
                    const has = typeof it.url === 'string' && it.url.trim().length > 0;
                    const iconColor = has ? it.color : COLORS.textSecondary;
                    return (
                      <TouchableOpacity
                        key={it.key}
                        style={styles.socialBubble}
                        activeOpacity={has ? 0.7 : 1}
                        onPress={() => has ? openExternal(it.url!) : Alert.alert('Enlace no disponible')}
                      >
                        <MaterialCommunityIcons name={it.icon as any} size={22} color={iconColor} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })()}
          </View>

          {/* Likes row with heart, tiny avatars and text */}
          <View style={styles.likesRow}> 
            <TouchableOpacity onPress={toggleLike} activeOpacity={0.7} style={styles.heartWrap}>
              <MaterialCommunityIcons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={isLiked ? COLORS.primary : COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={styles.avatars}>
              {(() => {
                const imgs = Array.isArray(artist.likedByImages) ? artist.likedByImages.slice(-3) : [];
                return imgs.map((uri: string, idx: number) => (
                  <Avatar.Image
                    key={`${idx}-${uri}`}
                    size={20}
                    source={getSafeImageSource(uri)}
                    style={[styles.avatar, idx === 0 ? { marginLeft: -2 } : { marginLeft: -10 }]}
                  />
                ));
              })()}
            </View>
            <Text style={styles.likeText} numberOfLines={1}>
              {(() => {
                const count = Array.isArray(artist.likedByIds) && artist.likedByIds.length > 0
                  ? artist.likedByIds.length
                  : (typeof artist.likes === 'number' ? artist.likes : 0);
                return `A ${new Intl.NumberFormat('es-AR').format(count)} personas les gusta esto`;
              })()}
            </Text>
          </View>

          {/* Big rectangular artist image with placeholder */}
          {artist.image ? (
            <Image source={getSafeImageSource(artist.image)} style={styles.bigImage} resizeMode="cover" />
          ) : (
            <View style={styles.bigImagePlaceholder}>
              <MaterialCommunityIcons name="music" size={36} color={COLORS.textSecondary} />
              <Text style={styles.placeholderText}>Imagen del artista</Text>
            </View>
          )}

          {/* About section */}
          <Text style={styles.sectionTitle}>Sobre el artista</Text>
          <Text style={styles.description}>
            {artist.description || ''}
          </Text>
          <View style={styles.divider} />
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const screenWidth = Dimensions.get("window").width;

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
  bigTitle: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  socialRowCentered: { alignItems: 'center', marginBottom: 8 },
  socialBubblesRow: { flexDirection: 'row', gap: 14 },
  socialBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textDecorationLine: "none",
  },
  likesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 4 },
  heartWrap: { padding: 2, marginRight: 2 },
  avatars: { flexDirection: 'row' },
  avatar: { borderWidth: 2, borderColor: COLORS.cardBg },
  likeText: { fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.body, color: COLORS.textPrimary, marginLeft: 4, flexShrink: 1 },
  bigImage: {
    width: '100%',
    height: screenWidth > 600 ? 300 : 220,
    borderRadius: 14,
    backgroundColor: COLORS.borderInput,
    marginBottom: 16,
  },
  bigImagePlaceholder: {
    width: '100%',
    height: screenWidth > 600 ? 300 : 220,
    borderRadius: 14,
    backgroundColor: '#cfd6de',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderText: { marginTop: 6, color: COLORS.textSecondary },
  description: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.body * 1.4,
  },
  sectionTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  divider: {
    marginTop: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.borderInput,
  },
  errorText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.negative,
  },
});
