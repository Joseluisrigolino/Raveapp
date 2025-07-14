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
import { getEventById, ExtendedEventItem } from "@/utils/events/eventHelpers";
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function NewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [linkedEvent, setLinkedEvent] = useState<ExtendedEventItem | null>(null);
  const [loading, setLoading] = useState(true);

  // controla si se muestra el botón "Ver evento"
  const [showEventButton, setShowEventButton] = useState(true);

  const router = useRouter();

  useEffect(() => {
    async function fetchNews() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const found = await getNewsById(id);
        if (found) {
          setNewsItem(found);
          if (found.eventId) {
            const ev = getEventById(found.eventId);
            if (ev) setLinkedEvent(ev);
          }
        }
      } catch (error) {
        console.error("Error fetching news by id:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [id]);

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

  const handleGoToEvent = (eventId: number) =>
    router.push(`/main/EventsScreens/EventScreen?id=${eventId}`);

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

            {/* botón "Ver evento" controlado solo por showEventButton */}
            {showEventButton && (
              <TouchableOpacity
                style={styles.verEventoButton}
                onPress={() =>
                  linkedEvent && handleGoToEvent(linkedEvent.id)
                }
              >
                <Text style={styles.verEventoButtonText}>Ver evento</Text>
              </TouchableOpacity>
            )}

            {/* detalles del evento relacionado */}
            {linkedEvent && (
              <View style={styles.eventContainer}>
                <Text style={styles.eventLabel}>Evento relacionado:</Text>
                <Text style={styles.eventTitle}>{linkedEvent.title}</Text>
                <Text style={styles.eventDate}>
                  {linkedEvent.date} – {linkedEvent.timeRange}
                </Text>
                <Image
                  source={{ uri: linkedEvent.imageUrl }}
                  style={styles.eventImage}
                  resizeMode="cover"
                />
              </View>
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
  eventContainer: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  eventLabel: {
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    fontWeight: "bold",
  },
  eventDate: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  eventImage: {
    width: "100%",
    height: 150,
    borderRadius: RADIUS.card,
    marginBottom: 12,
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
