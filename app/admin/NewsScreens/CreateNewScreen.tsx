// screens/NewsScreens/CreateNewScreen.tsx
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

// Importa la función createNews de la API
import { createNews } from "@/utils/news/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function CreateNewScreen() {
  // Estados para los inputs
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectImage = () => {
    console.log("Seleccionar imagen presionado");
    // Aquí puedes integrar expo-image-picker y actualizar selectedImage
    // Ejemplo: setSelectedImage("https://example.com/nueva-imagen.jpg");
  };

  const handleSelectEvent = () => {
    console.log("Seleccionar evento presionado");
    // Aquí la lógica para seleccionar un evento relacionado
    // Ejemplo: setSelectedEvent("12345");
  };

  const handleCreateNews = async () => {
    // Validar campos mínimos
    if (!newsTitle.trim() || !newsBody.trim()) {
      Alert.alert("Por favor, ingresa el título y el cuerpo de la noticia");
      return;
    }

    // Crea el objeto de la noticia; el id se genera en la API, y dtPublicado se asigna aquí
    const newNews: Partial<NewsItem> = {
      titulo: newsTitle,
      contenido: newsBody,
      imagen: selectedImage || "",
      dtPublicado: new Date().toISOString(),
      eventId: selectedEvent ? Number(selectedEvent) : undefined,
    };

    try {
      const createdNews = await createNews(newNews);
      console.log("Noticia creada:", createdNews);
      Alert.alert("Noticia creada con éxito");
      // Redirige a la pantalla de administración de noticias
      router.push("/admin/NewsScreens/ManageNewScreen");
    } catch (error) {
      console.error("Error al crear la noticia:", error);
      Alert.alert("Error al crear la noticia");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <Text style={styles.mainTitle}>Crear Noticia</Text>

          {/* Campo: Título de la Noticia */}
          <Text style={styles.label}>Título de la Noticia:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa el título de la noticia"
            value={newsTitle}
            onChangeText={setNewsTitle}
          />

          {/* Campo: Cuerpo de la Noticia */}
          <Text style={styles.label}>Cuerpo de la Noticia:</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Escribe el contenido de la noticia..."
              multiline
              value={newsBody}
              onChangeText={setNewsBody}
            />
          </View>

          {/* Sección para asociar imagen */}
          <Text style={styles.label}>Asociar imagen:</Text>
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
              <Text style={styles.selectImageButtonText}>
                Seleccionar imagen
              </Text>
            </TouchableOpacity>
          </View>

          {/* Campo: Asociar noticia a evento (opcional) */}
          <Text style={styles.label}>Noticia asociada a evento:</Text>
          <View style={styles.eventRow}>
            <Text style={styles.eventPlaceholder}>
              {selectedEvent ? selectedEvent : "No asociado"}
            </Text>
            <TouchableOpacity
              style={styles.selectEventButton}
              onPress={handleSelectEvent}
            >
              <Text style={styles.selectEventButtonText}>
                Seleccionar evento
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botón para crear la noticia */}
          <TouchableOpacity style={styles.createButton} onPress={handleCreateNews}>
            <Text style={styles.createButtonText}>Crear noticia</Text>
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
  createButton: {
    backgroundColor: "#4db6ac",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
