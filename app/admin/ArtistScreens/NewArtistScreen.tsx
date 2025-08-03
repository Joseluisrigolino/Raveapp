// src/screens/admin/NewArtistScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { createArtistOnApi } from "@/utils/artists/artistApi";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function NewArtistScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instagramURL, setInstagramURL] = useState("");
  const [spotifyURL, setSpotifyURL] = useState("");
  const [soundcloudURL, setSoundcloudURL] = useState("");

  const handleCreateArtist = async () => {
    try {
      await createArtistOnApi({
        name,
        description,
        instagramURL,
        spotifyURL,
        soundcloudURL,
      });
      Alert.alert("Éxito", "Artista creado correctamente.");
      router.back();
    } catch (err: any) {
      console.error("Error al crear artista:", err.response?.data || err);
      const msg =
        typeof err.response?.data === "string"
          ? err.response.data
          : JSON.stringify(err.response?.data, null, 2);
      Alert.alert("Error al crear", msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ingresar nuevo artista</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre del artista"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Breve bio"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Instagram URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://instagram.com/..."
          value={instagramURL}
          onChangeText={setInstagramURL}
        />

        <Text style={styles.label}>Spotify URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://open.spotify.com/..."
          value={spotifyURL}
          onChangeText={setSpotifyURL}
        />

        <Text style={styles.label}>SoundCloud URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://soundcloud.com/..."
          value={soundcloudURL}
          onChangeText={setSoundcloudURL}
        />

        <TouchableOpacity style={styles.btn} onPress={handleCreateArtist}>
          <Text style={styles.btnText}>Crear Artista</Text>
        </TouchableOpacity>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { padding: 16 },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  label: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 8,
    marginTop: 4,
    backgroundColor: COLORS.cardBg,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  btn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: RADIUS.card,
    marginTop: 24,
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
});
