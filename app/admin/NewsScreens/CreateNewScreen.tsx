// src/screens/NewsScreens/CreateNewScreen.tsx
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
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { createNews } from "@/utils/news/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function CreateNewScreen() {
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectImage = () => {
    // TODO: integrar expo-image-picker
    Alert.alert("Seleccionar imagen", "Funcionalidad pendiente...");
  };

  const handleSelectEvent = () => {
    // TODO: mostrar modal o lista de eventos
    Alert.alert("Seleccionar evento", "Funcionalidad pendiente...");
  };

  const handleCreateNews = async () => {
    if (!newsTitle.trim() || !newsBody.trim()) {
      Alert.alert("Error", "Título y contenido son obligatorios.");
      return;
    }

    const newNews: Partial<NewsItem> = {
      titulo: newsTitle,
      contenido: newsBody,
      imagen: selectedImage ?? "",
      dtPublicado: new Date().toISOString(),
      eventId: selectedEvent ? Number(selectedEvent) : undefined,
    };

    try {
      await createNews(newNews);
      Alert.alert("Éxito", "Noticia creada correctamente.");
      router.push("/admin/NewsScreens/ManageNewScreen");
    } catch (err) {
      console.error("Error al crear noticia:", err);
      Alert.alert("Error", "No se pudo crear la noticia.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Crear Noticia</Text>

        {/* Título */}
        <Text style={styles.label}>Título:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa el título"
          value={newsTitle}
          onChangeText={setNewsTitle}
        />

        {/* Cuerpo */}
        <Text style={styles.label}>Cuerpo:</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Escribe el contenido..."
            multiline
            value={newsBody}
            onChangeText={setNewsBody}
          />
        </View>

        {/* Imagen */}
        <Text style={styles.label}>Imagen:</Text>
        <View style={styles.row}>
          <View style={styles.imagePlaceholder}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.image} />
            ) : (
              <Text style={styles.placeholderText}>Sin imagen</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={handleSelectImage}
          >
            <Text style={styles.buttonSecondaryText}>Seleccionar</Text>
          </TouchableOpacity>
        </View>

        {/* Evento */}
        <Text style={styles.label}>Asociar a evento:</Text>
        <View style={styles.row}>
          <Text style={styles.eventText}>
            {selectedEvent ?? "Ninguno"}
          </Text>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={handleSelectEvent}
          >
            <Text style={styles.buttonSecondaryText}>Seleccionar</Text>
          </TouchableOpacity>
        </View>

        {/* Crear */}
        <TouchableOpacity style={styles.buttonPrimary} onPress={handleCreateNews}>
          <Text style={styles.buttonPrimaryText}>Crear Noticia</Text>
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
  scrollContent: {
    padding: 16,
  },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.borderInput,
    borderWidth: 1,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
  },
  textAreaContainer: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.borderInput,
    borderWidth: 1,
    borderRadius: RADIUS.card,
    minHeight: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  textArea: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  placeholderText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: RADIUS.card,
  },
  eventText: {
    flex: 1,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.card,
  },
  buttonSecondaryText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.cardBg,
  },
  buttonPrimary: {
    backgroundColor: COLORS.positive,
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    alignItems: "center",
    marginTop: 20,
  },
  buttonPrimaryText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.cardBg,
  },
});
