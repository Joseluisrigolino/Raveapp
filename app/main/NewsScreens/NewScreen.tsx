// screens/NewsScreens/NewScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TitlePers from "@/components/common/TitleComponent";
import { NewsItem } from "@/interfaces/NewsProps";
import { getNewsById } from "@/utils/news/newsApi";
import { getEventById } from "@/utils/events/eventHelpers";
import { fetchEvents } from "@/utils/events/eventApi";
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function NewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [linkedEventId, setLinkedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    async function fetchNewsAndEvent() {
      if (!id) return setLoading(false);

      try {
        const found = await getNewsById(id);
        if (!found) return;

        setNewsItem(found);

        if (found.urlEvento && found.urlEvento.includes("/evento/")) {
          const eventId = found.urlEvento.split("/evento/")[1];
          const events = await fetchEvents();
          const eventExists = events.find(e => e.id === eventId);

          if (eventExists) {
            setLinkedEventId(eventId);
          }
        }
      } catch (err) {
        console.error("Error al cargar noticia o evento:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNewsAndEvent();
  }, [id]);

  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const tokens = text.split(urlRegex);
    return tokens.map((token, i) =>
      urlRegex.test(token) ? (
        <Text
          key={i}
          style={styles.link}
          onPress={() => Linking.openURL(token)}
        >
          {token}
        </Text>
      ) : (
        token
      )
    );
  };

  const handleGoToEvent = () => {
    if (!linkedEventId) return;
    router.push(`/main/EventsScreens/EventScreen?id=${linkedEventId}`);
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

  if (!newsItem) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Noticia no encontrada.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            <TitlePers text={newsItem.titulo} />

            {newsItem.imagen ? (
              <Image
                source={{ uri: newsItem.imagen }}
                style={styles.newsImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.newsImage, styles.noImage]}>
                <Text style={styles.noImageText}>Sin imagen</Text>
              </View>
            )}

            {newsItem.contenido && (
              <Text style={styles.description}>
                {linkifyText(newsItem.contenido)}
              </Text>
            )}

            {linkedEventId && (
              <TouchableOpacity
                style={styles.verEventoButton}
                onPress={handleGoToEvent}
              >
                <Text style={styles.verEventoButtonText}>Ver evento</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
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
  contentContainer: {
    marginHorizontal: 16,
    alignItems: "center",
  },
  newsImage: {
    width: "100%",
    height: 300,
    borderRadius: RADIUS.card,
    marginBottom: 16,
  },
  noImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.borderInput,
  },
  noImageText: {
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "left",
    marginBottom: 16,
  },
  link: {
    color: COLORS.info,
    textDecorationLine: "underline",
  },
  verEventoButton: {
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  verEventoButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: 50,
    textAlign: "center",
    fontSize: FONT_SIZES.body,
    color: COLORS.negative,
  },
});
