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
import QRCode from "react-native-qrcode-svg";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";
import { getTicketMenuById } from "@/utils/tickets/ticketMenuHelpers";

// Importa tus estilos globales
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

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
        <View style={styles.notFoundContainer}>
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
        <Image source={{ uri: ticketData.imageUrl }} style={styles.eventImage} />

        <Text style={styles.eventTitle}>Entrada a: {ticketData.eventName}</Text>

        <View style={styles.ticketContainer}>
          <View style={styles.qrContainer}>
            <QRCode
              value={`TicketID:${ticketData.id} - Event:${ticketData.eventName}`}
              size={120}
              color="black"
              backgroundColor="white"
            />

            <Text style={styles.ticketInfo}>
              Ticket: Entrada General{"\n"}
              Valor: $3000{"\n"}
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

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Descripción del evento</Text>
          <Text style={styles.descriptionText}>
            Aquí iría la descripción real...
          </Text>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight, // "#fff"
  },
  notFoundContainer: {
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
    fontSize: FONT_SIZES.subTitle, // 18
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: COLORS.textPrimary,
  },
  ticketContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  qrContainer: {
    backgroundColor: COLORS.backgroundLight, // "#F3F3F3"
    padding: 16,
    borderRadius: RADIUS.card,
    alignItems: "center",
    width: "100%",
  },
  ticketInfo: {
    fontSize: FONT_SIZES.body, // 15
    textAlign: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    width: "100%",
    color: COLORS.textPrimary,
  },
  address: {
    fontSize: FONT_SIZES.smallText, // 13
    color: COLORS.textSecondary,     // "#555"
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
    backgroundColor: COLORS.textPrimary, // "#000"
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.card,
    marginHorizontal: 4,
  },
  buttonText: {
    color: COLORS.cardBg, // "#fff"
    fontSize: FONT_SIZES.smallText, // 14
  },
  reviewNote: {
    fontSize: FONT_SIZES.smallText, // 12
    color: COLORS.textSecondary,     // "#666"
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
    fontSize: FONT_SIZES.body, // 16
    fontWeight: "bold",
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  descriptionText: {
    fontSize: FONT_SIZES.body, // 14
    color: COLORS.textPrimary,
  },
});
