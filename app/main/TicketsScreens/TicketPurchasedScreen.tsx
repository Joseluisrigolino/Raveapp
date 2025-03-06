import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import QRCode from "react-native-qrcode-svg";

import { getTicketMenuById } from "@/utils/ticketMenuHelpers";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

export default function TicketPurchasedScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [ticketData, setTicketData] = useState<TicketPurchasedMenuItem | null>(
    null
  );

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
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>Ticket no encontrado.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Imagen principal del evento */}
        <Image
          source={{ uri: ticketData.imageUrl }}
          style={styles.eventImage}
        />

        <Text style={styles.eventTitle}>
          Entrada a: {ticketData.eventName}
        </Text>

        {/* Sección QR e info de la entrada */}
        <View style={styles.ticketContainer}>
          <View style={styles.qrContainer}>
            <QRCode
              value={`TicketID:${ticketData.id} - Event:${ticketData.eventName}`}
              size={120}
              color="black"
              backgroundColor="white"
            />

            <Text style={styles.ticketInfo}>
              Ticket: Entrada General
              {"\n"}
              Valor: $3000
              {"\n"}
              {ticketData.date}
              {"\n"}
              23:50hs a 07:00hs
            </Text>

            <Text style={styles.address}>Dirección de ejemplo</Text>

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
          * Una vez finalizado el evento, podrás dejar tu reseña...
        </Text>

        {/* Descripción del evento */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Descripción del evento</Text>
          <Text style={styles.descriptionText}>
            Aquí iría la descripción real...
          </Text>
        </View>

        {/* Reseñas, etc... */}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { padding: 16 },
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
