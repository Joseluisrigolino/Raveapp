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
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import {
  fetchOneArtistFromApi,
  updateArtistOnApi,
} from "@/utils/artists/artistApi";
import { Artist } from "@/interfaces/Artist";

export default function EditArtistScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

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
      .then((a) => {
        setArtist(a);
        setName(a.name);
        setDescription(a.description || "");
        setInstagramURL(a.instagramURL || "");
        setSpotifyURL(a.spotifyURL || "");
        setSoundcloudURL(a.soundcloudURL || "");
        setIdSocial(a.idSocial ?? null);
        setIsActivo(a.isActivo ?? true);
      })
      .catch(() => {
        Alert.alert("Error", "No se pudo cargar el artista.");
      });
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
      Alert.alert("Éxito", "Artista actualizado correctamente.");
      router.back();
    } catch (err: any) {
      console.error(err.response?.data || err);
      Alert.alert(
        "Error al actualizar",
        typeof err.response?.data === "string"
          ? err.response.data
          : JSON.stringify(err.response?.data)
      );
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <Header />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Editar Artista</Text>

        <Text style={s.label}>Nombre</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} />

        <Text style={s.label}>Descripción</Text>
        <TextInput
          style={[s.input, s.textArea]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={s.label}>Instagram URL</Text>
        <TextInput
          style={s.input}
          value={instagramURL}
          onChangeText={setInstagramURL}
          placeholder="https://instagram.com/..."
        />

        <Text style={s.label}>Spotify URL</Text>
        <TextInput
          style={s.input}
          value={spotifyURL}
          onChangeText={setSpotifyURL}
          placeholder="https://open.spotify.com/..."
        />

        <Text style={s.label}>SoundCloud URL</Text>
        <TextInput
          style={s.input}
          value={soundcloudURL}
          onChangeText={setSoundcloudURL}
          placeholder="https://soundcloud.com/..."
        />

        <View style={s.switchRow}>
          <Text style={s.label}>¿Activo?</Text>
          <TouchableOpacity
            style={[s.toggle, isActivo ? s.on : s.off]}
            onPress={() => setIsActivo((v) => !v)}
          >
            <Text style={s.toggleText}>{isActivo ? "Sí" : "No"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.btn} onPress={handleUpdate}>
          <Text style={s.btnText}>Actualizar</Text>
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  toggle: { marginLeft: 8, padding: 6, borderRadius: 4 },
  on: { backgroundColor: "green" },
  off: { backgroundColor: "red" },
  toggleText: { color: "#fff" },
  btn: {
    marginTop: 24,
    backgroundColor: "#0066cc",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
