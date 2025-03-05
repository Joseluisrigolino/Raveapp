import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  Linking,
} from "react-native";
import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import TitlePers from "@/components/TitleComponent"; // Ajusta la ruta según tu proyecto

export default function NewScreen() {
  const imageUrl = "https://picsum.photos/800/600";
  const newsTitle = "¡Novedades del Fin de Semana!"; // Ajusta el título que necesites
  const description = `Llegó el viernes y se viene finde largo, por lo tanto 🍻 más días para disfrutar de música nueva 🙏

Ideal para darle play a nuestra playlist de lanzamientos actualizada 🩷🫠😏
https://open.spotify.com/playlist/3PanXbcy6jmHBtJh2dvFIB
Visita también nuestro sitio: https://example.com
`;

  /**
   * Función para detectar URLs en el texto y dividirlo en fragmentos.
   * Cada URL se convierte en un <Text> clickeable.
   */
  const linkifyText = (text: string) => {
    // Expresión regular que detecta URLs que empiecen con http:// o https://
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    // Separa el texto en fragmentos según la regex
    const tokens = text.split(urlRegex);

    return tokens.map((token, index) => {
      if (urlRegex.test(token)) {
        // Si el token coincide con la regex, es una URL
        return (
          <Text
            key={index}
            style={styles.link}
            onPress={() => Linking.openURL(token)}
          >
            {token}
          </Text>
        );
      } else {
        // De lo contrario, es un texto normal
        return token;
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          {/* Título de la noticia con tu componente personalizado */}
          <TitlePers text={newsTitle} />

          {/* Imagen de la noticia */}
          <Image
            source={{ uri: imageUrl }}
            style={styles.newsImage}
            resizeMode="cover"
          />

          {/* Descripción que contiene URLs. 
              Usamos linkifyText para convertir URLs en enlaces clickeables. */}
          <Text style={styles.description}>{linkifyText(description)}</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingVertical: 16,
  },
  contentContainer: {
    marginHorizontal: 16,
    alignItems: "center",
  },
  newsImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
  },
  description: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "left",
  },
  link: {
    color: "blue",
    textDecorationLine: "underline",
  },
});
