import React from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import { TicketPurchased } from "@/interfaces/TicketPurchasedProps";
import QRCode from "react-native-qrcode-svg";

// Importamos el nuevo ReviewComponent y la interfaz ReviewItem
import ReviewComponent from "@/components/ReviewComponent";
import { ReviewItem } from "@/interfaces/ReviewProps";

// Datos estáticos de ejemplo para el ticket (simulando que vendrán de una API)
const mockTicketData: TicketPurchased = {
  ticketId: "ABC123XYZ",
  eventName: "Nombre del evento",
  ticketType: "Entrada General",
  ticketPrice: 3000,
  date: "29/2/2024",
  timeRange: "23:50hs a 07:00hs",
  address: "Av. Cnel. Niceto Vega 6599 - Capital Federal",
  eventImageUrl: "https://picsum.photos/800/400",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus in suscipit quam. Sed lacinia, tortor a tincidunt efficitur, dui erat facilisis leo, et aliquam magna turpis vel nisl.",
};

// Datos estáticos de ejemplo para reseñas
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

export default function TicketPurchasedScreen() {
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

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Imagen principal del evento */}
        <Image source={{ uri: eventImageUrl }} style={styles.eventImage} />

        <Text style={styles.eventTitle}>Entrada a: {eventName}</Text>

        {/* Sección QR e info de la entrada */}
        <View style={styles.ticketContainer}>
          <View style={styles.qrContainer}>
            <QRCode
              value={`TicketID:${ticketId} - Event:${eventName}`}
              size={120}
              color="black"
              backgroundColor="white"
            />

            <Text style={styles.ticketInfo}>
              Ticket: {ticketType}
              {"\n"}
              Valor: ${ticketPrice}
              {"\n"}
              {date}
              {"\n"}
              {timeRange}
            </Text>

            <Text style={styles.address}>{address}</Text>

            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Descargar entrada</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Cómo llegar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.reviewNote}>
          * Una vez finalizado el evento, podrás dejar tu reseña.{"\n"}
          [Sólo aplica para eventos de boliches, no se pueden dejar reseñas de
          visitas puntuales de djs]
        </Text>

        {/* Descripción del evento */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Descripción del evento</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>

        {/* NUEVO: Sección de reseñas con la nueva UI (estrellas, promedio, etc.) */}
        <ReviewComponent reviews={mockReviews} />
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
    marginBottom: 12,
    textAlign: "center",
  },
  ticketContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  qrContainer: {
    backgroundColor: "#F3F3F3",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  ticketInfo: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    width: "100%",
  },
  address: {
    fontSize: 13,
    color: "#555",
    marginBottom: 12,
    textAlign: "center",
    flexWrap: "wrap",
    width: "100%",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
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
});
