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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TitlePers from "@/components/common/TitleComponent";
import { NewsItem } from "@/interfaces/NewsProps";
import { getNewsById } from "@/utils/news/newsHelpers";

import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
// Importamos para buscar el evento:
import { getEventById } from "@/utils/events/eventHelpers";
import { ExtendedEventItem } from "@/utils/events/eventHelpers";

export default function NewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [linkedEvent, setLinkedEvent] = useState<ExtendedEventItem | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (id) {
      const found = getNewsById(Number(id));
      if (found) {
        setNewsItem(found);
        // Si la noticia tiene eventId, buscamos el evento
        if (found.eventId) {
          const ev = getEventById(found.eventId);
          if (ev) {
            setLinkedEvent(ev);
          }
        }
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

  // Convierte URLs en enlaces clickeables
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

  // Navegar al detalle del evento
  const handleGoToEvent = (eventId: number) => {
    router.push(`/main/EventsScreens/EventScreen?id=${eventId}`);
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

          {/* Bloque del evento relacionado (si existe) */}
          {linkedEvent && (
            <View style={styles.eventContainer}>
              <Text style={styles.eventLabel}>Evento relacionado:</Text>
              <Text style={styles.eventTitle}>{linkedEvent.title}</Text>
              <Text style={styles.eventDate}>
                {linkedEvent.date} - {linkedEvent.timeRange}
              </Text>
              <Image
                source={{ uri: linkedEvent.imageUrl }}
                style={styles.eventImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.eventButton}
                onPress={() => handleGoToEvent(linkedEvent.id)}
              >
                <Text style={styles.eventButtonText}>Ver evento</Text>
              </TouchableOpacity>
            </View>
          )}
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
    borderRadius: globalStyles.RADIUS.card,
    marginBottom: 16,
  },
  description: {
    fontSize: globalStyles.FONT_SIZES.body,
    color: globalStyles.COLORS.textPrimary,
    textAlign: "left",
    marginBottom: 16,
  },
  link: {
    color: globalStyles.COLORS.info,
    textDecorationLine: "underline",
  },

  // Estilos del bloque de evento relacionado
  eventContainer: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 20,
    // Sombra suave
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
  eventButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  eventButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
  },
});
