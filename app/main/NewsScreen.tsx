import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { NewsItem } from "@/interfaces/NewsProps";
import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";

// Datos de ejemplo
const newsData: NewsItem[] = [
  {
    id: 1,
    title: "New Release 1",
    imageUrl: "https://picsum.photos/700/400?random=1",
  },
  {
    id: 2,
    title: "New Release 2",
    imageUrl: "https://picsum.photos/700/400?random=2",
  },
  {
    id: 3,
    title: "New Release 3",
    imageUrl: "https://picsum.photos/700/400?random=3",
  },
];

export default function NewsScreen() {
  const handlePress = (item: NewsItem) => {
    // Aquí puedes poner la acción que desees
    // Por ahora, solo mostramos por consola:
    console.log("Novedad presionada:", item.title);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {newsData.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.newsCard}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.newsImage}
              resizeMode="cover"
            />
            <Text style={styles.newsTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  newsCard: {
    marginBottom: 20,
    alignItems: "center",
  },
  newsImage: {
    width: "90%",
    height: 200,
    borderRadius: 10,
  },
  newsTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
});
