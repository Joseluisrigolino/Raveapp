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

export default function NewScreen() {
  // 1. Leemos el param "id" de la URL
  const { id } = useLocalSearchParams<{ id?: string }>();

  // 2. Estado local para la noticia
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);

  // 3. Al montar o cambiar "id", buscamos la noticia
  useEffect(() => {
    if (id) {
      const found = getNewsById(Number(id));
      if (found) {
        setNewsItem(found);
      }
    }
  }, [id]);

  // 4. Si no se encontró, mostramos un mensaje
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

  // 5. Linkify la descripción
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

  // 6. Renderizar
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

          {/* Si la noticia tiene descripción, linkificamos */}
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
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "left",
  },
  link: {
    color: "blue",
    textDecorationLine: "underline",
  },
});
