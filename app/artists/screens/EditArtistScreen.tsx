// src/screens/admin/EditArtistScreen.tsx

// Imports (mantener arriba)
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy"; // usado para tamaño de archivo
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { fetchOneArtistFromApi } from "@/app/artists/apis/artistApi";
import useUpdateArtist from "@/app/artists/services/useUpdateArtist";
import { mediaApi } from "@/app/apis/mediaApi";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import InputText from "@/components/common/inputText"; // reutilizo componente compartido
import InputDesc from "@/components/common/inputDesc"; // para descripción multi‑línea
import eventBus from "@/utils/eventBus"; // para emitir evento de activación
import { capitalizeFirst } from "@/utils/CapitalizeFirstLetter";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SelectImageArtistComponent from "@/app/artists/components/SelectImageArtistComponent";

export default function EditArtistScreen() {
  // Params recibidos (id del artista, flag de activación y nombre prellenado)
  const { id, activate, prefillName } = useLocalSearchParams<{
    id: string;
    activate?: string;
    prefillName?: string;
  }>();
  const router = useRouter();

  // Estados (internals en inglés, comentarios en español)
  const [name, setName] = useState(""); // nombre del artista
  const [description, setDescription] = useState(""); // descripción
  const [instagram, setInstagram] = useState(""); // url instagram
  const [spotify, setSpotify] = useState(""); // url spotify
  const [soundcloud, setSoundcloud] = useState(""); // url soundcloud
  const [image, setImage] = useState<string | null>(null); // imagen actual o nueva
  const [mediaId, setMediaId] = useState<string | null>(null); // id media para borrar
  const [socialId, setSocialId] = useState<string | null>(null); // id social (si existe)
  const [active, setActive] = useState(true); // estado activo
  const [newImageLocal, setNewImageLocal] = useState<string | null>(null); // imagen local temporal
  const activationFlow = String(activate || "0") === "1"; // true si venimos a activar
  // helper moved to utils

  // hook para actualizar artista
  const { updateArtist, loading: updating } = useUpdateArtist();

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
        setName(prefillName?.trim() ? String(prefillName) : data.name);
        setDescription(data.description || "");
        setInstagram(data.instagramURL || "");
        setSpotify(data.spotifyURL || "");
        setSoundcloud(data.soundcloudURL || "");
        setSocialId(data.idSocial ?? null);
        // Si es flujo de activación fuerzo activo
        setActive(activationFlow ? true : data.isActivo ?? true);
        setImage(data.image || null);
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
  const pickImage = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets?.length) return; // nada elegido
    const asset = picked.assets[0];
    const info: any = await FileSystem.getInfoAsync(asset.uri);
    if (info?.size && info.size > 2 * 1024 * 1024) {
      Alert.alert("Error", "La imagen supera los 2MB");
      return;
    }
    setNewImageLocal(asset.uri);
    setImage(asset.uri); // actualizar vista previa
  };

  // Borrar imagen actual en backend (si existe mediaId)
  const deleteImage = async () => {
    if (!mediaId) {
      Alert.alert("Error", "No hay imagen para borrar");
      return;
    }
    try {
      await mediaApi.delete(mediaId);
      setImage(null);
      setMediaId(null);
      Alert.alert("Listo", "Imagen eliminada");
    } catch (e) {
      console.log("Error deleting image", e);
      Alert.alert("Error", "No se pudo eliminar la imagen");
    }
  };

  // Guardar cambios / activar
  // Guardar cambios / activar
  const saveArtist = async () => {
    if (!id || id === "undefined" || !name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }
    try {
      // Subir nueva imagen si corresponde
      if (newImageLocal) {
        const fileName = newImageLocal.split("/").pop() || "image.jpg";
        const file: any = {
          uri: newImageLocal,
          name: fileName,
          type: "image/jpeg",
        };
        await mediaApi.upload(id, file, undefined, { compress: true });
        setNewImageLocal(null);
      }
      // Actualizar artista en API
      await updateArtist({
        idArtista: id,
        name: name,
        description: description,
        instagramURL: instagram,
        spotifyURL: spotify,
        soundcloudURL: soundcloud,
        idSocial: socialId,
        isActivo: activationFlow ? true : active,
      });
      // Volver y lanzar evento si se activó
      router.back();
      setTimeout(() => {
        if (activationFlow || active) {
          eventBus.emit("artist:activated", { id, name });
        } else {
          Alert.alert("Éxito", "Artista actualizado");
        }
      }, 250);
    } catch (err: any) {
      console.log("Error updating artist", err?.response?.data || err);
      const msg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : "No se pudo actualizar";
      Alert.alert("Error", msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Título principal */}
        <Text style={styles.title}>Editar artista</Text>

        {/* Imagen del artista (reusable component) */}
        <SelectImageArtistComponent
          image={image}
          onPick={pickImage}
          onRemove={mediaId ? deleteImage : () => setImage(null)}
          label="Foto del artista"
          showNotice={true}
          noticeText="JPG / PNG hasta 2MB."
          deleteLabel={mediaId ? "Eliminar imagen" : "Eliminar vista previa"}
        />

        {/* Nombre del artista */}
        <InputText
          label="Nombre del artista"
          value={name}
          isEditing={true}
          onBeginEdit={() => {}}
          // forzar primera letra mayúscula mientras se escribe
          onChangeText={(t) => setName(capitalizeFirst(t))}
          placeholder="Ingresa el nombre del artista..."
          containerStyle={{ width: "100%" }}
        />

        {/* Descripción del artista */}
        <InputDesc
          label="Información del artista"
          value={description}
          isEditing={true}
          onBeginEdit={() => {}}
          onChangeText={setDescription}
          autoFocus={false}
          placeholder="Describe la información del artista, género musical, biografía..."
          containerStyle={{ width: "100%" }}
        />

        {/* Social URLs with left icons (visual parity with NewArtist) */}
        {/* Instagram URL */}
        <View style={styles.fieldBlock}>
          <Text style={styles.sectionLabel}>URL de Instagram del artista</Text>
          <View style={styles.iconInputRow}>
            <MaterialCommunityIcons
              name="instagram"
              size={18}
              color={COLORS.textSecondary}
              style={{ marginHorizontal: 10 }}
            />
            <TextInput
              style={styles.textInputBare}
              value={instagram}
              onChangeText={setInstagram}
              keyboardType="url"
              placeholder="https://instagram.com/artista"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* SoundCloud URL */}
        <View style={styles.fieldBlock}>
          <Text style={styles.sectionLabel}>URL de SoundCloud del artista</Text>
          <View style={styles.iconInputRow}>
            <MaterialCommunityIcons
              name="soundcloud"
              size={18}
              color={COLORS.textSecondary}
              style={{ marginHorizontal: 10 }}
            />
            <TextInput
              style={styles.textInputBare}
              value={soundcloud}
              onChangeText={setSoundcloud}
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
          <Text style={styles.sectionLabel}>URL de Spotify del artista</Text>
          <View style={styles.iconInputRow}>
            <MaterialCommunityIcons
              name="spotify"
              size={18}
              color={COLORS.textSecondary}
              style={{ marginHorizontal: 10 }}
            />
            <TextInput
              style={styles.textInputBare}
              value={spotify}
              onChangeText={setSpotify}
              keyboardType="url"
              placeholder="https://open.spotify.com/artist/..."
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Botón de guardar / activar */}
        <TouchableOpacity style={styles.btn} onPress={saveArtist}>
          <Text style={styles.btnText}>
            {activationFlow ? "Activar artista" : "Guardar cambios"}
          </Text>
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
  /* Image-related styles removed — moved to SelectImageArtistComponent */
  btn: {
    backgroundColor: "#0F172A",
    height: 52,
    borderRadius: 14,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
  },
  fieldBlock: { marginTop: 10 },
  iconInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    height: 56,
  },
  textInputBare: {
    flex: 1,
    height: "100%",
    paddingRight: 12,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
});
