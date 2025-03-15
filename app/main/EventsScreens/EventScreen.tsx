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
import { Button, Text, Title, IconButton } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import BuyTicket from "@/components/BuyTicketsComponent";
import ReviewComponent from "@/components/ReviewComponent";
import { ReviewItem } from "@/interfaces/ReviewProps";

import { getEventById } from "@/utils/eventHelpers";
import { EventItem } from "@/interfaces/EventProps";

// Importa tus estilos globales
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

// Reseñas de ejemplo
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
    comment:
      "Buena organización, pero faltó variedad de comida.",
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
          <Text>Evento no encontrado.</Text>
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

      <ScrollView showsVerticalScrollIndicator={false}>
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

        <Title style={styles.title}>{eventData.title}</Title>

        <View style={styles.info}>
          {/* Botón con ícono de calendario + texto */}
          <Button icon="calendar" labelStyle={styles.iconLabel}>
            <Text style={styles.buttonText}>
              {eventData.date} de {eventData.timeRange}
            </Text>
          </Button>

          {/* Dirección (texto normal) */}
          <Text style={styles.addressText}>{eventData.address}</Text>

          {/* Botón "Como llegar" para abrir Google Maps */}
          <TouchableOpacity style={styles.mapButton} onPress={openMap}>
            <Text style={styles.mapButtonText}>Como llegar</Text>
          </TouchableOpacity>

          {/* Descripción */}
          <Text style={styles.description}>{eventData.description}</Text>
        </View>

        {/* Sección para comprar tickets */}
        <BuyTicket />

        <View style={styles.btnBuyView}>
          <TouchableOpacity style={styles.btnBuy}>
            <Text style={styles.btnBuyTxt}>Comprar</Text>
          </TouchableOpacity>
        </View>

        {/* Reseñas */}
        <ReviewComponent reviews={mockReviews} />
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
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
  },
  img: {
    width: "100%",
    height: 300,
    alignSelf: "flex-start",
  },
  heartButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
  },
  title: {
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
  },
  info: {
    alignItems: "flex-start",
    marginLeft: 8,
    marginTop: 8,
  },
  iconLabel: {
    color: COLORS.textPrimary,
  },
  buttonText: {
    color: COLORS.textPrimary,
  },
  addressText: {
    marginTop: 6,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  mapButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  mapButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
  },
  description: {
    margin: 10,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  btnBuyView: {
    alignItems: "flex-end",
    marginRight: 20,
  },
  btnBuy: {
    backgroundColor: COLORS.textPrimary,
    height: 50,
    width: 150,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RADIUS.card,
  },
  btnBuyTxt: {
    color: COLORS.cardBg,
    fontSize: FONT_SIZES.button,
    fontWeight: "bold",
  },
});
