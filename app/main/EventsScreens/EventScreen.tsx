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
import { Text, IconButton } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import ReviewComponent from "@/components/ReviewComponent";
import { ReviewItem } from "@/interfaces/ReviewProps";
import { getEventById, ExtendedEventItem } from "@/utils/eventHelpers";

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

/** Componente para renderizar la información de entradas (solo a modo resumen). */
function TicketsOverview({ eventData }: { eventData: ExtendedEventItem }) {
  return (
    <View>
      {eventData.ticketsByDay.map((dayInfo, index) => {
        const dayLabel =
          eventData.days === 1
            ? "Día único"
            : `Día ${dayInfo.dayNumber} de ${eventData.days}`;

        return (
          <View key={index} style={styles.dayTicketBlock}>
            <Text style={styles.dayLabel}>{dayLabel}</Text>

            {dayInfo.genEarlyQty > 0 && (
              <Text style={styles.ticketLine}>
                • Generales Early Birds (${dayInfo.genEarlyPrice})
              </Text>
            )}
            {dayInfo.vipEarlyQty > 0 && (
              <Text style={styles.ticketLine}>
                • VIP Early Birds (${dayInfo.vipEarlyPrice})
              </Text>
            )}
            {dayInfo.genQty > 0 && (
              <Text style={styles.ticketLine}>
                • Generales (${dayInfo.genPrice})
              </Text>
            )}
            {dayInfo.vipQty > 0 && (
              <Text style={styles.ticketLine}>
                • VIP (${dayInfo.vipPrice})
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function EventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [eventData, setEventData] = useState<ExtendedEventItem | null>(null);
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

  // Función para abrir Google Maps
  const openMap = () => {
    const address = encodeURIComponent(eventData.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(url);
  };

  // Navegar a BuyTicketScreen con el ID del evento
  const handleBuyPress = () => {
    router.push(`/main/TicketsScreens/BuyTicketScreen?id=${eventData.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Imagen principal */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: eventData.imageUrl }} style={styles.img} />
        </View>

        {/* Tarjeta con la info del evento */}
        <View style={styles.eventCard}>
          {/* Fila con el título y el ícono de corazón */}
          <View style={styles.titleRow}>
            <Text style={styles.eventTitle}>{eventData.title}</Text>

            <IconButton
              icon={isFavorite ? "heart" : "heart-outline"}
              iconColor={isFavorite ? COLORS.negative : COLORS.textPrimary}
              size={30}
              style={styles.heartIcon}
              onPress={() => setIsFavorite(!isFavorite)}
            />
          </View>

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

        {/* Resumen de tickets disponibles */}
        <View style={styles.ticketCard}>
          <Text style={styles.ticketCardTitle}>Entradas disponibles:</Text>
          <TicketsOverview eventData={eventData} />

          {/* Botón comprar */}
          <View style={styles.buyButtonContainer}>
            <TouchableOpacity style={styles.buyButton} onPress={handleBuyPress}>
              <Text style={styles.buyButtonText}>Comprar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reseñas solo si es recurrente (ej. eventData.isRecurrent === true) */}
        {eventData.isRecurrent && (
          <View style={styles.reviewCard}>
            <ReviewComponent reviews={mockReviews} />
          </View>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

// Estilos de EventScreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 24,
  },
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
    width: "100%",
    height: 300,
    backgroundColor: COLORS.borderInput,
  },
  img: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // Tarjeta con la info del evento
  eventCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.card,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventTitle: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
    maxWidth: "85%",
  },
  heartIcon: {
    backgroundColor: "transparent",
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

  // Tarjeta de tickets
  ticketCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.card,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketCardTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  dayTicketBlock: {
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.info,
    marginBottom: 4,
  },
  ticketLine: {
    marginLeft: 12,
    color: COLORS.textSecondary,
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

  // Reseñas
  reviewCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: RADIUS.card,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
