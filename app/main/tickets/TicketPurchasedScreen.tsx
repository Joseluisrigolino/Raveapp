// app/main/TicketsScreens/TicketPurchasedScreen.tsx
import React, { useState, useEffect } from "react";
import { ScrollView, Image, Text, StyleSheet, TouchableOpacity, View, ActivityIndicator, Dimensions, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";
import { getTicketMenuById } from "@/utils/tickets/ticketMenuHelpers";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

const screenWidth = Dimensions.get("window").width;
const QR_SIZE = 140;

function TicketPurchasedScreenContent() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [ticketData, setTicketData] = useState<TicketPurchasedMenuItem | null>(null);

  useEffect(() => {
    if (id) {
      const found = getTicketMenuById(Number(id));
      setTicketData(found || null);
    }
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!ticketData) return;
    const html = `
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h1>Entrada a: ${ticketData.eventName}</h1>
          <div>
            <img src="${ticketData.imageUrl}" width="300" style="border-radius: 10px;"/>
          </div>
          <div style="margin: 20px;">
            <p>Ticket ID: ${ticketData.id}</p>
            <p>Fecha: ${ticketData.date}</p>
            <p>Hora: 23:50 - 07:00</p>
          </div>
        </body>
      </html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
    } catch (err) {
      console.error("Error generando PDF:", err);
    }
  };

  if (!ticketData) {
    return (
      <SafeAreaView style={styles.loaderWrapper}>
        <Header />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Ticket no encontrado.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={{ uri: ticketData.imageUrl }}
          style={styles.eventImage}
        />

        <Text style={styles.title}>Entrada a: {ticketData.eventName}</Text>

        <View style={styles.qrSection}>
          <QRCode
            value={`TicketID:${ticketData.id}|Event:${ticketData.eventName}`}
            size={QR_SIZE}
            color={COLORS.textPrimary}
            backgroundColor={COLORS.cardBg}
          />
          <Text style={styles.ticketInfo}>
            🎫 General{"\n"}
            💵 $3000 {"\n"}
            📅 {ticketData.date}{"\n"}
            ⏰ 23:50 - 07:00
          </Text>

          <TouchableOpacity
            style={[styles.mapButton, { marginBottom: 12 }]}
            onPress={handleDownloadPDF}
          >
            <Text style={styles.mapButtonText}>Descargar entrada (PDF)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.mapButton}
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                ticketData.eventName
              )}`
            )
          }
        >
          <Text style={styles.mapButtonText}>Cómo llegar</Text>
        </TouchableOpacity>

        <Text style={styles.reviewNote}>
          * Una vez finalizado el evento, podrás dejar tu reseña...
        </Text>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Descripción del evento</Text>
          <Text style={styles.sectionText}>
            Aquí iría la descripción real del evento. Información útil,
            horarios, normas de ingreso y más, para que estés bien informado.
          </Text>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

export default function TicketPurchasedScreen() {
  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <TicketPurchasedScreenContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  loaderWrapper: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    alignItems: "center",
  },
  eventImage: {
    width: screenWidth - 32,
    height: 200,
    borderRadius: RADIUS.card,
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  qrSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    marginBottom: 16,
    width: "100%",
  },
  ticketInfo: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: FONT_SIZES.body * 1.5,
  },
  mapButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  mapButtonText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.button,
    color: COLORS.cardBg,
    textAlign: "center",
  },
  reviewNote: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: FONT_SIZES.smallText * 1.4,
  },
  descriptionSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    elevation: 2,
    width: "100%",
  },
  sectionTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  sectionText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.body * 1.5,
    textAlign: "justify",
  },
});
