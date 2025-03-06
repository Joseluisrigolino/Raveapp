import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  Linking,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import TitlePers from "@/components/TitleComponent"; 
import { NewsItem } from "@/interfaces/NewsProps";
import { getNewsById } from "@/utils/newsHelpers";

// Importamos globalStyles y las constantes que necesitemos
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function NewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);

  useEffect(() => {
    if (id) {
      const found = getNewsById(Number(id));
      if (found) {
        setNewsItem(found);
      }
    }
  }, [id]);

  if (!newsItem) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.contentContainer}>
          <Text style={{ textAlign: "center", marginTop: 50 }}>
            Noticia no encontrada.
          </Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  // Convierten URLs en enlaces clickeables
  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const tokens = text.split(urlRegex);

    return tokens.map((token, index) => {
      if (urlRegex.test(token)) {
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
        return token;
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          <TitlePers text={newsItem.title} />

          <Image
            source={{ uri: newsItem.imageUrl }}
            style={styles.newsImage}
            resizeMode="cover"
          />

          {newsItem.description && (
            <Text style={styles.description}>
              {linkifyText(newsItem.description)}
            </Text>
          )}
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

// Definimos estilos locales, usando globalStyles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalStyles.COLORS.backgroundLight, // Gris claro principal
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
    borderRadius: globalStyles.RADIUS.card, // Bordes redondeados (10-15px)
    marginBottom: 16,
    // Podrías aplicar sombra con SHADOWS.card
    // shadowColor: "#000", shadowOpacity: 0.1, ...
  },
  description: {
    fontSize: globalStyles.FONT_SIZES.body, // 14-16px
    color: globalStyles.COLORS.textPrimary, // Gris oscuro
    textAlign: "left",
  },
  link: {
    color: globalStyles.COLORS.info,       // Naranja informativo o
    textDecorationLine: "underline",
    // o si prefieres azul para enlaces:
    // color: "#1E88E5",
  },
});
