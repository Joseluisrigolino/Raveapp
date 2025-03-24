// screens/admin/EditArtistScreen.tsx
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
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getArtistById } from "@/utils/artists/artistHelpers";
import { Artist } from "@/interfaces/Artist";

export default function EditArtistScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [artistName, setArtistName] = useState("");
  const [artistImage, setArtistImage] = useState<string | null>(null);
  const [artistDescription, setArtistDescription] = useState("");
  const [instagramURL, setInstagramURL] = useState("");
  const [soundcloudURL, setSoundcloudURL] = useState("");
  const [spotifyURL, setSpotifyURL] = useState("");

  useEffect(() => {
    if (id) {
      const found = getArtistById(Number(id));
      if (found) {
        setArtistName(found.name);
        setArtistImage(found.image);
        setArtistDescription(found.description ?? "");
        setInstagramURL(found.instagramURL ?? "");
        setSoundcloudURL(found.soundcloudURL ?? "");
        setSpotifyURL(found.spotifyURL ?? "");
      }
    }
  }, [id]);

  const handleSelectImage = () => {
    console.log("Seleccionar nueva imagen");
  };

  const handleUpdateArtist = () => {
    console.log("Actualizar artista presionado");
    console.log({
      id,
      name: artistName,
      image: artistImage,
      description: artistDescription,
      instagramURL,
      soundcloudURL,
      spotifyURL,
    });
    // Lógica para actualizar en la API
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <Text style={styles.mainTitle}>Editar artista</Text>

          <Text style={styles.label}>Nombre:</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={artistName}
            onChangeText={setArtistName}
          />

          <Text style={styles.label}>Foto del artista:</Text>
          <View style={styles.imageRow}>
            <View style={styles.imagePlaceholder}>
              {artistImage ? (
                <Image
                  source={{ uri: artistImage }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Text style={styles.imagePlaceholderText}>IMG</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.selectImageButton}
              onPress={handleSelectImage}
            >
              <Text style={styles.selectImageButtonText}>Seleccionar imagen</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Información sobre el artista:</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Espacio para escribir información del artista"
              multiline
              value={artistDescription}
              onChangeText={setArtistDescription}
            />
          </View>

          <Text style={styles.label}>URL del Instagram del artista:</Text>
          <TextInput
            style={styles.input}
            placeholder="URL de Instagram"
            value={instagramURL}
            onChangeText={setInstagramURL}
          />

          <Text style={styles.label}>URL del SoundCloud del artista:</Text>
          <TextInput
            style={styles.input}
            placeholder="URL de SoundCloud"
            value={soundcloudURL}
            onChangeText={setSoundcloudURL}
          />

          <Text style={styles.label}>URL del Spotify del artista:</Text>
          <TextInput
            style={styles.input}
            placeholder="URL de Spotify"
            value={spotifyURL}
            onChangeText={setSpotifyURL}
          />

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateArtist}>
            <Text style={styles.updateButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  contentWrapper: { flex: 1, alignItems: "flex-start" },
  mainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    alignSelf: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: "100%",
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: "100%",
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  imagePlaceholderText: {
    color: "#555",
    fontWeight: "bold",
  },
  selectImageButton: {
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selectImageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  textAreaContainer: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    width: "100%",
    minHeight: 100,
    marginBottom: 8,
  },
  textArea: {
    flex: 1,
    padding: 8,
    textAlignVertical: "top",
  },
  updateButton: {
    backgroundColor: "#9c27b0",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
