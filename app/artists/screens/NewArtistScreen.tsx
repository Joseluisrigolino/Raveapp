// Pantalla para crear un nuevo artista (solo admin).
// Maneja formulario + imagen + subida de media, y muestra un popup de éxito.

import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Layout comunes de la app
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";

// Componentes específicos de artistas
import SelectImageArtistComponent from "@/app/artists/components/SelectImageArtistComponent";
import AdminPopupNewArtist from "@/app/artists/components/admin/new-artist/AdminPopupNewArtist";

// API / hooks relacionados a artistas y media
import { mediaApi } from "@/app/apis/mediaApi";
import { fetchArtistsFromApi } from "@/app/artists/apis/artistApi";
import useCreateArtista from "@/app/artists/services/useCreateArtista";

// Estilos y componentes compartidos
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";
import InputText from "@/components/common/inputText";
import InputDesc from "@/components/common/inputDesc";
import { capitalizeFirst } from "@/utils/CapitalizeFirstLetter";

// ------------------ HELPERS ------------------

// Tipo simple para representar el archivo que espera mediaApi.upload
type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

// helper: a partir de una URI local del picker, arma el objeto "file" para subir
function buildFileObjectFromUri(uri: string): UploadFile {
  // tomamos el último segmento como nombre de archivo
  const fileName = uri.split("/").pop() || "image.jpg";
  const lower = fileName.toLowerCase();
  // si termina en .png, marcamos tipo PNG, si no asumimos JPEG
  const type = lower.endsWith(".png") ? "image/png" : "image/jpeg";
  return { uri, name: fileName, type };
}

// ------------------ MAIN COMPONENT ------------------

export default function NewArtistScreen() {
  const router = useRouter(); // para volver al listado cuando se crea el artista

  // hook que encapsula la llamada al endpoint de creación
  const { createArtist, isLoading } = useCreateArtista();

  // estados del formulario (internamente en inglés, textos visibles en español)
  const [name, setName] = useState(""); // nombre del artista
  const [description, setDescription] = useState(""); // bio / info general
  const [instagram, setInstagram] = useState(""); // URL de Instagram
  const [spotify, setSpotify] = useState(""); // URL de Spotify
  const [soundcloud, setSoundcloud] = useState(""); // URL de SoundCloud
  const [image, setImage] = useState<string | null>(null); // URI local de la imagen

  // estado para el popup de "artista creado"
  const [createdVisible, setCreatedVisible] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);

  // Abrir el selector de imágenes (galería)
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });

      // si el usuario cancela, no hacemos nada
      if (result.canceled || !result.assets?.length) return;

      // nos quedamos con la primera imagen elegida
      setImage(result.assets[0].uri);
    } catch (e) {
      // log sencillo para no romper la pantalla
      console.warn("handlePickImage error", e);
      Alert.alert("Error", "No se pudo abrir la galería.");
    }
  };

  // Quitar la imagen seleccionada (solo limpia el estado local)
  const handleRemoveImage = () => {
    setImage(null);
  };

  // Guardar artista y, si hay imagen, subirla a media
  const handleSaveArtist = async () => {
    // si ya se está enviando, evitamos doble submit
    if (isLoading) return;

    // validación: juntamos todos los campos obligatorios que falten
    const missing: string[] = [];
    if (!name.trim()) missing.push("Nombre del artista");
    if (!description.trim()) missing.push("Descripción del artista");

    // si falta algo, mostramos alerta y frenamos
    if (missing.length) {
      Alert.alert(
        "Faltan datos",
        `Por favor completá los siguientes campos: ${missing.join(", ")}.`
      );
      return;
    }

    try {
      // 1) Crear artista en backend (sin imagen todavía)
      await createArtist({
        name,
        description,
        instagramURL: instagram,
        spotifyURL: spotify,
        soundcloudURL: soundcloud,
      });

      // 2) Buscar el artista recién creado
      //    Estrategia simple: traer lista y matchear por nombre
      //    (sabemos que acá podría haber colisión si hay dos con el mismo nombre)
      const allArtists = await fetchArtistsFromApi();
      const created = allArtists.find((a) => a.name === name);

      // 3) Si encontramos el artista y hay imagen, subimos media asociada
      if (created && image) {
        const file = buildFileObjectFromUri(image);
        await mediaApi.upload(created.idArtista, file, undefined, {
          compress: true,
        });
      }

      // 4) Mostramos popup de confirmación con el nombre (del backend o el ingresado)
      setCreatedName(created?.name ?? name);
      setCreatedVisible(true);
    } catch (err) {
      console.error("Error creando artista", err);
      Alert.alert(
        "Error al crear artista",
        "Revisá los datos ingresados o intentá nuevamente."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header general de la app */}
      <Header />

      {/* Contenido scrollable: formulario completo */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Título principal de la pantalla */}
        <Text style={styles.title}>Ingresar nuevo artista</Text>

        {/* Imagen del artista (componente reutilizable) */}
        <SelectImageArtistComponent
          image={image}
          onPick={handlePickImage}
          onRemove={handleRemoveImage}
          label="Foto del artista"
          showNotice
          noticeText="JPG / PNG hasta 2MB."
          deleteLabel="Eliminar vista previa"
        />

        {/* Campo: nombre del artista */}
        <InputText
          label="Nombre del artista"
          value={name}
          isEditing
          onBeginEdit={() => {}}
          // aplicamos capitalización mientras escribe
          onChangeText={(text) => setName(capitalizeFirst(text))}
          placeholder="Ingresa el nombre del artista..."
          containerStyle={{ width: "100%", alignItems: "stretch" }}
          labelStyle={{ width: "100%", textAlign: "left" }}
          inputStyle={{ width: "100%" }}
        />

        {/* Campo: descripción / bio */}
        <InputDesc
          label="Información del artista"
          value={description}
          isEditing
          onBeginEdit={() => {}}
          onChangeText={setDescription}
          autoFocus={false}
          placeholder="Describe la información del artista, género musical, biografía..."
          containerStyle={{ width: "100%", alignItems: "stretch" }}
          labelStyle={{ width: "100%", textAlign: "left" }}
          inputStyle={{ width: "100%" }}
        />

        {/* Campo: Instagram */}
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

        {/* Campo: SoundCloud */}
        <View style={styles.fieldBlock}>
          <Text style={styles.sectionLabel}>
            URL de SoundCloud del artista
          </Text>
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

        {/* Campo: Spotify */}
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

        {/* Botón de envío / creación */}
        <TouchableOpacity
          style={styles.btn}
          onPress={handleSaveArtist}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.cardBg} />
          ) : (
            <Text style={styles.btnText}>Crear artista</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Popup de confirmación cuando el artista se creó correctamente */}
      <AdminPopupNewArtist
        visible={createdVisible}
        artistName={createdName || undefined}
        onClose={() => {
          setCreatedVisible(false);
          router.back(); // volvemos a la pantalla anterior (lista de artistas admin)
        }}
      />

      {/* Footer común de la app */}
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
