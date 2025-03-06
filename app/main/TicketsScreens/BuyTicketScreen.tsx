import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// Reutilizamos tus componentes
import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";

// Importamos las interfaces
import { BuyTicketData, BuyerInfo } from "@/interfaces/BuyTicketProps";

/**
 * Datos simulados del ticket a comprar (luego vendrán de tu API).
 * Ajusta "quantity" según prefieras que sea la inicial (p.ej. 1).
 */
const mockTicketData: BuyTicketData = {
  eventId: 123,
  eventName: "Nombre del evento",
  eventImageUrl: "https://picsum.photos/200/200",
  ticketType: "Entrada general",
  price: 2000,
  quantity: 1,
  serviceFee: 320,
};

export default function BuyTicketScreen() {
  // Estados locales para el ticket y el comprador
  const [ticketData, setTicketData] = useState<BuyTicketData>(mockTicketData);

  // Datos del comprador
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    firstName: "",
    lastName: "",
    idType: "DNI", // valor por defecto
    idNumber: "",
    email: "",
    confirmEmail: "",
    phone: "",
  });

  // Manejo de cambios en BuyerInfo
  const handleChangeBuyerInfo = (field: keyof BuyerInfo, value: string) => {
    setBuyerInfo({ ...buyerInfo, [field]: value });
  };

  // Subtotal = precio unitario * cantidad
  const subtotal = ticketData.price * ticketData.quantity;
  // Cargo de servicio (estático en este ejemplo)
  const serviceFee = ticketData.serviceFee;
  // Total = subtotal + cargo
  const total = subtotal + serviceFee;

  // Función para cambiar la cantidad
  const handleQuantityChange = (newQuantity: number) => {
    // Aseguramos que sea mínimo 1
    if (newQuantity < 1) return;
    setTicketData({ ...ticketData, quantity: newQuantity });
  };

  // Función que se llama al pulsar "COMPRAR"
  const handleBuy = () => {
    // Aquí podrías redireccionar a MercadoPago, etc.
    console.log("Comprando ticket...", {
      ticketData,
      buyerInfo,
      subtotal,
      serviceFee,
      total,
    });
    alert("Proceso de compra iniciado (ejemplo).");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Estás comprando:</Text>

        {/* Resumen del ticket */}
        <View style={styles.ticketSummaryContainer}>
          <Image
            source={{ uri: ticketData.eventImageUrl }}
            style={styles.eventImage}
          />
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketType}>
              {ticketData.ticketType} para [{ticketData.eventName}]
            </Text>
            <Text style={styles.ticketPrice}>
              Valor: ${ticketData.price.toFixed(2)}
            </Text>

            <View style={styles.row}>
              <Text>Cantidad: </Text>
              {/* Botón para bajar la cantidad */}
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleQuantityChange(ticketData.quantity - 1)}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>

              <Text style={styles.qtyNumber}>{ticketData.quantity}</Text>

              {/* Botón para subir la cantidad */}
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleQuantityChange(ticketData.quantity + 1)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtotal}>
              Subtotal: ${subtotal.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Datos del comprador */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          Datos del comprador:
        </Text>
        <View style={styles.formContainer}>
          <View style={styles.row}>
            <View style={styles.halfInputContainer}>
              <Text>Nombre:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={buyerInfo.firstName}
                onChangeText={(val) => handleChangeBuyerInfo("firstName", val)}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <Text>Apellido:</Text>
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                value={buyerInfo.lastName}
                onChangeText={(val) => handleChangeBuyerInfo("lastName", val)}
              />
            </View>
          </View>

          {/* Tipo de identificación */}
          <View style={styles.row}>
            <View style={styles.halfInputContainer}>
              <Text>Tipo de identificación:</Text>
              <TextInput
                style={styles.input}
                placeholder="DNI"
                value={buyerInfo.idType}
                onChangeText={(val) => handleChangeBuyerInfo("idType", val)}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <Text>Número de identificación:</Text>
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
          <View style={styles.row}>
            <View style={styles.halfInputContainer}>
              <Text>Email:</Text>
              <TextInput
                style={styles.input}
                placeholder="mail@mail.com"
                keyboardType="email-address"
                value={buyerInfo.email}
                onChangeText={(val) => handleChangeBuyerInfo("email", val)}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <Text>Confirmación de Email:</Text>
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
          <View style={styles.row}>
            <View style={styles.fullInputContainer}>
              <Text>Teléfono:</Text>
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

        {/* Subtotal, cargo y total */}
        <View style={styles.priceContainer}>
          <Text style={styles.subtotalText}>
            Subtotal: ${subtotal.toFixed(2)}
          </Text>
          <Text style={styles.serviceFeeText}>
            Cargo por servicio: ${serviceFee.toFixed(2)}
          </Text>
          <Text style={styles.totalText}>Total: ${total.toFixed(2)}</Text>
        </View>

        {/* Botón comprar */}
        <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
          <Text style={styles.buyButtonText}>COMPRAR</Text>
        </TouchableOpacity>

        <Text style={styles.notice}>
          Al hacer click en comprar, te redireccionamos a MercadoPago para que
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
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  ticketSummaryContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F3F3",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketType: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  ticketPrice: {
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  qtyButton: {
    backgroundColor: "#000",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 4,
  },
  qtyButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  qtyNumber: {
    minWidth: 20,
    textAlign: "center",
  },
  subtotal: {
    fontStyle: "italic",
  },
  formContainer: {
    backgroundColor: "#F3F3F3",
    padding: 10,
    borderRadius: 8,
  },
  halfInputContainer: {
    flex: 1,
    marginRight: 5,
  },
  fullInputContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  priceContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  subtotalText: {
    fontSize: 14,
    marginBottom: 2,
  },
  serviceFeeText: {
    fontSize: 14,
    marginBottom: 2,
    color: "green",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  buyButton: {
    backgroundColor: "#FF00B4",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  notice: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
