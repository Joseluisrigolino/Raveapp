// src/screens/admin/NewsScreens/EditNewScreen.tsx

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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getInfoAsync } from "expo-file-system/legacy";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getNewsById, updateNews } from "@/utils/news/newsApi";
import { mediaApi } from "@/utils/mediaApi";
import { fetchEvents } from "@/utils/events/eventApi";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { emit } from "@/utils/eventBus";

export default function EditNewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [idMedia, setIdMedia] = useState<string | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<string | null>(null);
  const [eventos, setEventos] = useState<{ idEvento: string; nombre: string; imageUrl: string }[]>([]);
  const [showEventos, setShowEventos] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return setLoading(false);
      try {
        const found = await getNewsById(id);
        if (found) {
          setNewsTitle(found.titulo);
          setNewsBody(found.contenido || "");

          if (found.urlEvento?.includes("/evento/")) {
            const partes = found.urlEvento.split("/evento/");
            if (partes.length === 2) setEventoSeleccionado(partes[1]);
          }

          const media = await mediaApi.getByEntidad(id);
          if (media?.media?.length > 0) {
            setSelectedImage(media.media[0].url);
            setIdMedia(media.media[0].idMedia);
          }
        }

        const fetched = await fetchEvents();
        const simples = fetched.map((e) => ({ idEvento: e.id, nombre: e.title, imageUrl: e.imageUrl }));
        setEventos(simples);
      } catch (error) {
        console.error("Error al cargar noticia:", error);
        Alert.alert("Error al cargar la noticia");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: 'images',
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
  const fileInfo: any = await getInfoAsync(asset.uri);
      if (fileInfo?.size && fileInfo.size > 2 * 1024 * 1024) {
        return Alert.alert("Error", "La imagen supera los 2MB permitidos.");
      }
      setNewImageUri(asset.uri);
      setSelectedImage(asset.uri);
    }
  };

  const handleDeleteImage = async () => {
    if (!idMedia) return Alert.alert("No se encontró imagen para eliminar.");
    try {
      await mediaApi.delete(idMedia);
      setSelectedImage(null);
      setNewImageUri(null);
      setIdMedia(null);
      Alert.alert("Imagen eliminada correctamente.");
    } catch (err) {
      console.error("Error al eliminar imagen:", err);
      Alert.alert("Error al eliminar la imagen.");
    }
  };

  const handleUpdateNews = async () => {
    if (!id || !newsTitle.trim()) {
      return Alert.alert("Error", "El título es obligatorio.");
    }

    try {
      if (newImageUri) {
        const fileName = newImageUri.split("/").pop() ?? "imagen.jpg";
        const file: any = {
          uri: newImageUri,
          name: fileName,
          type: "image/jpeg",
        };
        await mediaApi.upload(id, file);
      }

      const urlEventoFinal = eventoSeleccionado
        ? `https://raveapp.com.ar/evento/${eventoSeleccionado}`
        : null;

      await updateNews({
        idNoticia: id,
        titulo: newsTitle,
        contenido: newsBody,
        dtPublicado: new Date().toISOString(),
        urlEvento: urlEventoFinal,
      });

      Alert.alert("Noticia actualizada con éxito");
  // Notificar a otras pantallas que la noticia fue actualizada
  emit("news:updated", { id });
  router.back();
    } catch (err) {
      console.error("Error al actualizar noticia:", err);
      Alert.alert("Error al actualizar la noticia");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Editar Noticia</Text>

        <Text style={styles.label}>Título:</Text>
        <TextInput
          style={styles.input}
          value={newsTitle}
          onChangeText={setNewsTitle}
        />

        <Text style={styles.label}>Imagen:</Text>
        <View style={styles.imageContainer}>
          {selectedImage ? (
            <>
              <Image source={{ uri: selectedImage }} style={styles.imageBanner} />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteImage}
              >
                <Text style={styles.deleteButtonText}>Eliminar imagen</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.imageFallback}>
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

        <Text style={styles.label}>Contenido:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={newsBody}
          onChangeText={setNewsBody}
        />

        <Text style={styles.label}>Evento relacionado (opcional):</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowEventos(!showEventos)}
        >
          <Text style={styles.dropdownButtonText}>
            {eventoSeleccionado
              ? eventos.find((e) => e.idEvento === eventoSeleccionado)?.nombre || "Evento seleccionado"
              : "Seleccionar evento..."}
          </Text>
        </TouchableOpacity>
        {showEventos && (
          <View style={styles.dropdownContainer}>
            {eventos.map((e, index) => (
              <TouchableOpacity
                key={e.idEvento || `evento-${index}`}
                style={styles.dropdownItem}
                onPress={() => {
                  setEventoSeleccionado(e.idEvento);
                  setShowEventos(false);
                }}
              >
                <View style={styles.eventItem}>
                  {e.imageUrl ? (
                    <Image source={{ uri: e.imageUrl }} style={styles.eventImage} />
                  ) : (
                    <View style={[styles.eventImage, { backgroundColor: "#ccc" }]} />
                  )}
                  <Text style={styles.eventName}>{e.nombre}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleUpdateNews}>
          <Text style={styles.btnText}>Guardar cambios</Text>
        </TouchableOpacity>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  content: { padding: 16 },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 20,
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
  imageBanner: {
    width: "100%",
    height: 180,
    borderRadius: RADIUS.card,
    marginBottom: 12,
  },
  imageFallback: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.borderInput,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RADIUS.card,
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontFamily: FONTS.bodyRegular,
    color: COLORS.textSecondary,
    fontSize: 14,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    padding: 12,
    marginTop: 4,
  },
  dropdownButtonText: {
    fontFamily: FONTS.bodyRegular,
    color: COLORS.textPrimary,
  },
  dropdownContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
  },
  dropdownItem: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderInput,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  eventName: {
    fontFamily: FONTS.bodyRegular,
    color: COLORS.textPrimary,
  },
});