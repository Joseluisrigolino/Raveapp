// owner/CancelEventScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/LayoutComponents/HeaderComponent";
import Footer from "@/components/LayoutComponents/FooterComponent";

import {
  OwnerEventCancelItem,
  TicketSoldInfo,
} from "@/interfaces/OwnerEventCancelItem";
import { getEventCancellationDataById } from "@/utils/ownerEventsCancelHelper";

// Importamos tu globalStyles
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function CancelEventScreen() {
  // 1. Leemos el param "id" de la URL
  const { id } = useLocalSearchParams<{ id?: string }>();

  // 2. Estado para la data del evento a cancelar
  const [cancelData, setCancelData] = useState<OwnerEventCancelItem | null>(
    null
  );

  // 3. Estado para el motivo de la cancelación
  const [reason, setReason] = useState("");

  // 4. Al montar o cambiar "id", buscamos la data en el helper
  useEffect(() => {
    if (id) {
      const found = getEventCancellationDataById(Number(id));
      if (found) {
        setCancelData(found);
      }
    }
  }, [id]);

  // 5. Si no se encontró el evento
  if (!cancelData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.contentWrapper}>
          <Text>No se encontró la información del evento a cancelar.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  // Función al presionar "Cancelar Evento"
  const handleCancelEvent = () => {
    console.log("Cancelando evento ID:", cancelData.id);
    console.log("Motivo:", reason);
    // Aquí podrías llamar a tu API para procesar la cancelación
    alert("Evento cancelado (ejemplo).");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Cancelación de evento:</Text>

        <Text style={styles.infoText}>
          La cancelación de este evento es una acción que no se puede revertir.
          Se avisará vía mail a las personas que hayan comprado una entrada,
          junto con el motivo que describas, y se procederá a realizar la
          devolución del dinero de las entradas.
        </Text>

        {/* Nombre del evento */}
        <Text style={styles.sectionLabel}>
          Evento a cancelar: {cancelData.eventName}
        </Text>

        {/* Listado de tickets */}
        <View style={styles.ticketListContainer}>
          <Text style={styles.ticketSubtitle}>
            Se reembolsarán un total de X entradas:
          </Text>
          {cancelData.ticketsSold.map((ticket: TicketSoldInfo, index: number) => (
            <Text key={index} style={styles.ticketItem}>
              • {ticket.quantity} {ticket.type} de $
              {ticket.price.toLocaleString()}.00 c/u
            </Text>
          ))}
          <Text style={styles.totalRefund}>
            Total a devolver: ${cancelData.totalRefund.toLocaleString()}
          </Text>
        </View>

        {/* Motivo */}
        <Text style={styles.motivoLabel}>Motivo:</Text>
        <TextInput
          style={styles.motivoInput}
          placeholder="Describe el motivo de la cancelación..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          value={reason}
          onChangeText={setReason}
        />

        {/* Nota de irreversibilidad */}
        <Text style={styles.warningText}>
          * Esta operación no puede ser reversada.
        </Text>

        {/* Botón "Cancelar Evento" */}
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEvent}>
          <Text style={styles.cancelButtonText}>Cancelar Evento</Text>
        </TouchableOpacity>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

// Estilos con globalStyles
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
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontSize: FONT_SIZES.subTitle, // Ej. 18-20
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  ticketListContainer: {
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: RADIUS.card,
    marginBottom: 16,
  },
  ticketSubtitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    marginBottom: 6,
    color: COLORS.textPrimary,
  },
  ticketItem: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    marginLeft: 10,
    marginBottom: 2,
  },
  totalRefund: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.negative, // Podrías usar un color "rojo"
    marginTop: 8,
  },
  motivoLabel: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  motivoInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    padding: 8,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  warningText: {
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: COLORS.negative, // Rojo
    paddingVertical: 12,
    borderRadius: RADIUS.card,
    alignItems: "center",
  },
  cancelButtonText: {
    color: COLORS.cardBg, // Blanco
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
  },
});
