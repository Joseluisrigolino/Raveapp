// app/artists/screens/EditArtistScreen.tsx
// Pantalla de administración para editar o activar un artista existente.

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
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";

import { fetchOneArtistFromApi } from "@/app/artists/apis/artistApi";
import useUpdateArtist from "@/app/artists/services/useUpdateArtist";
import { mediaApi } from "@/app/apis/mediaApi";

import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

import InputText from "@/components/common/inputText";
import InputDesc from "@/components/common/inputDesc";
import SelectImageArtistComponent from "@/app/artists/components/SelectImageArtistComponent";

import eventBus from "@/utils/eventBus";
import { capitalizeFirst } from "@/utils/CapitalizeFirstLetter";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Límite de tamaño para las imágenes (2MB)
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// Tipado de los parámetros que llegan por la ruta
type RouteParams = {
  id: string;
  activate?: string;
  prefillName?: string;
};

export default function EditArtistScreen() {
  // Obtenemos los parámetros de la URL: id del artista, flag de activación y nombre precargado
  const { id, activate, prefillName } = useLocalSearchParams<RouteParams>();
  // Router para poder volver o navegar
  const router = useRouter();

  // Estado del formulario
  const [name, setName] = useState(""); // nombre del artista
  const [description, setDescription] = useState(""); // descripción / bio
  const [instagram, setInstagram] = useState(""); // URL de Instagram
  const [spotify, setSpotify] = useState(""); // URL de Spotify
  const [soundcloud, setSoundcloud] = useState(""); // URL de SoundCloud

  const [image, setImage] = useState<string | null>(null); // imagen actual (URL remota o local)
  const [mediaId, setMediaId] = useState<string | null>(null); // id de la media en backend (para borrar)
  const [socialId, setSocialId] = useState<string | null>(null); // id de socials (si existe en backend)
  const [active, setActive] = useState(true); // flag de artista activo (para flujos futuros)

  const [newImageLocal, setNewImageLocal] = useState<string | null>(null); // imagen recién seleccionada, en local

  // Si activate === "1", estamos en flujo de "activar artista" además de editarlo
  const activationFlow = String(activate || "0") === "1";

  // Hook que encapsula la llamada de actualización a la API
  const { updateArtist, loading: updating } = useUpdateArtist();

  // Cargar datos del artista al montar la pantalla o cuando cambian los params
  useEffect(() => {
    // Validación rápida del id
    if (!id || id === "undefined") {
      Alert.alert("Error", "ID inválido");
      return;
    }

    const loadArtist = async () => {
      try {
        // Pedimos el artista al backend (versión enriquecida que ya mapea al tipo Artist del front)
        const data = await fetchOneArtistFromApi(id);

        // Si viene un prefillName (por ejemplo, creado antes inactivo), lo usamos.
        // Si no, usamos el nombre que vino de backend.
        const safeName = prefillName?.trim() ? String(prefillName) : data.name;

        setName(safeName);
        setDescription(data.description || "");
        setInstagram(data.instagramURL || "");
        setSpotify(data.spotifyURL || "");
        setSoundcloud(data.soundcloudURL || "");
        setSocialId(data.idSocial ?? null);

        // Si estamos en flujo de activación, forzamos activo = true, sino respetamos lo que viene
        setActive(activationFlow ? true : data.isActivo ?? true);

        // Imagen actual (puede venir vacía)
        setImage(data.image || null);

        // Buscamos media asociada para permitir borrado desde esta pantalla
        try {
          const media = await mediaApi.getByEntity(id);
          if (Array.isArray(media.media) && media.media.length > 0) {
            setMediaId(media.media[0].idMedia || null);
          }
        } catch {
          // Si falla la carga de media, no rompemos la pantalla: solo no se podrá borrar
          setMediaId(null);
        }
      } catch (e) {
        console.log("Error loading artist", e);
        Alert.alert("Error", "No se pudo cargar el artista");
      }
    };

    loadArtist();
  }, [id, prefillName, activationFlow]);

  // Abrir galería y elegir una nueva imagen
  const handlePickImage = async () => {
    // Lanzamos el selector de imágenes
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    // Si el usuario cancela o no hay assets, salimos
    if (picked.canceled || !picked.assets?.length) return;

    const asset = picked.assets[0];

    try {
      // Revisamos el tamaño del archivo en disco
      const info: any = await FileSystem.getInfoAsync(asset.uri);
      if (info?.size && info.size > MAX_IMAGE_BYTES) {
        Alert.alert("Error", "La imagen supera los 2MB");
        return;
      }
    } catch {
      // Si no podemos leer el tamaño, seguimos igual y delegamos validación final al backend/mediaApi
    }

    // Guardamos la ruta local para upload y actualizamos la vista previa
    setNewImageLocal(asset.uri);
    setImage(asset.uri);
  };

  // Borrar la imagen actual en backend (solo si tenemos id de media)
  const handleDeleteImage = async () => {
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

  // Guardar cambios / activar artista
  const handleSaveArtist = async () => {
    // Bloqueo doble click mientras se está actualizando
    if (updating) return;

    // Validamos nuevamente el id antes de enviar
    if (!id || id === "undefined") {
      Alert.alert("Error", "ID inválido");
      return;
    }

    // Validación acumulada de campos obligatorios
    const missing: string[] = [];
    if (!name.trim()) missing.push("Nombre del artista");
    if (!description.trim()) missing.push("Descripción del artista");

    if (missing.length > 0) {
      Alert.alert(
        "Faltan datos",
        `Por favor completá los siguientes campos: ${missing.join(", ")}.`
      );
      return;
    }

    try {
      // Si se eligió una nueva imagen local, la subimos antes de actualizar el artista
      if (newImageLocal) {
        const fileName = newImageLocal.split("/").pop() || "image.jpg";

        const file: any = {
          uri: newImageLocal,
          name: fileName,
          type: "image/jpeg",
        };

        // mediaApi ya maneja límite de tamaño y compresión opcional
        await mediaApi.upload(id, file, undefined, { compress: true });
        setNewImageLocal(null);
      }

      // Armamos payload de actualización
      await updateArtist({
        idArtista: id,
        name,
        description,
        instagramURL: instagram,
        spotifyURL: spotify,
        soundcloudURL: soundcloud,
        idSocial: socialId,
        isActivo: activationFlow ? true : active,
      });

      // Volvemos a la pantalla anterior
      router.back();

      // Pequeño delay para que la navegación termine antes de disparar el evento / alerta
      setTimeout(() => {
        if (activationFlow || active) {
          // Emitimos un evento global para notificar que el artista quedó activado o activo
          eventBus.emit("artist:activated", { id, name });
        } else {
          // En caso de solo actualización sin activar, mostramos feedback simple
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
      {/* Header global de la app */}
      <Header />

      {/* Contenido scrollable con el formulario de edición */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Título de la pantalla */}
        <Text style={styles.title}>
          {activationFlow ? "Activar y editar artista" : "Editar artista"}
        </Text>

        {/* Selector de imagen del artista (componente reutilizable) */}
        <SelectImageArtistComponent
          image={image}
          onPick={handlePickImage}
          onRemove={mediaId ? handleDeleteImage : () => setImage(null)}
          label="Foto del artista"
          showNotice
          noticeText="JPG / PNG hasta 2MB."
          deleteLabel={mediaId ? "Eliminar imagen" : "Eliminar vista previa"}
        />

        {/* Campo: nombre del artista */}
        <InputText
          label="Nombre del artista"
          value={name}
          isEditing
          onBeginEdit={() => {}}
          // Forzamos capitalizar la primera letra mientras escribe
          onChangeText={(text) => setName(capitalizeFirst(text))}
          placeholder="Ingresa el nombre del artista..."
          containerStyle={{ width: "100%" }}
        />

        {/* Campo: descripción / bio del artista */}
        <InputDesc
          label="Información del artista"
          value={description}
          isEditing
          onBeginEdit={() => {}}
          onChangeText={setDescription}
          autoFocus={false}
          placeholder="Describe la información del artista, género musical, biografía..."
          containerStyle={{ width: "100%" }}
        />

        {/* Campos de redes sociales: mismos patrones visuales que en alta de artista */}

        {/* Instagram */}
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

        {/* SoundCloud */}
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

        {/* Spotify */}
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

        {/* Botón principal: guardar cambios o activar */}
        <TouchableOpacity style={styles.btn} onPress={handleSaveArtist}>
          <Text style={styles.btnText}>
            {activationFlow ? "Activar artista" : "Guardar cambios"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer global de la app */}
      <Footer />
    </SafeAreaView>
  );
}

// Estilos locales de la pantalla (solo lo que usa este archivo)
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
  fieldBlock: {
    marginTop: 10,
  },
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
