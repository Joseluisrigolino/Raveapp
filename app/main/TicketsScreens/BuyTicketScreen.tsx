// src/screens/BuyTicketScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import { getEventById, ExtendedEventItem } from "@/utils/events/eventHelpers";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

// Datos del comprador
interface BuyerInfo {
  firstName: string;
  lastName: string;
  idType: string;
  idNumber: string;
  email: string;
  confirmEmail: string;
  phone: string;
}

/**
 * Ej: {
 *   "day1-genEarly": 2,
 *   "day1-vip": 1,
 *   "day2-gen": 3,
 *   ...
 * }
 */
interface SelectedTickets {
  [key: string]: number;
}

function BuyTicketScreenContent() {
  const { id, selection } = useLocalSearchParams<{
    id?: string;
    selection?: string;
  }>();

  const [eventData, setEventData] = useState<ExtendedEventItem | null>(null);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    firstName: "",
    lastName: "",
    idType: "DNI",
    idNumber: "",
    email: "",
    confirmEmail: "",
    phone: "",
  });
  const [selectedTickets, setSelectedTickets] = useState<SelectedTickets>({});
  const [serviceFee] = useState(320); // cargo de servicio fijo

  useEffect(() => {
    if (id) {
      const found = getEventById(Number(id));
      setEventData(found);
    }
    if (selection) {
      try {
        const parsed = JSON.parse(decodeURIComponent(selection));
        setSelectedTickets(parsed);
      } catch (err) {
        console.log("Error al parsear selection:", err);
      }
    }
  }, [id, selection]);

  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>No se encontró el evento.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  const handleChangeBuyerInfo = (field: keyof BuyerInfo, value: string) => {
    setBuyerInfo((prev) => ({ ...prev, [field]: value }));
  };

  function getDayTicketsSummary(
    dayInfo: ExtendedEventItem["ticketsByDay"][number],
    baseKey: string
  ) {
    const lines: { label: string; qty: number }[] = [];
    let daySubtotal = 0;
    const mapping: Array<["genEarly"|"vipEarly"|"gen"|"vip", number, number, string]> = [
      ["genEarly", dayInfo.genEarlyQty, dayInfo.genEarlyPrice, "Generales Early Birds"],
      ["vipEarly", dayInfo.vipEarlyQty, dayInfo.vipEarlyPrice, "VIP Early Birds"],
      ["gen", dayInfo.genQty, dayInfo.genPrice, "Generales"],
      ["vip", dayInfo.vipQty, dayInfo.vipPrice, "VIP"],
    ];
    mapping.forEach(([suffix, max, price, label]) => {
      if (max > 0) {
        const key = `${baseKey}-${suffix}`;
        const qty = selectedTickets[key] || 0;
        if (qty > 0) {
          lines.push({ label, qty });
          daySubtotal += qty * price;
        }
      }
    });
    return { lines, daySubtotal };
  }

  const calculateSubtotal = (): number => {
    return eventData.ticketsByDay.reduce((sum, dayInfo) => {
      const { daySubtotal } = getDayTicketsSummary(
        dayInfo,
        `day${dayInfo.dayNumber}`
      );
      return sum + daySubtotal;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const total = subtotal + serviceFee;

  const handleConfirmPurchase = () => {
    console.log("Datos comprador:", buyerInfo);
    console.log("selectedTickets:", selectedTickets);
    console.log("subtotal:", subtotal, " serviceFee:", serviceFee, " total:", total);
    alert("Compra confirmada (ejemplo). Ir a MercadoPago...");
  };

  function dayLabel(dayNumber: number, totalDays: number) {
    return totalDays === 1
      ? "Día único"
      : `Día ${dayNumber} de ${totalDays}`;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Finalizar compra</Text>
        <Text style={styles.eventName}>{eventData.title}</Text>

        <View style={styles.ticketSummary}>
          <Text style={styles.summaryTitle}>Entradas seleccionadas:</Text>
          {eventData.ticketsByDay.map((dayInfo) => {
            const baseKey = `day${dayInfo.dayNumber}`;
            const { lines, daySubtotal } = getDayTicketsSummary(dayInfo, baseKey);
            if (!lines.length) return null;
            return (
              <View key={dayInfo.dayNumber} style={styles.daySummaryBlock}>
                <Text style={styles.daySummaryTitle}>
                  {dayLabel(dayInfo.dayNumber, eventData.days)}
                </Text>
                {lines.map((line, idx) => (
                  <Text key={idx} style={styles.ticketLine}>
                    • {line.label} x {line.qty}
                  </Text>
                ))}
                {eventData.days > 1 && (
                  <Text style={styles.daySubtotal}>
                    Subtotal día {dayInfo.dayNumber}: ${daySubtotal}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Datos del comprador:</Text>
        <View style={styles.buyerForm}>
          {/* Nombre / Apellido */}
          <View style={styles.formRow}>
            <View style={styles.halfInputContainer}>
              <Text style={styles.label}>Nombre:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={buyerInfo.firstName}
                onChangeText={(val) => handleChangeBuyerInfo("firstName", val)}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <Text style={styles.label}>Apellido:</Text>
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                value={buyerInfo.lastName}
                onChangeText={(val) => handleChangeBuyerInfo("lastName", val)}
              />
            </View>
          </View>
          {/* ID Type / Number */}
          <View style={styles.formRow}>
            <View style={styles.halfInputContainer}>
              <Text style={styles.label}>Tipo ID:</Text>
              <TextInput
                style={styles.input}
                placeholder="DNI"
                value={buyerInfo.idType}
                onChangeText={(val) => handleChangeBuyerInfo("idType", val)}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <Text style={styles.label}>Número ID:</Text>
              <TextInput
                style={styles.input}
                placeholder="12345678"
                keyboardType="numeric"
                value={buyerInfo.idNumber}
                onChangeText={(val) => handleChangeBuyerInfo("idNumber", val)}
              />
            </View>
          </View>
          {/* Email / Confirm */}
          <View style={styles.formRow}>
            <View style={styles.halfInputContainer}>
              <Text style={styles.label}>Email:</Text>
              <TextInput
                style={styles.input}
                placeholder="mail@mail.com"
                keyboardType="email-address"
                value={buyerInfo.email}
                onChangeText={(val) => handleChangeBuyerInfo("email", val)}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <Text style={styles.label}>Confirmar Email:</Text>
              <TextInput
                style={styles.input}
                placeholder="mail@mail.com"
                keyboardType="email-address"
                value={buyerInfo.confirmEmail}
                onChangeText={(val) =>
                  handleChangeBuyerInfo("confirmEmail", val)
                }
              />
            </View>
          </View>
          {/* Phone */}
          <View style={styles.formRow}>
            <View style={styles.fullInputContainer}>
              <Text style={styles.label}>Teléfono:</Text>
              <TextInput
                style={styles.input}
                placeholder="1112345678"
                keyboardType="phone-pad"
                value={buyerInfo.phone}
                onChangeText={(val) => handleChangeBuyerInfo("phone", val)}
              />
            </View>
          </View>
        </View>

        <View style={styles.priceSummary}>
          <Text style={styles.priceLine}>
            Subtotal entradas: <Text style={styles.priceValue}>${subtotal}</Text>
          </Text>
          <Text style={styles.priceLine}>
            Cargo por servicio: <Text style={styles.serviceFee}>${serviceFee}</Text>
          </Text>
          <Text style={[styles.priceLine, styles.priceTotal]}>Total: ${total}</Text>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmPurchase}
        >
          <Text style={styles.confirmButtonText}>CONFIRMAR COMPRA</Text>
        </TouchableOpacity>

        <Text style={styles.notice}>
          ** Al confirmar, serás redirigido a la pasarela de pago...
        </Text>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

export default function BuyTicketScreen() {
  return (
    <ProtectedRoute allowedRoles={["admin", "user", "owner"]}>
      <BuyTicketScreenContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  title: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginVertical: 12,
    textAlign: "center",
  },
  eventName: {
    textAlign: "center",
    fontSize: FONT_SIZES.body,
    color: COLORS.info,
    marginBottom: 16,
  },
  ticketSummary: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
    fontSize: FONT_SIZES.body,
  },
  daySummaryBlock: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    padding: 10,
    marginBottom: 8,
  },
  daySummaryTitle: {
    fontWeight: "bold",
    color: COLORS.info,
    marginBottom: 4,
  },
  ticketLine: {
    color: COLORS.textSecondary,
    marginLeft: 4,
    marginVertical: 2,
  },
  daySubtotal: {
    marginTop: 4,
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: FONT_SIZES.smallText,
    textAlign: "right",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  buyerForm: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  halfInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  fullInputContainer: {
    flex: 1,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.smallText,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: COLORS.textPrimary,
  },
  priceSummary: {
    marginVertical: 12,
    padding: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
  },
  priceLine: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  priceValue: {
    fontWeight: "bold",
  },
  serviceFee: {
    color: COLORS.positive,
    fontWeight: "bold",
  },
  priceTotal: {
    marginTop: 6,
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  confirmButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: FONT_SIZES.button,
  },
  notice: {
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
});
