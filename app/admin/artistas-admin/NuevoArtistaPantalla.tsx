// src/screens/admin/NewArtistScreen.tsx

import React, { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import InputText from "@/components/common/inputText";
import InputDesc from "@/components/common/inputDesc";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      // Tamaño se valida/optimiza en mediaApi.upload (con compresión). Permitimos seleccionar y avisamos luego si falla.
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

  await mediaApi.upload(creado.idArtista, file, undefined, { compress: true });
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
      <Header title="EventApp" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ingresar nuevo artista</Text>

        <Text style={styles.sectionLabel}>Foto del artista</Text>
        <View style={styles.imageContainer}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.artistImage} />
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteImage}>
                <Text style={styles.deleteButtonText}>Eliminar imagen</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.previewCircle}>
              <MaterialCommunityIcons name="account" size={42} color={COLORS.textSecondary} />
              <Text style={styles.previewText}>Vista previa</Text>
            </View>
          )}

          <TouchableOpacity style={styles.selectImageButton} onPress={handleSelectImage}>
            <Text style={styles.selectImageButtonText}>Seleccionar imagen</Text>
          </TouchableOpacity>
        </View>

        <InputText
          label="Nombre del artista"
          value={name}
          isEditing={true}
          onBeginEdit={() => {}}
          onChangeText={setName}
          placeholder="Ingresa el nombre del artista..."
          containerStyle={{ width: "100%", alignItems: "stretch" }}
          labelStyle={{ width: "100%", textAlign: "left" }}
          inputStyle={{ width: "100%" }}
        />

        <InputDesc
          label="Información del artista"
          value={description}
          isEditing={true}
          onBeginEdit={() => {}}
          onChangeText={setDescription}
          autoFocus={false}
          placeholder="Describe la información del artista, género musical, biografía..."
          containerStyle={{ width: "100%", alignItems: "stretch" }}
          labelStyle={{ width: "100%", textAlign: "left" }}
          inputStyle={{ width: "100%" }}
        />

        {/* Social URLs with left icons */}
        <View style={styles.fieldBlock}>
          <Text style={styles.sectionLabel}>URL de Instagram del artista</Text>
          <View style={styles.iconInputRow}>
            <MaterialCommunityIcons name="instagram" size={18} color={COLORS.textSecondary} style={{ marginHorizontal: 10 }} />
            <TextInput
              style={styles.textInputBare}
              value={instagramURL}
              onChangeText={setInstagramURL}
              keyboardType="url"
              placeholder="https://instagram.com/artista"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.sectionLabel}>URL de SoundCloud del artista</Text>
          <View style={styles.iconInputRow}>
            <MaterialCommunityIcons name="soundcloud" size={18} color={COLORS.textSecondary} style={{ marginHorizontal: 10 }} />
            <TextInput
              style={styles.textInputBare}
              value={soundcloudURL}
              onChangeText={setSoundcloudURL}
              keyboardType="url"
              placeholder="https://soundcloud.com/artista"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.sectionLabel}>URL de Spotify del artista</Text>
          <View style={styles.iconInputRow}>
            <MaterialCommunityIcons name="spotify" size={18} color={COLORS.textSecondary} style={{ marginHorizontal: 10 }} />
            <TextInput
              style={styles.textInputBare}
              value={spotifyURL}
              onChangeText={setSpotifyURL}
              keyboardType="url"
              placeholder="https://open.spotify.com/artist/..."
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleCreateArtist}>
          <Text style={styles.btnText}>Crear artista</Text>
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
    textAlign: "left",
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  // input styles now provided by shared components
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
  previewCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c8cfd9',
    backgroundColor: '#dbe2ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewText: {
    marginTop: 6,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  selectImageButtonText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
  },
  imagePlaceholderText: {
    fontFamily: FONTS.bodyRegular,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  fieldBlock: { marginTop: 10 },
  iconInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    height: 56,
  },
  textInputBare: {
    flex: 1,
    height: '100%',
    paddingRight: 12,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  btn: {
    backgroundColor: '#0F172A',
    height: 52,
    borderRadius: 14,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
});
