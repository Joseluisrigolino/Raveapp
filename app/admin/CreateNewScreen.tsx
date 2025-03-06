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
} from "react-native";

// Importa tu Header y Footer, ajustando las rutas a tu proyecto
import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";

// Ejemplo: Podrías usar este si quieres un componente de título personalizado
// import TitlePers from "@/components/TitleComponent";

export default function CreateNewsScreen() {
  // Estados locales para manejar los inputs
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Handlers (por ahora, sólo console.log o setState)
  const handleSelectImage = () => {
    console.log("Seleccionar imagen presionado");
    // Aquí más adelante implementarás la lógica de imagen (ImagePicker, etc.)
    // Por ejemplo:
    // setSelectedImage("ruta-de-la-imagen.jpg");
  };

  const handleSelectEvent = () => {
    console.log("Seleccionar evento presionado");
    // Lógica para mostrar lista de eventos, etc.
    // setSelectedEvent("EventoX");
  };

  const handleCreateNews = () => {
    console.log("Crear noticia presionado");
    console.log({
      title: newsTitle,
      body: newsBody,
      image: selectedImage,
      event: selectedEvent,
    });
    // Lógica para enviar la noticia a tu API
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          {/* Título principal de la pantalla */}
          <Text style={styles.mainTitle}>Crear Noticia</Text>

          {/* Campo: Título de la noticia */}
          <Text style={styles.label}>Título de la Noticia:</Text>
          <TextInput
            style={styles.input}
            placeholder="Título de la noticia aquí"
            value={newsTitle}
            onChangeText={setNewsTitle}
          />

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

          {/* Sección para asociar imagen */}
          <Text style={styles.label}>Asociar imagen:</Text>
          <View style={styles.imageRow}>
            {/* Vista previa (si tuvieras la imagen) */}
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

            <TouchableOpacity style={styles.selectImageButton} onPress={handleSelectImage}>
              <Text style={styles.selectImageButtonText}>Seleccionar imagen</Text>
            </TouchableOpacity>
          </View>

          {/* Campo: Asociar noticia a evento */}
          <Text style={styles.label}>Noticia asociada a evento:</Text>
          <View style={styles.eventRow}>
            <Text style={styles.eventPlaceholder}>
              {selectedEvent ? selectedEvent : "XXXXXXXXXXXXXXX"}
            </Text>
            <TouchableOpacity style={styles.selectEventButton} onPress={handleSelectEvent}>
              <Text style={styles.selectEventButtonText}>Seleccionar evento</Text>
            </TouchableOpacity>
          </View>

          {/* Botón para crear noticia */}
          <TouchableOpacity style={styles.createButton} onPress={handleCreateNews}>
            <Text style={styles.createButtonText}>Crear noticia</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  contentWrapper: {
    flex: 1,
    alignItems: "flex-start",
  },
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
    backgroundColor: "#F3F3F3",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: "100%",
  },
  textAreaContainer: {
    backgroundColor: "#F3F3F3",
    borderRadius: 4,
    width: "100%",
    minHeight: 100,
    marginBottom: 8,
  },
  textArea: {
    flex: 1,
    padding: 8,
    textAlignVertical: "top", // para Android
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
