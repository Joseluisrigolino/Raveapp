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

// Importa las funciones de la API para noticias
import { getNewsById, updateNews } from "@/utils/news/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";

export default function EditNewScreen() {
  // Leer el parámetro "id" (se asume que es el idNoticia)
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  // Estados para los campos de la noticia
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar la noticia desde la API
  useEffect(() => {
    async function fetchNews() {
      if (id) {
        try {
          const found = await getNewsById(id);
          if (found) {
            // Precarga la data en los estados
            setNewsTitle(found.titulo);
            setSelectedImage(found.imagen);
            setNewsBody(found.contenido || "");
            // Si la noticia tiene campo eventId, se carga (ajusta según tu estructura)
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
      } else {
        setLoading(false);
      }
    }
    fetchNews();
  }, [id]);

  // Handler para actualizar la noticia
  const handleUpdateNews = async () => {
    if (!id) return;

    // Crea el objeto con los datos a actualizar.
    // Se asume que la API espera un objeto con estos campos:
    // idNoticia, titulo, contenido, imagen y dtPublicado
    const updatedNews: Partial<NewsItem> = {
      idNoticia: id,
      titulo: newsTitle,
      contenido: newsBody,
      imagen: selectedImage || "",
      dtPublicado: new Date().toISOString(), // Se actualiza con la fecha actual. Ajusta si es necesario.
      // Si tienes eventId, puedes incluirlo:
      eventId: selectedEvent ? Number(selectedEvent) : undefined,
    };

    try {
      const updated = await updateNews(updatedNews);
      console.log("Noticia actualizada:", updated);
      Alert.alert("Noticia actualizada con éxito");
      // Redirige a la pantalla de administración de noticias
      router.push("/admin/NewsScreens/ManageNewScreen");
    } catch (error) {
      console.error("Error updating news:", error);
      Alert.alert("Error al actualizar la noticia");
    }
  };

  // Handler para seleccionar nueva imagen (puedes integrar expo-image-picker)
  const handleSelectImage = () => {
    console.log("Seleccionar imagen presionado");
    // Ejemplo: setSelectedImage("nueva-imagen-url.jpg");
  };

  // Handler para seleccionar evento (opcional)
  const handleSelectEvent = () => {
    console.log("Seleccionar evento presionado");
    // Ejemplo: setSelectedEvent("id-del-evento");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <Text style={styles.mainTitle}>Editar Noticia</Text>

          {/* Campo: Título de la noticia */}
          <Text style={styles.label}>Título de la noticia:</Text>
          <TextInput
            style={styles.input}
            placeholder="Título de la noticia aquí"
            value={newsTitle}
            onChangeText={setNewsTitle}
          />

          {/* Editar imagen */}
          <Text style={styles.label}>Editar imagen:</Text>
          <View style={styles.imageRow}>
            <View style={styles.imagePlaceholder}>
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: "100%", height: "100%" }}
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

          {/* Campo: Cuerpo de la noticia */}
          <Text style={styles.label}>Cuerpo de la noticia:</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Espacio para escribir la noticia"
              multiline
              value={newsBody}
              onChangeText={setNewsBody}
            />
          </View>

          {/* Campo: Noticia asociada a evento (opcional) */}
          <Text style={styles.label}>Noticia asociada a evento:</Text>
          <View style={styles.eventRow}>
            <Text style={styles.eventPlaceholder}>
              {selectedEvent ? selectedEvent : "No asociado"}
            </Text>
            <TouchableOpacity
              style={styles.selectEventButton}
              onPress={handleSelectEvent}
            >
              <Text style={styles.selectEventButtonText}>Seleccionar evento</Text>
            </TouchableOpacity>
          </View>

          {/* Botón para actualizar la noticia */}
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateNews}>
            <Text style={styles.updateButtonText}>Editar noticia</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  contentWrapper: { flex: 1, alignItems: "flex-start" },
  mainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    alignSelf: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: "100%",
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
    backgroundColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  imagePlaceholderText: {
    color: "#555",
    fontWeight: "bold",
  },
  selectImageButton: {
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selectImageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  textAreaContainer: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    width: "100%",
    minHeight: 100,
    marginBottom: 8,
  },
  textArea: {
    flex: 1,
    padding: 8,
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
    fontSize: 14,
    color: "#666",
  },
  selectEventButton: {
    backgroundColor: "#000",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectEventButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  updateButton: {
    backgroundColor: "#9c27b0",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
