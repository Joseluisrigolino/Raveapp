import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Button, Text, IconButton } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import BuyTicket from "@/components/BuyTicketsComponent";
import ReviewComponent from "@/components/ReviewComponent";
import { ReviewItem } from "@/interfaces/ReviewProps";

import { getEventById } from "@/utils/eventHelpers";
import { EventItem } from "@/interfaces/EventProps";

// Importa tus estilos globales
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

// Reseñas de ejemplo (mock)
const mockReviews: ReviewItem[] = [
  {
    id: 1,
    user: "Usuario99",
    comment: "Me gustó mucho la fiesta. Gente muy agradable. Volvería a ir.",
    rating: 5,
    daysAgo: 6,
  },
  {
    id: 2,
    user: "Usuario27",
    comment: "Buena organización, pero faltó variedad de comida.",
    rating: 4,
    daysAgo: 6,
  },
];

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [eventData, setEventData] = useState<EventItem | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      const found = getEventById(Number(id));
      setEventData(found);
    }
  }, [id]);

  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Evento no encontrado.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  // Función para abrir Google Maps con la dirección
  const openMap = () => {
    const address = encodeURIComponent(eventData.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Imagen principal con botón de favorito */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: eventData.imageUrl }} style={styles.img} />
          <IconButton
            icon={isFavorite ? "heart" : "heart-outline"}
            iconColor={isFavorite ? COLORS.negative : COLORS.textPrimary}
            size={30}
            style={styles.heartButton}
            onPress={() => setIsFavorite(!isFavorite)}
          />
        </View>

        {/* Tarjeta con la info del evento */}
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>{eventData.title}</Text>

          {/* Fecha y hora */}
          <View style={styles.infoRow}>
            <IconButton
              icon="calendar"
              size={20}
              iconColor={COLORS.textPrimary}
              style={styles.iconNoPadding}
            />
            <Text style={styles.infoText}>
              {eventData.date} de {eventData.timeRange}
            </Text>
          </View>

          {/* Dirección */}
          <Text style={styles.addressText}>{eventData.address}</Text>

          {/* Botón "Cómo llegar" */}
          <TouchableOpacity style={styles.mapButton} onPress={openMap}>
            <Text style={styles.mapButtonText}>Cómo llegar</Text>
          </TouchableOpacity>

          {/* Descripción */}
          <Text style={styles.description}>{eventData.description}</Text>
        </View>

        {/* Tarjeta para comprar tickets */}
        <View style={styles.ticketCard}>
          <BuyTicket />

          {/* Botón comprar (debajo de BuyTicket) */}
          <View style={styles.buyButtonContainer}>
            <TouchableOpacity style={styles.buyButton}>
              <Text style={styles.buyButtonText}>Comprar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tarjeta con reseñas */}
        <View style={styles.reviewCard}>
          <ReviewComponent reviews={mockReviews} />
        </View>

      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Cuando no se encuentra el evento
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
  },

  // Imagen principal
  imageContainer: {
    position: "relative",
  },
  img: {
    width: "100%",
    height: 300,
  },
  heartButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
  },

  // Tarjeta con la info del evento
  eventCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.card,
    padding: 16,
    // Sombra suave
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTitle: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  iconNoPadding: {
    margin: 0,
  },
  infoText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
  },
  addressText: {
    marginBottom: 8,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  mapButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  mapButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
  },
  description: {
    marginTop: 4,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "justify",
    lineHeight: 20,
  },

  // Tarjeta para BuyTicket + botón comprar
  ticketCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.card,
    padding: 16,
    // Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  buyButtonContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  buyButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    width: 150,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  buyButtonText: {
    color: COLORS.cardBg,
    fontSize: FONT_SIZES.button,
    fontWeight: "bold",
  },

  // Tarjeta para reseñas
  reviewCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: RADIUS.card,
    padding: 16,
    // Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
