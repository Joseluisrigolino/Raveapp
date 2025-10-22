// src/screens/admin/EditArtistScreen.tsx

import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";

import { fetchOneArtistFromApi, updateArtistOnApi } from "@/utils/artists/artistApi";
import { mediaApi } from "@/utils/mediaApi";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import InputText from "@/components/common/inputText";
import InputDesc from "@/components/common/inputDesc";
import eventBus from "@/utils/eventBus";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function EditArtistScreen() {
  const { id, activate, prefillName } = useLocalSearchParams<{ id: string; activate?: string; prefillName?: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instagramURL, setInstagramURL] = useState("");
  const [spotifyURL, setSpotifyURL] = useState("");
  const [soundcloudURL, setSoundcloudURL] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [idMedia, setIdMedia] = useState<string | null>(null);
  const [idSocial, setIdSocial] = useState<string | null>(null);
  const [isActivo, setIsActivo] = useState(true);
  const [newImageLocalUri, setNewImageLocalUri] = useState<string | null>(null);

  useEffect(() => {
    if (!id || id === "undefined") {
      Alert.alert("Error", "ID inválido recibido.");
      return;
    }

    const loadArtist = async () => {
      try {
        const a = await fetchOneArtistFromApi(id);
        setName(prefillName && String(prefillName).trim().length ? String(prefillName) : a.name);
        setDescription(a.description || "");
        setInstagramURL(a.instagramURL || "");
        setSpotifyURL(a.spotifyURL || "");
        setSoundcloudURL(a.soundcloudURL || "");
        setIdSocial(a.idSocial ?? null);
        // Si venimos con activate=1, forzar previsualización como activo
        const shouldActivate = String(activate || "0") === "1";
        setIsActivo(shouldActivate ? true : (a.isActivo ?? true));
        setImageUri(a.image || null);

        const media = await mediaApi.getByEntidad(id);
        if (Array.isArray(media.media) && media.media.length > 0) {
          setIdMedia(media.media[0].idMedia || null);
        }
    } catch (err) {
      const anyErr = err as any;
      console.error("❌ Error cargando artista:", anyErr?.response?.data || err);
        Alert.alert("Error", "No se pudo cargar el artista.");
      }
    };

    loadArtist();
  }, [id]);

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      const fileInfo: any = await FileSystem.getInfoAsync(asset.uri);

      if (fileInfo?.size && fileInfo.size > 2 * 1024 * 1024) {
        Alert.alert("Error", "La imagen supera los 2MB permitidos.");
        return;
      }

      setNewImageLocalUri(asset.uri);
      setImageUri(asset.uri); // actualiza vista previa
    }
  };

  const handleDeleteImage = async () => {
    if (!idMedia) {
      return Alert.alert("Error", "No se encontró imagen para eliminar.");
    }
    try {
      await mediaApi.delete(idMedia);
      setImageUri(null);
      setIdMedia(null);
      Alert.alert("Imagen eliminada correctamente.");
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
      Alert.alert("Error", "No se pudo eliminar la imagen.");
    }
  };

  const handleUpdateArtist = async () => {
    if (!id || id === "undefined" || !name.trim()) {
      return Alert.alert("Error", "El nombre del artista es obligatorio.");
    }

    try {
      if (newImageLocalUri) {
        const fileName = newImageLocalUri.split("/").pop() ?? "foto.jpg";
        const file: any = {
          uri: newImageLocalUri,
          name: fileName,
          type: "image/jpeg",
        };

        await mediaApi.upload(id, file, undefined, { compress: true }); // sube la imagen nueva
        setNewImageLocalUri(null); // limpia estado
      }

      const shouldActivate = String(activate || "0") === "1";
      await updateArtistOnApi({
        idArtista: id,
        name,
        description,
        instagramURL,
        spotifyURL,
        soundcloudURL,
        idSocial,
        isActivo: shouldActivate ? true : isActivo,
      });

      // Emitir evento global sólo si se activó (o ya estaba activo)
      // Volver a la pantalla anterior y luego notificar (para que el Alert se muestre allí)
      router.back();
      setTimeout(() => {
        if (shouldActivate || isActivo === true) {
          eventBus.emit("artist:activated", { id, name });
        } else {
          // si no fue un flujo de activación, mostramos el aviso local
          Alert.alert("Éxito", "Artista actualizado correctamente.");
        }
      }, 250);
    } catch (err: any) {
      console.error("Error al actualizar artista:", err?.response?.data || err);
      const msg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : JSON.stringify(err?.response?.data || err, null, 2);
      Alert.alert("Error al actualizar", msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Modificar artista</Text>

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

        <Text style={styles.sectionLabel}>Foto del artista</Text>
        <View style={styles.imageContainer}>
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.artistImage}
                onError={() => setImageUri(null)}
              />
              {idMedia ? (
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteImage}>
                  <Text style={styles.deleteButtonText}>Eliminar imagen actual</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.deleteButton} onPress={() => setImageUri(null)}>
                  <Text style={styles.deleteButtonText}>Quitar vista previa</Text>
                </TouchableOpacity>
              )}
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

          <Text style={styles.imageNotice}>
            Se permiten imágenes JPG, JPEG o PNG. Peso máximo: 2MB.
          </Text>
        </View>

        <InputDesc
          label="Información sobre el artista"
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

        {/* Social URLs with left icons (visual parity with NewArtist) */}
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

        <TouchableOpacity style={styles.btn} onPress={handleUpdateArtist}>
          <Text style={styles.btnText}>Confirmar</Text>
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
  imageNotice: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyRegular,
    textAlign: "center",
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
});
