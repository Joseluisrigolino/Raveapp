// src/screens/admin/EditArtistScreen.tsx

// Imports (mantener arriba)
import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy"; // usado para tamaño de archivo
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { fetchOneArtistFromApi, updateArtistOnApi } from "@/app/artists/apis/artistApi";
import { mediaApi } from "@/app/apis/mediaApi";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import InputText from "@/components/common/inputText"; // reutilizo componente compartido
import InputDesc from "@/components/common/inputDesc"; // para descripción multi‑línea
import eventBus from "@/utils/eventBus"; // para emitir evento de activación
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function EditArtistScreen() {
  // Params recibidos (id del artista, flag de activación y nombre prellenado)
  const { id, activate, prefillName } = useLocalSearchParams<{ id: string; activate?: string; prefillName?: string }>();
  const router = useRouter();

  // Estados (nombres en inglés, comentarios en español)
  const [artistName, setArtistName] = useState(""); // nombre
  const [artistDesc, setArtistDesc] = useState(""); // descripción
  const [instagramUrl, setInstagramUrl] = useState(""); // url instagram
  const [spotifyUrl, setSpotifyUrl] = useState(""); // url spotify
  const [soundcloudUrl, setSoundcloudUrl] = useState(""); // url soundcloud
  const [imageUri, setImageUri] = useState<string | null>(null); // imagen actual o nueva
  const [mediaId, setMediaId] = useState<string | null>(null); // id media para borrar
  const [socialId, setSocialId] = useState<string | null>(null); // id social (si existe)
  const [activeFlag, setActiveFlag] = useState(true); // estado activo
  const [localNewImage, setLocalNewImage] = useState<string | null>(null); // imagen local temporal
  const activationFlow = String(activate || "0") === "1"; // true si venimos a activar

  // Cargar datos del artista
  useEffect(() => {
    if (!id || id === "undefined") {
      Alert.alert("Error", "ID inválido");
      return;
    }
    const load = async () => {
      try {
        const data = await fetchOneArtistFromApi(id);
        // Si hay prefillName lo uso, sino el nombre original
        setArtistName(prefillName?.trim() ? String(prefillName) : data.name);
        setArtistDesc(data.description || "");
        setInstagramUrl(data.instagramURL || "");
        setSpotifyUrl(data.spotifyURL || "");
        setSoundcloudUrl(data.soundcloudURL || "");
        setSocialId(data.idSocial ?? null);
        // Si es flujo de activación fuerzo activo
        setActiveFlag(activationFlow ? true : (data.isActivo ?? true));
        setImageUri(data.image || null);
        // Buscar media asociada para permitir borrar
        try {
          const media = await mediaApi.getByEntidad(id);
          if (Array.isArray(media.media) && media.media.length) {
            setMediaId(media.media[0].idMedia || null);
          }
        } catch {}
      } catch (e) {
        console.log("Error loading artist", e);
        Alert.alert("Error", "No se pudo cargar el artista");
      }
    };
    load();
  }, [id, prefillName, activationFlow]);

  // Seleccionar imagen de galería
  const onSelectImage = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (picked.canceled || !picked.assets?.length) return; // nada elegido
    const asset = picked.assets[0];
    const info: any = await FileSystem.getInfoAsync(asset.uri);
    if (info?.size && info.size > 2 * 1024 * 1024) {
      Alert.alert("Error", "La imagen supera los 2MB");
      return;
    }
    setLocalNewImage(asset.uri);
    setImageUri(asset.uri); // actualizar vista previa
  };

  // Borrar imagen actual en backend (si existe mediaId)
  const onDeleteImage = async () => {
    if (!mediaId) {
      Alert.alert("Error", "No hay imagen para borrar");
      return;
    }
    try {
      await mediaApi.delete(mediaId);
      setImageUri(null);
      setMediaId(null);
      Alert.alert("Listo", "Imagen eliminada");
    } catch (e) {
      console.log("Error deleting image", e);
      Alert.alert("Error", "No se pudo eliminar la imagen");
    }
  };

  // Guardar cambios / activar
  const onSave = async () => {
    if (!id || id === "undefined" || !artistName.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }
    try {
      // Subir nueva imagen si corresponde
      if (localNewImage) {
        const fileName = localNewImage.split('/').pop() || 'image.jpg';
        const file: any = { uri: localNewImage, name: fileName, type: 'image/jpeg' };
        await mediaApi.upload(id, file, undefined, { compress: true });
        setLocalNewImage(null);
      }
      // Actualizar artista en API
      await updateArtistOnApi({
        idArtista: id,
        name: artistName,
        description: artistDesc,
        instagramURL: instagramUrl,
        spotifyURL: spotifyUrl,
        soundcloudURL: soundcloudUrl,
        idSocial: socialId,
        isActivo: activationFlow ? true : activeFlag,
      });
      // Volver y lanzar evento si se activó
      router.back();
      setTimeout(() => {
        if (activationFlow || activeFlag) {
          eventBus.emit('artist:activated', { id, name: artistName });
        } else {
          Alert.alert('Éxito', 'Artista actualizado');
        }
      }, 250);
    } catch (err: any) {
      console.log('Error updating artist', err?.response?.data || err);
      const msg = typeof err?.response?.data === 'string' ? err.response.data : 'No se pudo actualizar';
      Alert.alert('Error', msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Título principal */}
        <Text style={styles.title}>Edit Artist</Text>

        {/* Nombre del artista */}
        <InputText
          label="Artist Name"
          value={artistName}
          isEditing={true}
          onBeginEdit={() => {}}
          onChangeText={setArtistName}
          placeholder="Enter artist name..."
          containerStyle={{ width: '100%' }}
        />

        {/* Imagen del artista */}
        <Text style={styles.sectionLabel}>Artist Photo</Text>
        <View style={styles.imageContainer}>
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.artistImage}
                onError={() => setImageUri(null)}
              />
              {mediaId ? (
                <TouchableOpacity style={styles.deleteButton} onPress={onDeleteImage}>
                  <Text style={styles.deleteButtonText}>Eliminar imagen</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.deleteButton} onPress={() => setImageUri(null)}>
                  <Text style={styles.deleteButtonText}>Eliminar vista previa</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.previewCircle}>
              <MaterialCommunityIcons name="account" size={42} color={COLORS.textSecondary} />
              <Text style={styles.previewText}>Vista previa</Text>
            </View>
          )}

          <TouchableOpacity style={styles.selectImageButton} onPress={onSelectImage}>
            <Text style={styles.selectImageButtonText}>Seleccionar imagen</Text>
          </TouchableOpacity>

          <Text style={styles.imageNotice}>JPG / PNG hasta 2MB.</Text>
        </View>

        {/* Descripción del artista */}
        <InputDesc
          label="Informacion del artista"
          value={artistDesc}
          isEditing={true}
          onBeginEdit={() => {}}
          onChangeText={setArtistDesc}
          autoFocus={false}
          placeholder="Describe artist bio, style, etc..."
          containerStyle={{ width: '100%' }}
        />

        {/* Social URLs with left icons (visual parity with NewArtist) */}
        {/* Instagram URL */}
        <View style={styles.fieldBlock}>
          <Text style={styles.sectionLabel}>Instagram URL</Text>
          <View style={styles.iconInputRow}>
            <MaterialCommunityIcons name="instagram" size={18} color={COLORS.textSecondary} style={{ marginHorizontal: 10 }} />
            <TextInput
              style={styles.textInputBare}
              value={instagramUrl}
              onChangeText={setInstagramUrl}
              keyboardType="url"
              placeholder="https://instagram.com/artist"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* SoundCloud URL */}
        <View style={styles.fieldBlock}>
          <Text style={styles.sectionLabel}>SoundCloud URL</Text>
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

        {/* Spotify URL */}
        <View style={styles.fieldBlock}>
          <Text style={styles.sectionLabel}>Spotify URL</Text>
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

        {/* Botón de guardar / activar */}
        <TouchableOpacity style={styles.btn} onPress={onSave}>
          <Text style={styles.btnText}>{activationFlow ? 'Activar artista' : 'Guardar cambios'}</Text>
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
