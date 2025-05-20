// src/screens/admin/NewArtistScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
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
    <SafeAreaView style={s.container}>
      <Header />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Ingresar nuevo artista</Text>

        <Text style={s.label}>Nombre</Text>
        <TextInput
          style={s.input}
          placeholder="Nombre del artista"
          value={name}
          onChangeText={setName}
        />

        <Text style={s.label}>Descripción</Text>
        <TextInput
          style={[s.input, s.textArea]}
          placeholder="Breve bio"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={s.label}>Instagram URL</Text>
        <TextInput
          style={s.input}
          placeholder="https://instagram.com/..."
          value={instagramURL}
          onChangeText={setInstagramURL}
        />

        <Text style={s.label}>Spotify URL</Text>
        <TextInput
          style={s.input}
          placeholder="https://open.spotify.com/..."
          value={spotifyURL}
          onChangeText={setSpotifyURL}
        />

        <Text style={s.label}>SoundCloud URL</Text>
        <TextInput
          style={s.input}
          placeholder="https://soundcloud.com/..."
          value={soundcloudURL}
          onChangeText={setSoundcloudURL}
        />

        <TouchableOpacity style={s.btn} onPress={handleCreateArtist}>
          <Text style={s.btnText}>Crear Artista</Text>
        </TouchableOpacity>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  btn: {
    backgroundColor: "#4db6ac",
    padding: 14,
    borderRadius: 6,
    marginTop: 24,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
