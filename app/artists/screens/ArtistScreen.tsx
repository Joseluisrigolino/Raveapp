// src/screens/ArtistsScreens/ArtistScreen.tsx

// Imports principales
import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import {
  fetchOneArtistFromApi,
  toggleArtistFavoriteOnApi,
} from "@/app/artists/apis/artistApi";
import { useAuth } from "@/app/auth/AuthContext";
import { COLORS, FONT_SIZES, FONTS } from "@/styles/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getSafeImageSource } from "@/utils/image";

// Helper simple para formatear fecha (en español)
function formatDateEs(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("es-ES", { month: "long" });
    const cap = month.charAt(0).toUpperCase() + month.slice(1);
    return `${day} ${cap} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

// Helper para abrir links externos
function openLink(raw?: string) {
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
    Alert.alert("Enlace no disponible");
    return;
  }
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  Linking.openURL(url).catch(() => Alert.alert("No se pudo abrir el enlace"));
}

// Lista de redes a mostrar (definida afuera para claridad)
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
  // Obtener id del artista desde params de la ruta
  const { id } = useLocalSearchParams<{ id: string }>();
  // Usuario autenticado
  const { user } = useAuth();
  // Estados básicos
  const [artist, setArtist] = useState<any>(null); // artista cargado
  const [loading, setLoading] = useState(true); // indicador de carga
  const [liked, setLiked] = useState(false); // estado del corazón
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // timer para refetch

  // Efecto para cargar el artista cuando hay id y usuario
  useEffect(() => {
    if (!id || !user) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchOneArtistFromApi(id, user.id);
        if (!data) {
          setArtist(null);
          setLiked(false);
          return;
        }
        setArtist(data);
        setLiked(!!data.isLiked);
      } catch {
        setArtist(null);
        setLiked(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  // Toggle del favorito (like)
  const onToggleLike = async () => {
    if (!user || !artist) return;
    // cambiar corazón local para feedback rápido
    setLiked((prev) => !prev);
    try {
      await toggleArtistFavoriteOnApi(user.id, artist.idArtista);
    } catch (e) {
      // revertir si falla
      setLiked((prev) => !prev);
      Alert.alert("Error", "No se pudo actualizar el favorito");
      return;
    }
    // refrescar datos luego de 1s
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      try {
        const updated = await fetchOneArtistFromApi(id, user.id);
        if (updated) {
          setArtist(updated);
          setLiked(!!updated.isLiked);
        }
      } catch {}
    }, 1000);
  };

  // Early return: cargando
  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  // Early return: artista no encontrado
  if (!artist) {
    return (
      <SafeAreaView style={styles.loader}>
        <Text style={styles.errorText}>Artista no encontrado</Text>
      </SafeAreaView>
    );
  }

  // Avatares de últimos likes (máximo 3)
  const lastLikeImages = Array.isArray(artist.likedByImages)
    ? artist.likedByImages.slice(-3)
    : [];

  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "user"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.content}>
          {/* Título grande del artista */}
          <Text style={styles.titleBig} numberOfLines={2} ellipsizeMode="tail">
            {artist.name}
          </Text>

          {/* Iconos de redes sociales */}
          <View style={styles.socialRow}>
            <View style={styles.socialIconsRow}>
              {SOCIAL_ITEMS.map((s) => {
                const url = artist[s.field];
                const hasUrl = typeof url === "string" && url.trim().length > 0;
                const iconColor = hasUrl ? s.color : COLORS.textSecondary;
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={styles.socialIcon}
                    activeOpacity={hasUrl ? 0.7 : 1}
                    onPress={() =>
                      hasUrl
                        ? openLink(url)
                        : Alert.alert("Enlace no disponible")
                    }
                  >
                    <MaterialCommunityIcons
                      name={s.icon as any}
                      size={22}
                      color={iconColor}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Likes con corazón y mini avatares */}
          <View style={styles.likesRow}>
            <TouchableOpacity
              onPress={onToggleLike}
              style={styles.heartButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>
            <View style={styles.smallAvatars}>
              {lastLikeImages.map((uri: string, i: number) => (
                <Avatar.Image
                  key={`${i}-${uri}`}
                  size={20}
                  source={getSafeImageSource(uri)}
                  style={[
                    styles.smallAvatar,
                    i === 0 ? { marginLeft: -2 } : { marginLeft: -10 },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.likesText} numberOfLines={1}>
              {`A ${new Intl.NumberFormat("es-AR").format(
                typeof artist.likes === "number" ? artist.likes : 0
              )} personas les gusta esto`}
            </Text>
          </View>

          {/* Imagen grande o placeholder */}
          {artist.image ? (
            <Image
              source={getSafeImageSource(artist.image)}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.mainImagePlaceholder}>
              <MaterialCommunityIcons
                name="music"
                size={36}
                color={COLORS.textSecondary}
              />
              <Text style={styles.placeholderText}>Imagen del artista</Text>
            </View>
          )}

          {/* Descripción / Sobre el artista */}
          <Text style={styles.sectionTitle}>Sobre el artista</Text>
          <Text style={styles.description}>{artist.description || ""}</Text>
          <View style={styles.divider} />
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

// Ancho de pantalla usado para alto de imagen
const screenWidth = Dimensions.get("window").width;

// Estilos simples y en inglés, comentarios en español
const styles = StyleSheet.create({
  // contenedor principal
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  // loader centrado
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  // contenido del scroll
  content: { padding: 20 },
  // título principal
  titleBig: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  // fila que centra las redes
  socialRow: { alignItems: "center", marginBottom: 8 },
  // fila de burbujas de redes
  socialIconsRow: { flexDirection: "row", gap: 14 },
  // burbuja individual
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  // fila de likes
  likesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 4,
  },
  // botón para corazón
  heartButton: { padding: 2, marginRight: 2 },
  // contenedor de avatares pequeños
  smallAvatars: { flexDirection: "row" },
  // avatar individual pequeño
  smallAvatar: { borderWidth: 2, borderColor: COLORS.cardBg },
  // texto de likes
  likesText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginLeft: 4,
    flexShrink: 1,
  },
  // imagen principal
  mainImage: {
    width: "100%",
    height: screenWidth > 600 ? 300 : 220,
    borderRadius: 14,
    backgroundColor: COLORS.borderInput,
    marginBottom: 16,
  },
  // placeholder cuando no hay imagen
  mainImagePlaceholder: {
    width: "100%",
    height: screenWidth > 600 ? 300 : 220,
    borderRadius: 14,
    backgroundColor: "#cfd6de",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  // texto del placeholder
  placeholderText: { marginTop: 6, color: COLORS.textSecondary },
  // descripción del artista
  description: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.body * 1.4,
  },
  // título de sección
  sectionTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  // separador visual
  divider: {
    marginTop: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.borderInput,
  },
  // texto de error
  errorText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.negative,
  },
});
