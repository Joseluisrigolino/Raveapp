// screens/NewsScreens/NewScreen.tsx
import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, Image, StyleSheet, Linking, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as nav from "@/utils/navigation";
import { ROUTES } from "../../../routes";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import TitlePers from "@/components/common/TitleComponent";
import { NewsItem } from "@/interfaces/NewsProps";
import { getNewsById, extractEventIdFromUrl } from "@/utils/news/newsApi";
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function NewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [linkedEventId, setLinkedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function fetchNews() {
      if (!id) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const found = await getNewsById(String(id));
        if (!found) {
          if (isMounted) setLoading(false);
          return;
        }
        if (isMounted) {
          setNewsItem(found);
          // Preferimos el id ya enriquecido por newsApi; si no, extraemos acá (defensivo)
          const fromApi = (found as any).urlEventoId as string | undefined;
          const fallback = extractEventIdFromUrl((found as any).urlEvento);
          setLinkedEventId(fromApi ?? fallback ?? null);
        }
      } catch (err) {
        console.error("Error al cargar noticia:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchNews();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const tokens = text.split(urlRegex);
    return tokens.map((token, i) =>
      urlRegex.test(token) ? (
        <Text
          key={`url-${i}`}
          style={styles.link}
          onPress={() => Linking.openURL(token)}
        >
          {token}
        </Text>
      ) : (
        <Text key={`txt-${i}`} style={styles.descriptionTextChunk}>
          {token}
        </Text>
      )
    );
  };

  const handleGoToEvent = () => {
    if (!linkedEventId) return;
  // Pasamos SOLO el UUID (no la URL)
  // Además, por compatibilidad, EventScreen puede leer 'id' o 'idEvento'
  nav.push(router, { pathname: ROUTES.MAIN.EVENTS.EVENT, params: { id: linkedEventId, idEvento: linkedEventId } });
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

            {(newsItem as any).imagen ? (
              <Image
                source={{ uri: (newsItem as any).imagen }}
                style={styles.newsImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.newsImage, styles.noImage]}>
                <Text style={styles.noImageText}>Sin imagen</Text>
              </View>
            )}

            {newsItem.contenido && (
              <Text style={styles.description}>{linkifyText(newsItem.contenido)}</Text>
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
    alignSelf: "stretch",
  },
  descriptionTextChunk: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
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
