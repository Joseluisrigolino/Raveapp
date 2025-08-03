// src/screens/admin/EditArtistScreen.tsx

import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import Header from "@/components/layout/HeaderComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import Footer from "@/components/layout/FooterComponent";
import {
  fetchOneArtistFromApi,
  updateArtistOnApi,
} from "@/utils/artists/artistApi";
import { Artist } from "@/interfaces/Artist";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function EditArtistScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const path = usePathname();
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles];
  const isAdmin = roles.includes("admin");

  const [artist, setArtist] = useState<Artist | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instagramURL, setInstagramURL] = useState("");
  const [spotifyURL, setSpotifyURL] = useState("");
  const [soundcloudURL, setSoundcloudURL] = useState("");
  const [idSocial, setIdSocial] = useState<string | null>(null);
  const [isActivo, setIsActivo] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOneArtistFromApi(id)
      .then(a => {
        setArtist(a);
        setName(a.name);
        setDescription(a.description || "");
        setInstagramURL(a.instagramURL || "");
        setSpotifyURL(a.spotifyURL || "");
        setSoundcloudURL(a.soundcloudURL || "");
        setIdSocial(a.idSocial ?? null);
        setIsActivo(a.isActivo ?? true);
      })
      .catch(() => Alert.alert("Error", "No se pudo cargar el artista."));
  }, [id]);

  const handleUpdate = async () => {
    if (!id || !artist) return;
    try {
      await updateArtistOnApi({
        idArtista: id,
        name,
        description,
        instagramURL,
        spotifyURL,
        soundcloudURL,
        idSocial,
        isActivo,
      });
      Alert.alert("Éxito", "Artista actualizado.");
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        typeof err.response?.data === "string"
          ? err.response.data
          : JSON.stringify(err.response?.data)
      );
    }
  };

  const tabs = [
    {
      label: "Adm Noticias",
      route: "/admin/NewsScreens/ManageNewScreen",
      isActive: path === "/admin/NewsScreens/ManageNewScreen",
      visible: isAdmin,
    },
    {
      label: "Adm Artistas",
      route: "/admin/ArtistScreens/ManageArtistsScreen",
      isActive: path === "/admin/ArtistScreens/ManageArtistsScreen",
      visible: isAdmin,
    },
    {
      label: "Noticias",
      route: "/main/NewsScreens/NewsScreen",
      isActive: path === "/main/NewsScreens/NewsScreen",
      visible: true,
    },
    {
      label: "Artistas",
      route: "/main/ArtistsScreens/ArtistsScreen",
      isActive: path === "/main/ArtistsScreens/ArtistsScreen",
      visible: true,
    },
  ].filter(tab => tab.visible);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <TabMenuComponent tabs={tabs} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Editar Artista</Text>

        {artist?.image ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: artist.image }}
              style={styles.profileImage}
            />
          </View>
        ) : null}

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Instagram URL</Text>
        <TextInput
          style={styles.input}
          value={instagramURL}
          onChangeText={setInstagramURL}
          placeholder="https://instagram.com/..."
        />

        <Text style={styles.label}>Spotify URL</Text>
        <TextInput
          style={styles.input}
          value={spotifyURL}
          onChangeText={setSpotifyURL}
          placeholder="https://open.spotify.com/..."
        />

        <Text style={styles.label}>SoundCloud URL</Text>
        <TextInput
          style={styles.input}
          value={soundcloudURL}
          onChangeText={setSoundcloudURL}
          placeholder="https://soundcloud.com/..."
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Activo</Text>
          <TouchableOpacity
            style={[styles.toggle, isActivo ? styles.on : styles.off]}
            onPress={() => setIsActivo(v => !v)}
          >
            <Text style={styles.toggleText}>
              {isActivo ? "Sí" : "No"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Actualizar</Text>
        </TouchableOpacity>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scroll: {
    padding: 16,
  },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 20,
  },
  imageWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  label: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 10,
    marginTop: 4,
    backgroundColor: COLORS.cardBg,
    fontFamily: FONTS.bodyRegular,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  toggle: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: RADIUS.card,
  },
  on: {
    backgroundColor: COLORS.primary,
  },
  off: {
    backgroundColor: COLORS.negative,
  },
  toggleText: {
    fontFamily: FONTS.bodyRegular,
    color: COLORS.cardBg,
    fontSize: FONT_SIZES.body,
  },
  button: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.cardBg,
  },
});
