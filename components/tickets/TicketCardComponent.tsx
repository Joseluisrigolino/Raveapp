// components/TicketCardComponent.tsx

import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

interface Props {
  item: TicketPurchasedMenuItem;
  onPress: () => void;
}

/**
 * Tarjeta que muestra la imagen, fecha, nombre y descripción de un ticket.
 * Si el ticket está finalizado (isFinished = true),
 * oscurece la imagen y muestra "FINALIZADO" en un overlay.
 */
export default function TicketCardComponent({ item, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      {/* Imagen + badge de fecha */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />

        {/* Badge con la fecha */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{item.date}</Text>
        </View>

        {/* Overlay si está finalizado */}
        {item.isFinished && (
          <View style={styles.finishedOverlay}>
            <Text style={styles.finishedOverlayText}>FINALIZADO</Text>
          </View>
        )}
      </View>

      {/* Info: nombre y descripción */}
      <View style={styles.infoContainer}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {item.eventName}
        </Text>
        <Text style={styles.eventSubtitle} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    marginVertical: 5,
    // Sombra suave
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Android
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dateBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#000",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  finishedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  finishedOverlayText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
    marginBottom: 4,
  },
  eventSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
  },
});
