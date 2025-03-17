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

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";
import { getEventById, ExtendedEventItem } from "@/utils/eventHelpers";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/** Representa la cantidad seleccionada de cada tipo de entrada.
 *  Ejemplo de key: "day1-genEarly", "day2-vipEarly", etc.
 */
interface SelectedTickets {
  [key: string]: number;
}

/** Datos del comprador (puedes ajustarlo según tu proyecto). */
interface BuyerInfo {
  firstName: string;
  lastName: string;
  idType: string;
  idNumber: string;
  email: string;
  confirmEmail: string;
  phone: string;
}

/** Componente para un "stepper" de selección de cantidad de un tipo de ticket. */
function TicketSelector({
  label,
  maxQty,
  currentQty,
  onChange,
}: {
  label: string;
  maxQty: number;
  currentQty: number;
  onChange: (delta: number) => void;
}) {
  return (
    <View style={styles.ticketSelectorRow}>
      <Text style={styles.ticketSelectorLabel}>{label}</Text>
      <View style={styles.ticketSelectorActions}>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => onChange(-1)}
          disabled={currentQty <= 0}
        >
          <Text style={styles.qtyButtonText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.qtyNumber}>{currentQty}</Text>

        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => onChange(+1)}
          disabled={currentQty >= maxQty}
        >
          <Text style={styles.qtyButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BuyTicketScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [eventData, setEventData] = useState<ExtendedEventItem | null>(null);

  // Estado para la cantidad seleccionada de cada tipo
  const [selectedTickets, setSelectedTickets] = useState<SelectedTickets>({});

  // Datos del comprador
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    firstName: "",
    lastName: "",
    idType: "DNI",
    idNumber: "",
    email: "",
    confirmEmail: "",
    phone: "",
  });

  // Cargo de servicio fijo (ejemplo). Podrías calcularlo de otra forma.
  const serviceFee = 320;

  useEffect(() => {
    if (id) {
      const found = getEventById(Number(id));
      setEventData(found);
    }
  }, [id]);

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

  // Actualizar la selección de entradas
  const updateTicketCount = (key: string, delta: number) => {
    setSelectedTickets((prev) => {
      const currentVal = prev[key] || 0;
      const newVal = currentVal + delta;
      if (newVal < 0) return prev; // no bajar de 0
      return { ...prev, [key]: newVal };
    });
  };

  // Manejo de campos del comprador
  const handleChangeBuyerInfo = (field: keyof BuyerInfo, value: string) => {
    setBuyerInfo((prev) => ({ ...prev, [field]: value }));
  };

  // Calcular subtotal (sumando todas las selecciones)
  const calculateSubtotal = (): number => {
    let subtotal = 0;
    eventData.ticketsByDay.forEach((dayInfo) => {
      const baseKey = `day${dayInfo.dayNumber}`;

      // Generales Early Birds
      if (dayInfo.genEarlyQty > 0) {
        const key = `${baseKey}-genEarly`;
        const qtySelected = selectedTickets[key] || 0;
        subtotal += qtySelected * dayInfo.genEarlyPrice;
      }
      // VIP Early Birds
      if (dayInfo.vipEarlyQty > 0) {
        const key = `${baseKey}-vipEarly`;
        const qtySelected = selectedTickets[key] || 0;
        subtotal += qtySelected * dayInfo.vipEarlyPrice;
      }
      // Generales
      if (dayInfo.genQty > 0) {
        const key = `${baseKey}-gen`;
        const qtySelected = selectedTickets[key] || 0;
        subtotal += qtySelected * dayInfo.genPrice;
      }
      // VIP
      if (dayInfo.vipQty > 0) {
        const key = `${baseKey}-vip`;
        const qtySelected = selectedTickets[key] || 0;
        subtotal += qtySelected * dayInfo.vipPrice;
      }
    });
    return subtotal;
  };

  const subtotal = calculateSubtotal();
  const total = subtotal + serviceFee;

  // Confirmar compra
  const handleConfirmPurchase = () => {
    console.log("Comprando entradas para:", eventData.title);
    console.log("selectedTickets:", selectedTickets);
    console.log("BuyerInfo:", buyerInfo);
    console.log("Subtotal:", subtotal);
    console.log("ServiceFee:", serviceFee);
    console.log("Total:", total);
    alert("Proceso de compra iniciado (ejemplo).");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Título */}
        <Text style={styles.title}>
          Entradas para {eventData.title}
        </Text>

        {/* Selección de tickets por día */}
        {eventData.ticketsByDay.map((dayInfo) => {
          const baseKey = `day${dayInfo.dayNumber}`;
          const dayLabel =
            eventData.days === 1
              ? "Día único"
              : `Día ${dayInfo.dayNumber} de ${eventData.days}`;

          return (
            <View key={dayInfo.dayNumber} style={styles.dayBlock}>
              <Text style={styles.dayBlockTitle}>{dayLabel}</Text>

              {/* Generales Early Birds */}
              {dayInfo.genEarlyQty > 0 && (
                <TicketSelector
                  label={`Generales Early Birds ($${dayInfo.genEarlyPrice})`}
                  maxQty={dayInfo.genEarlyQty}
                  currentQty={selectedTickets[`${baseKey}-genEarly`] || 0}
                  onChange={(delta) =>
                    updateTicketCount(`${baseKey}-genEarly`, delta)
                  }
                />
              )}

              {/* VIP Early Birds */}
              {dayInfo.vipEarlyQty > 0 && (
                <TicketSelector
                  label={`VIP Early Birds ($${dayInfo.vipEarlyPrice})`}
                  maxQty={dayInfo.vipEarlyQty}
                  currentQty={selectedTickets[`${baseKey}-vipEarly`] || 0}
                  onChange={(delta) =>
                    updateTicketCount(`${baseKey}-vipEarly`, delta)
                  }
                />
              )}

              {/* Generales */}
              {dayInfo.genQty > 0 && (
                <TicketSelector
                  label={`Generales ($${dayInfo.genPrice})`}
                  maxQty={dayInfo.genQty}
                  currentQty={selectedTickets[`${baseKey}-gen`] || 0}
                  onChange={(delta) =>
                    updateTicketCount(`${baseKey}-gen`, delta)
                  }
                />
              )}

              {/* VIP */}
              {dayInfo.vipQty > 0 && (
                <TicketSelector
                  label={`VIP ($${dayInfo.vipPrice})`}
                  maxQty={dayInfo.vipQty}
                  currentQty={selectedTickets[`${baseKey}-vip`] || 0}
                  onChange={(delta) =>
                    updateTicketCount(`${baseKey}-vip`, delta)
                  }
                />
              )}
            </View>
          );
        })}

        {/* Datos del comprador */}
        <Text style={styles.sectionTitle}>Datos del comprador:</Text>
        <View style={styles.buyerForm}>
          {/* Nombre y Apellido */}
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

          {/* Tipo y Número de identificación */}
          <View style={styles.formRow}>
            <View style={styles.halfInputContainer}>
              <Text style={styles.label}>Tipo de identificación:</Text>
              <TextInput
                style={styles.input}
                placeholder="DNI"
                value={buyerInfo.idType}
                onChangeText={(val) => handleChangeBuyerInfo("idType", val)}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <Text style={styles.label}>Número de identificación:</Text>
              <TextInput
                style={styles.input}
                placeholder="12345678"
                keyboardType="numeric"
                value={buyerInfo.idNumber}
                onChangeText={(val) => handleChangeBuyerInfo("idNumber", val)}
              />
            </View>
          </View>

          {/* Email y confirmación */}
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
              <Text style={styles.label}>Confirmación de Email:</Text>
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

          {/* Teléfono */}
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

        {/* Resumen de precios */}
        <View style={styles.priceSummary}>
          <Text style={styles.priceLine}>
            Subtotal: <Text style={styles.priceValue}>${subtotal}</Text>
          </Text>
          <Text style={styles.priceLine}>
            Cargo por servicio: <Text style={styles.serviceFee}>${serviceFee}</Text>
          </Text>
          <Text style={[styles.priceLine, styles.priceTotal]}>
            Total: ${total}
          </Text>
        </View>

        {/* Botón Confirmar */}
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPurchase}>
          <Text style={styles.confirmButtonText}>COMPRAR</Text>
        </TouchableOpacity>

        <Text style={styles.notice}>
          ** Al hacer click en comprar, te redireccionaremos a MercadoPago para que
          puedas realizar el pago y finalizar la compra.
        </Text>
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

  // Título principal
  title: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginVertical: 12,
    textAlign: "center",
  },

  // Bloque por día
  dayBlock: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,
    // Sombra suave
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dayBlockTitle: {
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
    color: COLORS.info,
    marginBottom: 8,
  },

  // TicketSelector
  ticketSelectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  ticketSelectorLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  ticketSelectorActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  qtyButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: 18,
  },
  qtyNumber: {
    minWidth: 24,
    textAlign: "center",
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
  },

  // Datos del comprador
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
    // Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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

  // Resumen de precios
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

  // Botón comprar
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
