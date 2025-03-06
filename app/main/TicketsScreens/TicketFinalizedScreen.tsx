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

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import ReviewComponent from "@/components/ReviewComponent";
import { ReviewItem } from "@/interfaces/ReviewProps";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";
// Este helper podría tener un mock o un fetch a tu API
import { getTicketMenuById } from "@/utils/ticketMenuHelpers";

/** Reseñas de ejemplo (luego podrías traerlas de tu API) */
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
  // 1. Leemos el param "id"
  const { id } = useLocalSearchParams<{ id?: string }>();

  // 2. Estado para guardar la data del ticket
  const [ticketData, setTicketData] = useState<TicketPurchasedMenuItem | null>(null);

  // 3. Estados para la reseña del usuario
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // 4. Al montar o cambiar "id", buscamos el ticket en el helper (o API)
  useEffect(() => {
    if (id) {
      const found = getTicketMenuById(Number(id));
      if (found) {
        setTicketData(found);
      }
    }
  }, [id]);

  // 5. Si no se encontró el ticket, mostrar un mensaje
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

  // Manejo de estrellas
  const handleStarPress = (starValue: number) => setRating(starValue);

  // Al enviar reseña
  const handleSendReview = () => {
    console.log("Review enviada:", { rating, comment });
    // Aquí podrías hacer un POST a tu API
    setRating(0);
    setComment("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Imagen del evento (ejemplo) */}
        <Image source={{ uri: ticketData.imageUrl }} style={styles.eventImage} />
        <Text style={styles.eventTitle}>Entrada a: {ticketData.eventName}</Text>

        <Text style={styles.finalizedLabel}>Evento finalizado</Text>

        {/* Info del ticket */}
        <View style={styles.ticketContainer}>
          <View style={styles.infoContainer}>
            <Text style={styles.ticketInfo} numberOfLines={0}>
              Ticket: Entrada General
              {"\n"}Valor: $3000
              {"\n"}
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
          [Sólo aplica para eventos de boliches, no se pueden dejar reseñas de
          visitas puntuales de djs]
        </Text>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Descripción del evento</Text>
          <Text style={styles.descriptionText} numberOfLines={0}>
            Aquí iría la descripción real...
          </Text>
        </View>

        {/* Reseñas existentes */}
        <ReviewComponent reviews={mockReviews} />

        {/* Formulario para dejar una nueva reseña */}
        <View style={styles.addReviewContainer}>
          <Text style={styles.addReviewTitle}>
            Comenta qué te pareció la fiesta:
          </Text>

          <Text style={styles.addReviewSubtitle}>
            Puntuación de 1 a 5 estrellas:
          </Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => handleStarPress(value)}
              >
                <MaterialCommunityIcons
                  name={value <= rating ? "star" : "star-outline"}
                  size={24}
                  color={value <= rating ? "#FFD700" : "#ccc"}
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

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSendReview}
          >
            <Text style={styles.submitButtonText}>Enviar reseña</Text>
          </TouchableOpacity>
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
    backgroundColor: "#fff",
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
    borderRadius: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  finalizedLabel: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
    fontSize: 14,
    color: "red",
    fontWeight: "bold",
  },
  ticketContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: "#F3F3F3",
    padding: 16,
    borderRadius: 8,
    width: "100%",
  },
  ticketInfo: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
  },
  address: {
    fontSize: 13,
    color: "#555",
    marginBottom: 12,
    textAlign: "center",
  },
  reviewNote: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 18,
  },
  descriptionContainer: {
    backgroundColor: "#F3F3F3",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: "#333",
  },
  addReviewContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  addReviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  addReviewSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  starRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  commentInputContainer: {
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    marginBottom: 12,
  },
  commentInput: {
    minHeight: 60,
    padding: 8,
    textAlignVertical: "top", // Para Android
  },
  submitButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
