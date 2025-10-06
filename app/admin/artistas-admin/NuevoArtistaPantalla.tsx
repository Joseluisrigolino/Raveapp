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
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import {
  createArtistOnApi,
  fetchArtistsFromApi,
} from "@/utils/artists/artistApi";
import { mediaApi } from "@/utils/mediaApi";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function NewArtistScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instagramURL, setInstagramURL] = useState("");
  const [spotifyURL, setSpotifyURL] = useState("");
  const [soundcloudURL, setSoundcloudURL] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: 'images',
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileInfo: any = await FileSystem.getInfoAsync(asset.uri);

      if (fileInfo?.size && fileInfo.size > 2 * 1024 * 1024) {
        Alert.alert("Error", "La imagen supera los 2MB permitidos.");
        return;
      }

      setImageUri(asset.uri);
    }
  };

  const handleDeleteImage = () => {
    setImageUri(null);
  };

  const handleCreateArtist = async () => {
    if (!name.trim()) {
      return Alert.alert("Error", "El nombre del artista es obligatorio.");
    }

    try {
      await createArtistOnApi({
        name,
        description,
        instagramURL,
        spotifyURL,
        soundcloudURL,
      });

      // Obtener el último artista creado (por nombre)
      const artistas = await fetchArtistsFromApi();
      const creado = artistas.find((a) => a.name === name);
      if (!creado) throw new Error("No se pudo identificar el artista creado.");

      // Subir imagen si existe
      if (imageUri) {
        const fileName = imageUri.split("/").pop() ?? "image.jpg";
        const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";

        const file: any = {
          uri: imageUri,
          name: fileName,
          type: fileType,
        };

        await mediaApi.upload(creado.idArtista, file);
      }

      Alert.alert("Éxito", "Artista creado correctamente.");
      router.back();
    } catch (err: any) {
      console.error("Error al crear artista:", err);
      const msg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : JSON.stringify(err?.response?.data || err, null, 2);
      Alert.alert("Error al crear artista", msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ingresar nuevo artista</Text>

        <Text style={styles.label}>Nombre del artista:</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Foto del artista:</Text>
        <View style={styles.imageContainer}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.artistImage} />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteImage}
              >
                <Text style={styles.deleteButtonText}>Eliminar imagen</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View
              style={[
                styles.artistImage,
                {
                  backgroundColor: COLORS.borderInput,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.selectImageButton}
            onPress={handleSelectImage}
          >
            <Text style={styles.selectImageButtonText}>Seleccionar imagen</Text>
          </TouchableOpacity>

          <Text style={styles.imageNotice}>
            Se permiten imágenes JPG, JPEG o PNG. Peso máximo: 2MB.
          </Text>
        </View>

        <Text style={styles.label}>Información sobre el artista:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Escribí información sobre el artista"
          multiline
          value={description}
          onChangeText={setDescription}
        />

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

        <TouchableOpacity style={styles.btn} onPress={handleCreateArtist}>
          <Text style={styles.btnText}>Crear Artista</Text>
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
  content: {
    padding: 16,
  },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 16,
    textDecorationLine: "underline",
  },
  label: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 10,
    backgroundColor: COLORS.cardBg,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  artistImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: COLORS.negative,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    marginBottom: 12,
  },
  deleteButtonText: {
    color: "#fff",
    fontFamily: FONTS.bodyRegular,
  },
  selectImageButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
  },
  selectImageButtonText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
  },
  imagePlaceholderText: {
    fontFamily: FONTS.bodyRegular,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  imageNotice: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyRegular,
    textAlign: "center",
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    marginTop: 24,
    alignItems: "center",
  },
  btnText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
});
