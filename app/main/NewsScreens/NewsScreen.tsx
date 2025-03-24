// screens/NewsScreens/NewsScreen.tsx
import React, { useState, useEffect } from "react";
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

// Importa tu hook o contexto de autenticación:
import { useAuth } from "@/context/AuthContext";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";

// Importamos el helper de noticias
import { getAllNews } from "@/utils/news/newsHelpers";
import { NewsItem } from "@/interfaces/NewsProps";

// Estilos globales
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function NewsScreen() {
  const router = useRouter();
  const { user } = useAuth();  // Para ver el rol (admin/user)

  // Estado para guardar las noticias que traemos del helper
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  useEffect(() => {
    // Cargar las 5 noticias del helper
    const allNews = getAllNews();
    setNewsList(allNews);
  }, []);

  const handlePress = (item: NewsItem) => {
    router.push(`/main/NewsScreens/NewScreen?id=${item.id}`);
  };

  // Función para ir a la pantalla de crear evento (si eres admin)
  const handleCreateEvent = () => {
    router.push("/main/EventsScreens/CreateEventScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <TabMenuComponent
        tabs={[
          { label: "Noticias", route: "/main/NewsScreens/NewsScreen", isActive: true },
          { label: "Artistas", route: "/main/ArtistsScreens/ArtistsScreen", isActive: false },
        ]}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SOLO mostrar el botón si user && user.role === "admin" */}
        {user?.role === "admin" && (
          <TouchableOpacity
            style={styles.createEventButton}
            onPress={handleCreateEvent}
          >
            <Text style={styles.createEventButtonText}>Crear evento</Text>
          </TouchableOpacity>
        )}

        {/* Render de las noticias que tenemos en newsList */}
        {newsList.map((item) => (
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
    backgroundColor: globalStyles.COLORS.backgroundLight,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  createEventButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    alignItems: "center",
  },
  createEventButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },
  newsCard: {
    marginBottom: 20,
    alignItems: "center",
    backgroundColor: globalStyles.COLORS.cardBg,
    borderRadius: RADIUS.card,
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
    fontSize: FONT_SIZES.subTitle,
    color: globalStyles.COLORS.textPrimary,
    fontWeight: "bold",
  },
});
