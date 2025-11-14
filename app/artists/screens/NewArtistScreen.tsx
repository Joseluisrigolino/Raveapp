// Pantalla para crear un nuevo artista
// Se simplifica la lógica y se usan nombres en inglés

import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Componentes de layout
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
// API helpers
import { createArtistOnApi, fetchArtistsFromApi } from "@/app/artists/apis/artistApi";
import { mediaApi } from "@/app/apis/mediaApi";
// Estilos globales y entradas
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import InputText from "@/components/common/inputText";
import InputDesc from "@/components/common/inputDesc";

// Componente principal
export default function NewArtistScreen() {
  const router = useRouter();

  // Estados para datos del formulario
  const [artistName, setArtistName] = useState("");
  const [artistDesc, setArtistDesc] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [soundcloudUrl, setSoundcloudUrl] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Seleccionar imagen desde la galería
  const onPickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Quitar imagen seleccionada
  const onRemoveImage = () => setImageUri(null);

  // Crear artista y subir imagen si corresponde
  const onSave = async () => {
    if (!artistName.trim()) {
      Alert.alert("Error", "El nombre del artista es obligatorio.");
      return;
    }
    try {
      // Crear el artista
      await createArtistOnApi({
        name: artistName,
        description: artistDesc,
        instagramURL: instagramUrl,
        spotifyURL: spotifyUrl,
        soundcloudURL: soundcloudUrl,
      });

      // Buscar el artista recién creado por nombre
      const all = await fetchArtistsFromApi();
      const created = all.find((a) => a.name === artistName);
      if (created && imageUri) {
        const fileName = imageUri.split("/").pop() || "image.jpg";
        const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
        const file: any = { uri: imageUri, name: fileName, type: fileType };
        await mediaApi.upload(created.idArtista, file, undefined, { compress: true });
      }

      Alert.alert("Éxito", "Artista creado correctamente.");
      router.back();
    } catch (err: any) {
      // Manejo de error simple
      console.error("Error creando artista", err);
      Alert.alert("Error al crear artista", "Revisá los datos ingresados.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="EventApp" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Título principal */}
        <Text style={styles.title}>Ingresar nuevo artista</Text>

        {/* Bloque de imagen */}
        <Text style={styles.sectionLabel}>Foto del artista</Text>
        <View style={styles.imageContainer}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.artistImage} />
              <TouchableOpacity style={styles.deleteButton} onPress={onRemoveImage}>
                <Text style={styles.deleteButtonText}>Eliminar imagen</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.previewCircle}>
              <MaterialCommunityIcons name="account" size={42} color={COLORS.textSecondary} />
              <Text style={styles.previewText}>Vista previa</Text>
            </View>
          )}
          <TouchableOpacity style={styles.selectImageButton} onPress={onPickImage}>
            <Text style={styles.selectImageButtonText}>Seleccionar imagen</Text>
          </TouchableOpacity>
        </View>

        {/* Nombre del artista */}
        <InputText
          label="Nombre del artista"
          value={artistName}
          isEditing={true}
          onBeginEdit={() => {}}
          onChangeText={setArtistName}
          placeholder="Ingresa el nombre del artista..."
          containerStyle={{ width: "100%", alignItems: "stretch" }}
          labelStyle={{ width: "100%", textAlign: "left" }}
          inputStyle={{ width: "100%" }}
        />

        {/* Descripción del artista */}
        <InputDesc
          label="Información del artista"
          value={artistDesc}
          isEditing={true}
          onBeginEdit={() => {}}
          onChangeText={setArtistDesc}
          autoFocus={false}
          placeholder="Describe la información del artista, género musical, biografía..."
          containerStyle={{ width: "100%", alignItems: "stretch" }}
          labelStyle={{ width: "100%", textAlign: "left" }}
          inputStyle={{ width: "100%" }}
        />

        {/* URLs sociales */}
        <View style={styles.fieldBlock}>
          <Text style={styles.sectionLabel}>URL de Instagram del artista</Text>
          <View style={styles.iconInputRow}>
            <MaterialCommunityIcons name="instagram" size={18} color={COLORS.textSecondary} style={{ marginHorizontal: 10 }} />
            <TextInput
              style={styles.textInputBare}
              value={instagramUrl}
              onChangeText={setInstagramUrl}
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
              value={soundcloudUrl}
              onChangeText={setSoundcloudUrl}
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
              value={spotifyUrl}
              onChangeText={setSpotifyUrl}
              keyboardType="url"
              placeholder="https://open.spotify.com/artist/..."
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Botón para guardar */}
        <TouchableOpacity style={styles.btn} onPress={onSave}>
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
