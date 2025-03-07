// owner/TicketsSoldScreen.tsx
import React, { useState, useEffect } from "react";
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";

import { OwnerEventTicketsSoldData } from "@/interfaces/OwnerEventTicketsSold";
import { getTicketsSoldDataById } from "@/utils/ownerEventTicketsSoldHelper";

// Importa tu globalStyles
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function TicketsSoldScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [ticketsSoldData, setTicketsSoldData] = useState<OwnerEventTicketsSoldData | null>(null);

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
        <View style={styles.contentWrapper}>
          <Text>No se encontró información de entradas vendidas para este evento.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          Entradas vendidas de {ticketsSoldData.eventName}
        </Text>

        <Text style={styles.subInfo}>
          Información al {ticketsSoldData.lastUpdate}
        </Text>

        {/* Tabla de entradas vendidas */}
        <View style={styles.tableContainer}>
          {/* Encabezado de la tabla */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCell, styles.typeCell]}>Tipo de entrada</Text>
            <Text style={[styles.headerCell, styles.priceCell]}>Precio</Text>
            <Text style={[styles.headerCell, styles.qtyCell]}>Cantidad</Text>
            <Text style={[styles.headerCell, styles.totalCell]}>Total</Text>
            <Text style={[styles.headerCell, styles.stockCell]}>Aún en stock</Text>
          </View>

          {/* Filas */}
          {ticketsSoldData.rows.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cell, styles.typeCell]}>{row.type}</Text>
              <Text style={[styles.cell, styles.priceCell]}>
                ${row.price.toLocaleString()}
              </Text>
              <Text style={[styles.cell, styles.qtyCell]}>{row.quantity}</Text>
              <Text style={[styles.cell, styles.totalCell]}>
                ${row.total.toLocaleString()}
              </Text>
              <Text style={[styles.cell, styles.stockCell]}>{row.inStock}</Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <Text style={styles.footerText}>
          Total de entradas vendidas:{" "}
          <Text style={styles.totalNumber}>{ticketsSoldData.totalTickets}</Text>
        </Text>
        <Text style={styles.footerText}>
          Total recaudado al momento:{" "}
          <Text style={styles.totalMoney}>
            ${ticketsSoldData.totalRevenue.toLocaleString()}
          </Text>
        </Text>

        {/* Botón Volver */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

// Estilos
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
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: FONT_SIZES.subTitle, // 18-20
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subInfo: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    overflow: "hidden",
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.textPrimary, // por ejemplo, un fondo oscuro
    padding: 8,
  },
  headerCell: {
    fontWeight: "bold",
    color: COLORS.cardBg, // blanco
    fontSize: FONT_SIZES.smallText,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderInput,
  },
  cell: {
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textPrimary,
  },
  // Ajustes de ancho (puedes cambiar flex para adaptarlo)
  typeCell: {
    flex: 2,
  },
  priceCell: {
    flex: 1,
    textAlign: "right",
  },
  qtyCell: {
    flex: 1,
    textAlign: "right",
  },
  totalCell: {
    flex: 1,
    textAlign: "right",
  },
  stockCell: {
    flex: 1,
    textAlign: "right",
  },
  footerText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  totalNumber: {
    fontWeight: "bold",
    color: COLORS.info, // un color llamativo
  },
  totalMoney: {
    fontWeight: "bold",
    color: COLORS.positive, // verde, p.ej.
  },
  backButton: {
    backgroundColor: COLORS.alternative, // un azul oscuro
    paddingVertical: 10,
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
