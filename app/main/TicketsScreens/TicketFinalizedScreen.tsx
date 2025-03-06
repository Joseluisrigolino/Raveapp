import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // o "react-native-vector-icons/MaterialCommunityIcons"
import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import { TicketPurchased } from "@/interfaces/TicketPurchasedProps";
import ReviewComponent from "@/components/ReviewComponent";
import { ReviewItem } from "@/interfaces/ReviewProps";

const mockTicketData: TicketPurchased = {
  ticketId: "ABC123XYZ",
  eventName: "Nombre del evento",
  ticketType: "Entrada General",
  ticketPrice: 3000,
  date: "09/12/2024",
  timeRange: "23:50hs a 07:00hs",
  address: "Av. Cnel. Niceto Vega 6599 - Capital Federal",
  eventImageUrl: "https://picsum.photos/800/400",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus in suscipit quam. Sed lacinia, tortor a tincidunt efficitur, dui erat facilisis leo, et aliquam magna turpis vel nisl.",
};

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
  const {
    ticketId,
    eventName,
    ticketType,
    ticketPrice,
    date,
    timeRange,
    address,
    eventImageUrl,
    description,
  } = mockTicketData;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

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
        <Image source={{ uri: eventImageUrl }} style={styles.eventImage} />
        <Text style={styles.eventTitle}>Entrada a: {eventName}</Text>

        <Text style={styles.finalizedLabel}>Evento finalizado</Text>

        <View style={styles.ticketContainer}>
          <View style={styles.infoContainer}>
            {/* numberOfLines={0} para permitir varias líneas */}
            <Text style={styles.ticketInfo} numberOfLines={0}>
              Ticket: {ticketType}
              {"\n"}
              Valor: ${ticketPrice}
              {"\n"}
              {date}
              {"\n"}
              {timeRange}
            </Text>

            {/* También numberOfLines={0} y flexWrap si fuera necesario */}
            <Text style={styles.address} numberOfLines={0}>
              {address}
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
            {description}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  // Ojo con alignItems: "center" en el contenedor,
  // a veces reduce el ancho real para el texto.
  infoContainer: {
    backgroundColor: "#F3F3F3",
    padding: 16,
    borderRadius: 8,
    width: "100%", // se expande al ancho total
    // alignItems: "center", // si quitas esto, el texto usará todo el ancho
  },
  ticketInfo: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
    // flexWrap: "wrap", // se activa si se necesita
    // width: "100%", // a veces innecesario
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
