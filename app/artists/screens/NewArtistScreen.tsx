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
import SelectImageArtistComponent from "@/app/artists/components/SelectImageArtistComponent";

// Layout components
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";

// API helpers (no changes to endpoints)
import { fetchArtistsFromApi } from "@/app/artists/apis/artistApi";
import useCreateArtista from "@/app/artists/services/useCreateArtista";
import { mediaApi } from "@/app/apis/mediaApi";
import AdminPopupNewArtist from "@/app/artists/components/admin/new-artist/AdminPopupNewArtist";

// Styles and shared inputs
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import InputText from "@/components/common/inputText";
import InputDesc from "@/components/common/inputDesc";
import { capitalizeFirst } from "@/utils/CapitalizeFirstLetter";

// ------------------ HELPERS ------------------

// helper simple: construir objeto file desde uri
function buildFileObjectFromUri(uri: string) {
  const fileName = uri.split("/").pop() || "image.jpg";
  const fileType = fileName.toLowerCase().endsWith(".png")
    ? "image/png"
    : "image/jpeg";
  return { uri, name: fileName, type: fileType } as any;
}

// (helper now moved to utils/CapitalizeFirstLetter.ts)

// ------------------ MAIN COMPONENT ------------------

// Pantalla para crear un nuevo artista
export default function NewArtistScreen() {
  const router = useRouter();

  // hook para crear artista (estado de carga simple)
  const { createArtist, isLoading } = useCreateArtista();

  // estados del formulario (nombres en inglés internamente)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("");
  const [spotify, setSpotify] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [createdVisible, setCreatedVisible] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);

  // abrir selector de imagen (galería)
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      // error simple, no crash
      console.warn("pickImage error", e);
    }
  };

  // quitar imagen seleccionada
  const removeImage = () => setImage(null);

  // guardar artista y opcionalmente subir imagen
  const saveArtist = async () => {
    // validación acumulada: listar todos los campos obligatorios que falten
    const missing: string[] = [];
    if (!name.trim()) missing.push("Nombre del artista");
    if (!description.trim()) missing.push("Descripción del artista");

    if (missing.length) {
      Alert.alert("Faltan datos", `Por favor completá los siguientes campos: ${missing.join(", ")}.`);
      return;
    }

    try {
      // crear artista usando hook
      await createArtist({
        name,
        description,
        instagramURL: instagram,
        spotifyURL: spotify,
        soundcloudURL: soundcloud,
      });

      // buscar el artista creado (estrategia simple: buscar por nombre)
      const all = await fetchArtistsFromApi();
      const created = all.find((a) => a.name === name);

      // subir imagen si existe
      if (created && image) {
        const file = buildFileObjectFromUri(image);
        await mediaApi.upload(created.idArtista, file, undefined, {
          compress: true,
        });
      }

      // mostrar popup de creado (misma apariencia que AdminCardPopupEliminate)
      setCreatedName(created?.name ?? name);
      setCreatedVisible(true);
    } catch (err) {
      // manejo de error simple
      console.error("Error creando artista", err);
      Alert.alert("Error al crear artista", "Revisá los datos ingresados.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Título principal (UI en español) */}
        <Text style={styles.title}>Ingresar nuevo artista</Text>

        {/* Imagen del artista (reusable component) */}
        <SelectImageArtistComponent
          image={image}
          onPick={pickImage}
          onRemove={removeImage}
          label="Foto del artista"
        />

        {/* Nombre */}
        <InputText
          label="Nombre del artista"
          value={name}
          isEditing={true}
          onBeginEdit={() => {}}
          // forzar primera letra mayúscula mientras se escribe
          onChangeText={(t) => setName(capitalizeFirst(t))}
          placeholder="Ingresa el nombre del artista..."
          containerStyle={{ width: "100%", alignItems: "stretch" }}
          labelStyle={{ width: "100%", textAlign: "left" }}
          inputStyle={{ width: "100%" }}
        />

        {/* Descripción */}
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

        {/* URLs sociales (UI en español) */}
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

        {/* Botón guardar */}
        <TouchableOpacity style={styles.btn} onPress={saveArtist}>
          <Text style={styles.btnText}>Crear artista</Text>
        </TouchableOpacity>
      </ScrollView>
      <AdminPopupNewArtist
        visible={createdVisible}
        artistName={createdName || undefined}
        onClose={() => {
          setCreatedVisible(false);
          router.back();
        }}
      />
      <Footer />
    </SafeAreaView>
  );
}

// ------------------ STYLES ------------------
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
    borderStyle: "dashed",
    borderColor: "#c8cfd9",
    backgroundColor: "#dbe2ea",
    alignItems: "center",
    justifyContent: "center",
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
});
