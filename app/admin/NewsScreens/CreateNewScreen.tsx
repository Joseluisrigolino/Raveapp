// src/screens/admin/NewsScreens/CreateNewScreen.tsx

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
import { createNews, getNews } from "@/utils/news/newsApi";
import { mediaApi } from "@/utils/mediaApi";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function CreateNewScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);

      if (fileInfo.size && fileInfo.size > 2 * 1024 * 1024) {
        Alert.alert("Error", "La imagen supera los 2MB permitidos.");
        return;
      }

      setImageUri(asset.uri);
    }
  };

  const handleDeleteImage = () => {
    setImageUri(null);
  };

  const handleCreateNews = async () => {
    if (!title.trim() || !body.trim()) {
      return Alert.alert("Error", "Título y cuerpo son obligatorios.");
    }

    try {
      await createNews({
        titulo: title,
        contenido: body,
        dtPublicado: new Date().toISOString(),
      });

      const noticias = await getNews();
      const creada = noticias.find((n) => n.titulo === title);
      if (!creada) throw new Error("No se pudo identificar la noticia creada.");

      if (imageUri) {
        const fileName = imageUri.split("/").pop() ?? "image.jpg";
        const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
        const file: any = {
          uri: imageUri,
          name: fileName,
          type: fileType,
        };
        await mediaApi.upload(creada.idNoticia, file);
      }

      Alert.alert("Éxito", "Noticia creada correctamente.");
      router.back();
    } catch (err: any) {
      console.error("Error al crear noticia:", err);
      const msg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : JSON.stringify(err?.response?.data || err, null, 2);
      Alert.alert("Error al crear noticia", msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Crear nueva noticia</Text>

        <Text style={styles.label}>Título:</Text>
        <TextInput
          style={styles.input}
          placeholder="Título"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Imagen:</Text>
        <View style={styles.imageContainer}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.newsImage} />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteImage}
              >
                <Text style={styles.deleteButtonText}>Eliminar imagen</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.newsImage, styles.imageFallback]}>
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
          placeholder="Escribí el contenido de la noticia"
          multiline
          value={body}
          onChangeText={setBody}
        />

        <TouchableOpacity style={styles.btn} onPress={handleCreateNews}>
          <Text style={styles.btnText}>Crear Noticia</Text>
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
  newsImage: {
    width: "100%",
    height: 180,
    borderRadius: RADIUS.card,
    marginBottom: 12,
  },
  imageFallback: {
    backgroundColor: COLORS.borderInput,
    justifyContent: "center",
    alignItems: "center",
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
});
