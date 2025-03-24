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
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getNewsById } from "@/utils/news/newsHelpers";
import { NewsItem } from "@/interfaces/NewsProps";

export default function EditNewsScreen() {
  // 1. Leer param "id"
  const { id } = useLocalSearchParams<{ id?: string }>();

  // 2. Estados para los campos de la noticia
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // 3. Cargar la noticia
  useEffect(() => {
    if (id) {
      const found = getNewsById(Number(id));
      if (found) {
        // Precargamos la data en los estados
        setNewsTitle(found.title);
        setSelectedImage(found.imageUrl);
        setNewsBody(found.description ?? "");
        // Si tuvieras un campo event, lo pondrías aquí
      }
    }
  }, [id]);

  // Handler para actualizar la noticia
  const handleUpdateNews = () => {
    console.log("Editar noticia presionado");
    console.log({
      id,
      title: newsTitle,
      body: newsBody,
      image: selectedImage,
      event: selectedEvent,
    });
    // Aquí la lógica para actualizar la noticia en la API
  };

  // Handler para seleccionar nueva imagen (opcional)
  const handleSelectImage = () => {
    console.log("Seleccionar imagen presionado");
    // setSelectedImage("nueva-imagen.jpg");
  };

  // Handler para seleccionar evento (opcional)
  const handleSelectEvent = () => {
    console.log("Seleccionar evento presionado");
    // setSelectedEvent("EventoX");
  };

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
                <Text style={styles.imagePlaceholderText}>IMG</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.selectImageButton}
              onPress={handleSelectImage}
            >
              <Text style={styles.selectImageButtonText}>Seleccionar imagen</Text>
            </TouchableOpacity>
          </View>

          {/* Cuerpo de la noticia */}
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

          {/* Asociar noticia a evento (opcional) */}
          <Text style={styles.label}>Noticia asociada a evento:</Text>
          <View style={styles.eventRow}>
            <Text style={styles.eventPlaceholder}>
              {selectedEvent ? selectedEvent : "XXXXXXXXXXXXXXXXXXXX"}
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

// Estilos (muy similares a CreateNewsScreen)
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
});
