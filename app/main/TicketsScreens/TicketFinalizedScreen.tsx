import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ReviewComponent from "@/components/ReviewComponent";
import { ReviewItem } from "@/interfaces/ReviewProps";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";
import { getTicketMenuById } from "@/utils/ticketMenuHelpers";

// Importa tus estilos globales
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/** Reseñas de ejemplo */
const mockReviews: ReviewItem[] = [
  {
    id: 1,
    user: "Carlos",
    comment: "Estuvo increíble, volvería a comprar.",
    rating: 5,
    daysAgo: 2,
  },
  {
    id: 2,
    user: "Ana",
    comment: "Buena organización, pero faltó variedad de comida.",
    rating: 4,
    daysAgo: 3,
  },
];

export default function TicketFinalizedScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [ticketData, setTicketData] = useState<TicketPurchasedMenuItem | null>(
    null
  );

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (id) {
      const found = getTicketMenuById(Number(id));
      if (found) {
        setTicketData(found);
      }
    }
  }, [id]);

  if (!ticketData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.contentWrapper}>
          <Text>Ticket no encontrado.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  const handleStarPress = (starValue: number) => setRating(starValue);

  const handleSendReview = () => {
    console.log("Review enviada:", { rating, comment });
    setRating(0);
    setComment("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={{ uri: ticketData.imageUrl }} style={styles.eventImage} />
        <Text style={styles.eventTitle}>Entrada a: {ticketData.eventName}</Text>

        <Text style={styles.finalizedLabel}>Evento finalizado</Text>

        <View style={styles.ticketContainer}>
          <View style={styles.infoContainer}>
            <Text style={styles.ticketInfo} numberOfLines={0}>
              Ticket: Entrada General{"\n"}Valor: $3000{"\n"}
              {ticketData.date}
              {"\n"}
              23:50hs a 07:00hs
            </Text>
            <Text style={styles.address} numberOfLines={0}>
              Dirección de ejemplo
            </Text>
          </View>
        </View>

        <Text style={styles.reviewNote}>
          * Una vez finalizado el evento, podrás dejar tu reseña.{"\n"}
          [Sólo aplica para eventos de boliches...]
        </Text>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Descripción del evento</Text>
          <Text style={styles.descriptionText} numberOfLines={0}>
            Aquí iría la descripción real...
          </Text>
        </View>

        <ReviewComponent reviews={mockReviews} />

        <View style={styles.addReviewContainer}>
          <Text style={styles.addReviewTitle}>
            Comenta qué te pareció la fiesta:
          </Text>

          <Text style={styles.addReviewSubtitle}>
            Puntuación de 1 a 5 estrellas:
          </Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity key={value} onPress={() => handleStarPress(value)}>
                <MaterialCommunityIcons
                  name={value <= rating ? "star" : "star-outline"}
                  size={24}
                  color={value <= rating ? COLORS.starFilled : COLORS.starEmpty}
                  style={{ marginRight: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.addReviewSubtitle}>Tu comentario:</Text>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe tu comentario..."
              multiline
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSendReview}>
            <Text style={styles.submitButtonText}>Enviar reseña</Text>
          </TouchableOpacity>
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
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    padding: 16,
  },
  eventImage: {
    width: "100%",
    height: 200,
    marginBottom: 12,
    borderRadius: RADIUS.card,
  },
  eventTitle: {
    fontSize: FONT_SIZES.subTitle, // 18-20
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.textPrimary,
  },
  finalizedLabel: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
    fontSize: FONT_SIZES.smallText, // 14
    color: COLORS.negative, // "red"
    fontWeight: "bold",
  },
  ticketContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: COLORS.backgroundLight, // "#F3F3F3"
    padding: 16,
    borderRadius: RADIUS.card,
    width: "100%",
  },
  ticketInfo: {
    fontSize: FONT_SIZES.body, // 14-16
    textAlign: "center",
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  address: {
    fontSize: FONT_SIZES.smallText, // 13-14
    color: COLORS.textSecondary,     // "#555"
    marginBottom: 12,
    textAlign: "center",
  },
  reviewNote: {
    fontSize: FONT_SIZES.smallText, // 12-14
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 18,
  },
  descriptionContainer: {
    backgroundColor: COLORS.backgroundLight, // "#F3F3F3"
    padding: 16,
    borderRadius: RADIUS.card,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  descriptionText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  addReviewContainer: {
    backgroundColor: COLORS.cardBg, // "#fff"
    padding: 16,
    borderRadius: RADIUS.card,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderInput, // "#ddd"
  },
  addReviewTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  addReviewSubtitle: {
    fontSize: FONT_SIZES.body,
    marginBottom: 4,
    color: COLORS.textPrimary,
  },
  starRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  commentInputContainer: {
    backgroundColor: COLORS.backgroundLight, // "#F3F3F3"
    borderRadius: RADIUS.card,
    marginBottom: 12,
  },
  commentInput: {
    minHeight: 60,
    padding: 8,
    textAlignVertical: "top",
    color: COLORS.textPrimary,
  },
  submitButton: {
    backgroundColor: COLORS.textPrimary, // "#000"
    paddingVertical: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
  },
  submitButtonText: {
    color: COLORS.cardBg, // "#fff"
    fontSize: FONT_SIZES.body, // 15
    fontWeight: "bold",
  },
});
