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

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";

import {
  OwnerEventCancelItem,
  TicketSoldInfo,
} from "@/interfaces/OwnerEventCancelItem";
import { getEventCancellationDataById } from "@/utils/ownerEventsCancelHelper";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function CancelEventScreen() {
  // 1. Leemos el param "id" de la URL
  const { id } = useLocalSearchParams<{ id?: string }>();

  // 2. Estado para la data del evento a cancelar
  const [cancelData, setCancelData] = useState<OwnerEventCancelItem | null>(null);

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
        <View style={styles.notFoundWrapper}>
          <Text style={styles.notFoundText}>
            No se encontró la información del evento a cancelar.
          </Text>
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Título */}
        <View style={styles.formGroup}>
          <Text style={styles.title}>Cancelación de evento</Text>
        </View>

        {/* Info general */}
        <View style={styles.formGroup}>
          <Text style={styles.infoText}>
            La cancelación de este evento es una acción que{" "}
            <Text style={styles.infoTextBold}>no se puede revertir</Text>. Se avisará
            vía mail a las personas que hayan comprado una entrada, junto con el
            motivo que describas, y se procederá a realizar la devolución del dinero
            de las entradas.
          </Text>
        </View>

        {/* Nombre del evento */}
        <View style={styles.formGroup}>
          <Text style={styles.sectionLabel}>
            Evento a cancelar: <Text style={styles.eventName}>{cancelData.eventName}</Text>
          </Text>
        </View>

        {/* Listado de tickets */}
        <View style={styles.formGroup}>
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
        </View>

        {/* Motivo */}
        <View style={styles.formGroup}>
          <Text style={styles.motivoLabel}>Motivo de la cancelación</Text>
          <TextInput
            style={styles.motivoInput}
            placeholder="Describe el motivo de la cancelación..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            value={reason}
            onChangeText={setReason}
          />
          <Text style={styles.warningText}>
            * Esta operación no puede ser revertida.
          </Text>
        </View>

        {/* Botón "Cancelar Evento" */}
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEvent}>
          <Text style={styles.cancelButtonText}>Cancelar Evento</Text>
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
  },
  scrollContent: {
    padding: 16,
  },

  // Agrupaciones visuales
  formGroup: {
    marginBottom: 16,
    width: "100%",
  },

  // Título principal
  title: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    alignSelf: "center",
    marginBottom: 8,
  },

  // Info general
  infoText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "justify",
    lineHeight: 20,
  },
  infoTextBold: {
    fontWeight: "bold",
  },

  // Nombre del evento
  sectionLabel: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  eventName: {
    color: COLORS.info,
  },

  // Tickets
  ticketListContainer: {
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: RADIUS.card,
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
    color: COLORS.negative,
    marginTop: 8,
  },

  // Motivo
  motivoLabel: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  motivoInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    color: COLORS.textPrimary,
    marginHorizontal: 4,
  },
  warningText: {
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginHorizontal: 4,
  },

  // Botón
  cancelButton: {
    backgroundColor: COLORS.negative,
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: 4,
  },
  cancelButtonText: {
    color: COLORS.cardBg,
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
  },
});
