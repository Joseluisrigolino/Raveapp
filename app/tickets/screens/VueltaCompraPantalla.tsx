import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";

import { confirmarPagoMP } from "@/app/events/apis/entradaApi";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";
import ROUTES from "@/routes";

export default function VueltaCompraPantalla() {
  const router = useRouter();
  const {
    id,
    idPagoMP,
    payment_id,
    collection_id,
    paymentId,
    paymentid,
  } = useLocalSearchParams<{
    id?: string;
    idPagoMP?: string;
    payment_id?: string;
    collection_id?: string;
    paymentId?: string;
    paymentid?: string;
  }>();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const pagoId = (idPagoMP || payment_id || collection_id || paymentId || paymentid)
          ? String(idPagoMP || payment_id || collection_id || paymentId || paymentid)
          : undefined;
        try {
          console.log('[VueltaCompraPantalla] payment_id candidates:', {
            idPagoMP,
            payment_id,
            collection_id,
            paymentId,
            paymentid,
            chosen: pagoId,
          });
        } catch {}
        if (!pagoId) return;
        setProcessing(true);
        // Confirmar pago en backend (actualiza estados automáticamente)
        try {
          await confirmarPagoMP(pagoId);
        } catch (err) {
          console.warn('[VueltaCompraPantalla] confirmarPagoMP fallo:', err);
          Alert.alert('Pago recibido', "Tu pago fue recibido. Si no ves tu entrada en 'Mis entradas', contactá con soporte.");
        }
      } finally {
        setProcessing(false);
      }
    })();
  }, [idPagoMP, payment_id, collection_id, paymentId, paymentid]);

  const handleGoToTickets = () => {
    router.replace(ROUTES.MAIN.TICKETS.MENU);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✓</Text>
          </View>
          <Text style={styles.title}>¡Gracias por tu compra!</Text>
          <Text style={styles.subtitle}>
            Una vez que se procese el pago, recibirás por mail la entrada del evento, y también
            podrás ver tu entrada en la sección <Text style={styles.link} onPress={handleGoToTickets}>mis entradas</Text>.
          </Text>
        </View>
      </View>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "94%",
    backgroundColor: "#EFFFF3",
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#BDE5C8",
    alignItems: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#CFF6DA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  iconText: {
    color: "#2E7D32",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 30,
  },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: FONT_SIZES.body * 1.4,
  },
  link: {
    color: COLORS.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
