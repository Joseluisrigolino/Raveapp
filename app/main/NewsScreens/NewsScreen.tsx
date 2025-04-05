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
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

// Importa tu hook o contexto de autenticación:
import { useAuth } from "@/context/AuthContext";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TabMenuComponent from "@/components/layout/TabMenuComponent";

// Importa la función getNews del API (no el helper mock)
import { getNews } from "@/utils/news/newsApi";
import { NewsItem } from "@/interfaces/NewsProps";

// Estilos globales
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function NewsScreen() {
  const router = useRouter();
  const { user } = useAuth();  // Para ver el rol (admin/user)

  // Estado para guardar las noticias que se obtienen de la API
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const data = await getNews();
        setNewsList(data);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Error al cargar las noticias");
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const handlePress = (item: NewsItem) => {
    router.push(`/main/NewsScreens/NewScreen?id=${item.idNoticia}`);
  };

  // Función para ir a la pantalla de crear evento (solo si eres admin)
  const handleCreateEvent = () => {
    router.push("/main/EventsScreens/CreateEventScreen");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

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
        {user?.role === "admin" && (
          <TouchableOpacity
            style={styles.createEventButton}
            onPress={handleCreateEvent}
          >
            <Text style={styles.createEventButtonText}>Crear evento</Text>
          </TouchableOpacity>
        )}

        {newsList.map((item) => (
          <TouchableOpacity
            key={item.idNoticia}
            style={styles.newsCard}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            {item.imagen ? (
              <Image
                source={{ uri: item.imagen }}
                style={styles.newsImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.newsImage, styles.noImage]}>
                <Text style={styles.noImageText}>Sin imagen</Text>
              </View>
            )}
            <Text style={styles.newsTitle}>{item.titulo}</Text>
            <Text style={styles.newsContent}>{item.contenido}</Text>
            <Text style={styles.newsDate}>
              {new Date(item.dtPublicado).toLocaleDateString()}
            </Text>
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
  noImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.borderInput,
  },
  noImageText: {
    color: COLORS.textSecondary,
  },
  newsTitle: {
    marginTop: 10,
    fontSize: FONT_SIZES.subTitle,
    color: globalStyles.COLORS.textPrimary,
    fontWeight: "bold",
  },
  newsContent: {
    marginTop: 5,
    fontSize: FONT_SIZES.body,
    color: globalStyles.COLORS.textPrimary,
  },
  newsDate: {
    marginTop: 5,
    fontSize: FONT_SIZES.small,
    color: globalStyles.COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.negative,
  },
});
