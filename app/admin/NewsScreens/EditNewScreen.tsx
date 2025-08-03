// screens/NewsScreens/EditNewScreen.tsx
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

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getNewsById, updateNews } from "@/utils/news/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function EditNewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const found = await getNewsById(id);
        if (found) {
          setNewsTitle(found.titulo);
          setNewsBody(found.contenido || "");
          setSelectedImage(found.imagen || null);
          if (found.eventId) {
            setSelectedEvent(String(found.eventId));
          }
        } else {
          Alert.alert("Noticia no encontrada");
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        Alert.alert("Error al cargar la noticia");
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [id]);

  const handleUpdateNews = async () => {
    if (!id) return;

    const updatedNews: Partial<NewsItem> = {
      idNoticia: id,
      titulo: newsTitle,
      contenido: newsBody,
      imagen: selectedImage ?? "",
      dtPublicado: new Date().toISOString(),
      eventId: selectedEvent ? Number(selectedEvent) : undefined,
    };

    try {
      await updateNews(updatedNews);
      Alert.alert("Noticia actualizada con éxito");
      router.push("/admin/NewsScreens/ManageNewScreen");
    } catch (error) {
      console.error("Error updating news:", error);
      Alert.alert("Error al actualizar la noticia");
    }
  };

  const handleSelectImage = () => {
    Alert.alert("Seleccionar imagen", "Funcionalidad pendiente...");
  };

  const handleSelectEvent = () => {
    Alert.alert("Seleccionar evento", "Funcionalidad pendiente...");
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.mainTitle}>Editar Noticia</Text>

        <Text style={styles.label}>Título de la noticia:</Text>
        <TextInput
          style={styles.input}
          placeholder="Título de la noticia aquí"
          value={newsTitle}
          onChangeText={setNewsTitle}
        />

        <Text style={styles.label}>Editar imagen:</Text>
        <View style={styles.imageRow}>
          <View style={styles.imagePlaceholder}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.image}
              />
            ) : (
              <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.selectImageButton}
            onPress={handleSelectImage}
          >
            <Text style={styles.selectImageButtonText}>Seleccionar imagen</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Cuerpo de la noticia:</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Escribe el contenido..."
            multiline
            value={newsBody}
            onChangeText={setNewsBody}
          />
        </View>

        <Text style={styles.label}>Noticia asociada a evento:</Text>
        <View style={styles.eventRow}>
          <Text style={styles.eventPlaceholder}>
            {selectedEvent ?? "No asociado"}
          </Text>
          <TouchableOpacity
            style={styles.selectEventButton}
            onPress={handleSelectEvent}
          >
            <Text style={styles.selectEventButtonText}>Seleccionar evento</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdateNews}
        >
          <Text style={styles.updateButtonText}>Editar noticia</Text>
        </TouchableOpacity>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollContent: { padding: 16 },
  mainTitle: {
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
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: "100%",
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
  imagePlaceholderText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: RADIUS.card,
  },
  selectImageButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.card,
  },
  selectImageButtonText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.cardBg,
  },
  textAreaContainer: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.borderInput,
    borderWidth: 1,
    borderRadius: RADIUS.card,
    minHeight: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  textArea: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    textAlignVertical: "top",
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: "100%",
    justifyContent: "space-between",
  },
  eventPlaceholder: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  selectEventButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.card,
  },
  selectEventButtonText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.cardBg,
  },
  updateButton: {
    backgroundColor: COLORS.positive,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
    width: "100%",
  },
  updateButtonText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.cardBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
