// owner/TicketsSoldScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";

import { OwnerEventTicketsSoldData } from "@/interfaces/OwnerEventTicketsSold";
import { getTicketsSoldDataById } from "@/utils/owners/ownerEventTicketsSoldHelper";

// Importa tus estilos globales
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function TicketsSoldScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [ticketsSoldData, setTicketsSoldData] =
    useState<OwnerEventTicketsSoldData | null>(null);

  useEffect(() => {
    if (id) {
      const found = getTicketsSoldDataById(Number(id));
      if (found) {
        setTicketsSoldData(found);
      }
    }
  }, [id]);

  if (!ticketsSoldData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.notFoundWrapper}>
          <Text style={styles.notFoundText}>
            No se encontró información de entradas vendidas para este evento.
          </Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Título principal */}
        <Text style={styles.title}>
          Entradas vendidas de {ticketsSoldData.eventName}
        </Text>

        <Text style={styles.subInfo}>
          Información al {ticketsSoldData.lastUpdate}
        </Text>

        {/* Tarjetas de entradas vendidas */}
        <View style={styles.cardsContainer}>
          {ticketsSoldData.rows.map((row, index) => (
            <View key={index} style={styles.ticketCard}>
              <Text style={styles.ticketTitle}>{row.type}</Text>

              <View style={styles.ticketInfoRow}>
                <Text style={styles.label}>Precio:</Text>
                <Text style={styles.value}>
                  ${row.price.toLocaleString()}
                </Text>
              </View>

              <View style={styles.ticketInfoRow}>
                <Text style={styles.label}>Cantidad:</Text>
                <Text style={styles.value}>{row.quantity}</Text>
              </View>

              <View style={styles.ticketInfoRow}>
                <Text style={styles.label}>Total:</Text>
                <Text style={styles.value}>
                  ${row.total.toLocaleString()}
                </Text>
              </View>

              <View style={styles.ticketInfoRow}>
                <Text style={styles.label}>En stock:</Text>
                <Text style={styles.value}>{row.inStock}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totales */}
        <Text style={styles.footerText}>
          Total de entradas vendidas:{" "}
          <Text style={styles.totalNumber}>
            {ticketsSoldData.totalTickets}
          </Text>
        </Text>
        <Text style={styles.footerText}>
          Total recaudado al momento:{" "}
          <Text style={styles.totalMoney}>
            ${ticketsSoldData.totalRevenue.toLocaleString()}
          </Text>
        </Text>

        {/* Botón Volver */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
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
  notFoundWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32, // un poco más de espacio al final
  },
  title: {
    fontSize: FONT_SIZES.subTitle, // 18-20
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subInfo: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },

  // Contenedor para las tarjetas
  cardsContainer: {
    marginBottom: 16,
  },
  // Cada tarjeta de ticket
  ticketCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    // Sombra suave (opcional)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  ticketInfoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    marginRight: 4,
  },
  value: {
    color: COLORS.textPrimary,
  },

  // Totales al final
  footerText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  totalNumber: {
    fontWeight: "bold",
    color: COLORS.info,
  },
  totalMoney: {
    fontWeight: "bold",
    color: COLORS.positive, // verde
  },

  // Botón "Volver"
  backButton: {
    backgroundColor: COLORS.alternative, // un color azul/oscuro
    paddingVertical: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
    marginTop: 16,
  },
  backButtonText: {
    color: COLORS.cardBg, // blanco
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
  },
});
