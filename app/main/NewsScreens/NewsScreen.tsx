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
import { useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";
import { NewsItem } from "@/interfaces/NewsProps";

// Importa tus estilos globales (ajusta la ruta si difiere)
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

const newsData: NewsItem[] = [
  { id: 1, title: "New Release 1", imageUrl: "https://picsum.photos/700/400?random=1" },
  { id: 2, title: "New Release 2", imageUrl: "https://picsum.photos/700/400?random=2" },
  { id: 3, title: "New Release 3", imageUrl: "https://picsum.photos/700/400?random=3" },
];

export default function NewsScreen() {
  const router = useRouter();

  const handlePress = (item: NewsItem) => {
    router.push(`/main/NewsScreens/NewScreen?id=${item.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <TabMenuComponent
        tabs={[
          { label: "Noticias", route: "/main/NewsScreen", isActive: true },
          { label: "Artistas", route: "/main/ArtistsScreens/ArtistsScreen", isActive: false },
        ]}
      />

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
    backgroundColor: globalStyles.COLORS.backgroundLight, // Gris claro principal
  },
  scrollContent: {
    paddingVertical: 16,
  },
  newsCard: {
    marginBottom: 20,
    alignItems: "center",
    backgroundColor: globalStyles.COLORS.cardBg, // Blanco
    borderRadius: RADIUS.card,                   // Borde redondeado (10-15px)
    marginHorizontal: 16,
    padding: 10,
  },
  newsImage: {
    width: "100%",
    height: 200,
    borderRadius: RADIUS.card,
  },
  newsTitle: {
    marginTop: 10,
    fontSize: FONT_SIZES.subTitle,         // Por ejemplo 18-20px
    color: globalStyles.COLORS.textPrimary,// Gris oscuro
    fontWeight: "bold",
  },
});
