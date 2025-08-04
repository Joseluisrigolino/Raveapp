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
} from "react-native";
import { IconButton, Avatar } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { Artist } from "@/interfaces/Artist";
import {
  fetchOneArtistFromApi,
  fetchAllArtistMedia,
  fetchLikedImageIds,
} from "@/utils/artists/artistApi";
import { apiClient } from "@/utils/apiConfig";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [artist,   setArtist]   = useState<Artist|null>(null);
  const [allMedia, setAllMedia] = useState<{ idMedia: string; uri: string }[]>([]);
  const [likesMedia, setLikesMedia] = useState<{ idMedia: string; uri: string }[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [isLiked,  setIsLiked]  = useState(false);
  const [likeCount,setLikeCount]= useState(0);

  const baseURL = apiClient.defaults.baseURL;
  const screenWidth = Dimensions.get("window").width;
  const IMAGE_SIZE  = 250;

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        // 1) datos del artista
        const data = await fetchOneArtistFromApi(id);
        setArtist(data);

        // 2) todas las medias
        const mediaArr = await fetchAllArtistMedia(id);
        const mappedAll = mediaArr.map(m => {
          const raw = m.url ?? m.imagen ?? "";
          const uri = raw.startsWith("http") ? raw : `${baseURL}${raw}`;
          return { idMedia: m.idMedia, uri };
        });
        setAllMedia(mappedAll);

        // 3) likes
        const likedIds = await fetchLikedImageIds(id);
        setLikeCount(likedIds.length);
        // machear IDs con el array completo
        const mappedLikes = mappedAll.filter(m => likedIds.includes(m.idMedia));
        setLikesMedia(mappedLikes);

      } catch (err) {
        console.error("Error en ArtistScreen:", err);
      } finally {
        setLoading(false);
      }
    })();
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

  return (
    <ProtectedRoute allowedRoles={["admin","owner","user"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.content}>
          {/* Cabecera: nombre + redes */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{artist.name}</Text>
            <View style={styles.socialRow}>
              <IconButton
                icon="spotify"   size={24}
                iconColor={artist.spotifyURL?"#1DB954":COLORS.textSecondary}
                onPress={() => artist.spotifyURL && Linking.openURL(artist.spotifyURL)}
                disabled={!artist.spotifyURL}
              />
              <IconButton
                icon="soundcloud" size={24}
                iconColor={artist.soundcloudURL?"#FF5500":COLORS.textSecondary}
                onPress={() => artist.soundcloudURL&&Linking.openURL(artist.soundcloudURL)}
                disabled={!artist.soundcloudURL}
              />
              <IconButton
                icon="instagram" size={24}
                iconColor={artist.instagramURL?"#C13584":COLORS.textSecondary}
                onPress={() => artist.instagramURL&&Linking.openURL(artist.instagramURL)}
                disabled={!artist.instagramURL}
              />
            </View>
          </View>

          {/* Likes + Avatares superpuestos */}
          <View style={styles.likesRow}>
            <TouchableOpacity onPress={toggleLike}>
              <IconButton
                icon={isLiked?"heart":"heart-outline"}
                size={28}
                iconColor={isLiked?COLORS.negative:COLORS.textPrimary}
              />
            </TouchableOpacity>
            <View style={styles.avatars}>
              {likesMedia.map((m,idx) => (
                <Avatar.Image
                  key={m.idMedia}
                  source={{ uri: m.uri }}
                  size={32}
                  style={[styles.avatar, { marginLeft: idx===0?0:-12 }]}
                />
              ))}
            </View>
            <Text style={[styles.likeText, { marginLeft: likesMedia.length?8:0 }]}>
              A {likeCount} persona{likeCount!==1?"s":""} le gusta esto
            </Text>
          </View>

          {/* Galería completa */}
          <View style={styles.mediaContainer}>
            {allMedia.length>0
              ? allMedia.map(m => (
                  <Image
                    key={m.idMedia}
                    source={{ uri: m.uri }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                ))
              : (
                  <Image
                    source={{ uri: artist.image }}
                    style={{
                      width: IMAGE_SIZE, height: IMAGE_SIZE,
                      borderRadius: IMAGE_SIZE/2,
                      alignSelf:"center", marginBottom:screenWidth>600?0:16
                    }}
                  />
                )
            }
          </View>

          {/* Biografía */}
          <Text style={styles.description}>{artist.description}</Text>
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const screenWidth = Dimensions.get("window").width;
const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor: COLORS.backgroundLight },
  loaderContainer: { flex:1,justifyContent:"center",alignItems:"center" },
  content:         { padding:20 },
  headerRow:       {
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
    marginBottom:12
  },
  title:           {
    fontFamily:        FONTS.titleBold,
    fontSize:          FONT_SIZES.titleMain,
    color:             COLORS.textPrimary,
    textDecorationLine:"underline"
  },
  socialRow:       { flexDirection:"row" },
  likesRow:        { flexDirection:"row",alignItems:"center",marginBottom:20 },
  avatars:         { flexDirection:"row", marginLeft:8 },
  avatar:          { borderWidth:2, borderRadius:16, borderColor:COLORS.cardBg },
  likeText:        {
    fontFamily:FONTS.bodyRegular,
    fontSize:  FONT_SIZES.body,
    color:     COLORS.textPrimary
  },
  mediaContainer:  {
    flexDirection:"row",
    flexWrap:"wrap",
    justifyContent:"center",
    marginBottom:20
  },
  mediaImage:      {
    width: screenWidth>600?140:120,
    height:screenWidth>600?140:120,
    borderRadius:RADIUS.sm,
    margin:6
  },
  description:     {
    fontFamily:FONTS.bodyRegular,
    fontSize:  FONT_SIZES.body,
    color:     COLORS.textPrimary,
    lineHeight:FONT_SIZES.body*1.4
  },
  errorText:       {
    fontFamily:FONTS.bodyRegular,
    fontSize:  FONT_SIZES.body,
    color:     COLORS.negative
  }
});
