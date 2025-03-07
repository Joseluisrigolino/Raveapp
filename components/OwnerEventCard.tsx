// components/owner/OwnerEventCard.tsx
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { OwnerEventItem } from "@/interfaces/OwnerEventItem";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface OwnerEventCardProps {
  item: OwnerEventItem;
  onTicketsSold: (id: number) => void;
  onModify: (id: number) => void;
  onCancel: (id: number) => void;
}

export default function OwnerEventCard({
  item,
  onTicketsSold,
  onModify,
  onCancel,
}: OwnerEventCardProps) {
  // Determinar color y texto para el estado
  let statusColor = COLORS.textPrimary;
  let statusLabel = "";
  switch (item.status) {
    case "vigente":
      statusColor = COLORS.positive; // verde
      statusLabel = "Vigente";
      break;
    case "pendiente":
      statusColor = COLORS.info; // un color "naranja" o "amarillo"
      statusLabel = "Pendiente de aprobación";
      break;
    case "finalizado":
      statusColor = COLORS.negative; // rojo
      statusLabel = "Finalizado";
      break;
  }

  return (
    <View style={styles.cardContainer}>
      {/* Encabezado de la card: estado e imagen */}
      <View style={styles.headerRow}>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
      </View>

      {/* Info principal */}
      <Text style={styles.dateText}>Fecha del evento: {item.date}</Text>
      <Text style={styles.nameText}>
        {item.eventName}
        {item.isMultipleDays ? " [EVENTO DE 3 DÍAS]" : ""}
      </Text>

      {/* Botones */}
      <View style={styles.buttonsRow}>
        {item.status === "vigente" && (
          <TouchableOpacity
            style={[styles.button, styles.soldTicketsButton]}
            onPress={() => onTicketsSold(item.id)}
          >
            <Text style={styles.buttonText}>Entradas vendidas</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.modifyButton]}
          onPress={() => onModify(item.id)}
        >
          <Text style={styles.buttonText}>Modificar</Text>
        </TouchableOpacity>

        {item.status !== "finalizado" && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => onCancel(item.id)}
          >
            <Text style={styles.buttonText}>Cancelar evento</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    marginBottom: 12,
    padding: 12,
    // sombra (opcional)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
  },
  eventImage: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.card,
    resizeMode: "cover",
  },
  dateText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.smallText,
    marginBottom: 4,
  },
  nameText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  button: {
    borderRadius: RADIUS.card,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  soldTicketsButton: {
    backgroundColor: COLORS.info, // Ej. morado/azul
  },
  modifyButton: {
    backgroundColor: COLORS.alternative, // Ej. azul oscuro
  },
  cancelButton: {
    backgroundColor: COLORS.negative, // rojo
  },
  buttonText: {
    color: COLORS.cardBg, // blanco
    fontSize: FONT_SIZES.smallText,
    fontWeight: "bold",
  },
});
