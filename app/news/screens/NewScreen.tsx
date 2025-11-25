// src/screens/NewsScreens/NewScreen.tsx

import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import ProtectedRoute from "@/app/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import CirculoCarga from "@/components/common/CirculoCarga";

import ROUTES from "@/routes";
import * as nav from "@/utils/navigation";

import { COLORS, FONT_SIZES } from "@/styles/globalStyles";

import useNewsDetail from "../services/useNewsDetail";
import NewsHeroComponent from "../components/new/NewsHeroComponent";
import NewsBodyComponent from "../components/new/NewsBodyComponent";
import NewsRelatedEventCardComponent from "../components/new/NewsRelatedEventCardComponent";

export default function NewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const { newsItem, relatedEvent, loading, formattedDate } = useNewsDetail(
    id ? String(id) : undefined
  );

  function handleGoToEvent() {
    if (!relatedEvent?.id) return;
    nav.push(router, {
      pathname: ROUTES.MAIN.EVENTS.EVENT,
      params: { id: relatedEvent.id, idEvento: relatedEvent.id },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <CirculoCarga visible text="Cargando noticia…" />
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
            <NewsHeroComponent
              title={newsItem.titulo}
              imageUrl={newsItem.imagen}
              dateLabel={formattedDate}
            />

            <NewsBodyComponent content={newsItem.contenido} />

            <View style={styles.divider} />

            <NewsRelatedEventCardComponent
              eventId={relatedEvent?.id}
              title={relatedEvent?.title}
              imageUrl={relatedEvent?.imageUrl}
              onPress={handleGoToEvent}
            />
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
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  contentContainer: {
    marginHorizontal: 12,
    alignItems: "stretch",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderInput,
    marginVertical: 12,
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
