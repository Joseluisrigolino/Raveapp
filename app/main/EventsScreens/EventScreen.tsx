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
import SoundCloud from "@/components/SocialMediaComponents/SoundCloudComponent";
import ReviewComponent from "@/components/ReviewComponent";
import { ReviewItem } from "@/interfaces/ReviewProps";

import { getEventById } from "@/utils/eventHelpers";
import { EventItem } from "@/interfaces/EventProps";

// Importa tus estilos globales
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

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
      "Me gustó mucho la fiesta. La única crítica es que esperé 15 minutos en la fila para ingresar.",
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

  // openMap con la dirección real
  const openMap = () => {
    const address = encodeURIComponent(eventData.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
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
          <Button icon="calendar" labelStyle={styles.iconLabel}>
            <Text style={styles.buttonText}>
              {eventData.date} de {eventData.timeRange}
            </Text>
          </Button>
          <Button icon="map-marker" labelStyle={styles.iconLabel} onPress={openMap}>
            <Text style={styles.mapText}>{eventData.address}</Text>
          </Button>
          <Text style={styles.description}>{eventData.description}</Text>
        </View>

        <BuyTicket />

        <View style={styles.btnBuyView}>
          <TouchableOpacity style={styles.btnBuy}>
            <Text style={styles.btnBuyTxt}>Comprar</Text>
          </TouchableOpacity>
        </View>

        {/* Ejemplo de SoundCloud (opcional) */}
        {/* <SoundCloud trackUrl="https://soundcloud.com/skrillex/sets/skrillex-remixes" /> */}

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
    backgroundColor: COLORS.backgroundLight, // Fondo claro principal
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
    backgroundColor: COLORS.cardBg, // Blanco
    borderRadius: 20,
  },
  title: {
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: FONT_SIZES.subTitle, // 18-20
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
  mapText: {
    color: COLORS.info, // Un color "azul" o "naranja", como prefieras
    textDecorationLine: "underline",
  },
  description: {
    margin: 10,
    fontSize: FONT_SIZES.body, // 14-16
    color: COLORS.textPrimary,
  },
  btnBuyView: {
    alignItems: "flex-end",
    marginRight: 20,
  },
  btnBuy: {
    backgroundColor: COLORS.textPrimary, // "#000000"
    height: 50,
    width: 150,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RADIUS.card,
  },
  btnBuyTxt: {
    color: COLORS.cardBg, // Blanco
    fontSize: FONT_SIZES.button, // 16-18
    fontWeight: "bold",
  },
});
