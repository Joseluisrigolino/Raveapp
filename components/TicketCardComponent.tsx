import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

interface Props {
  item: TicketPurchasedMenuItem;
}

export default function TicketCardComponent({ item }: Props) {
  return (
    <View style={styles.cardContainer}>
      {/* Contenedor de la imagen */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        {/* Si el ticket está finalizado, mostramos la superposición */}
        {item.isFinished && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Finalizado</Text>
          </View>
        )}
      </View>

      {/* Nombre y fecha del evento */}
      <Text style={styles.eventName}>{item.eventName}</Text>
      <Text style={styles.date}>{item.date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: 8,
    alignItems: "center",
    // Ajusta ancho/alto si quieres un layout más rígido
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: "#ccc",
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    color: "#fff",
    fontWeight: "bold",
    transform: [{ rotate: "-15deg" }],
    fontSize: 14,
  },
  eventName: {
    marginTop: 4,
    fontWeight: "bold",
    textAlign: "center",
  },
  date: {
    color: "#666",
    textAlign: "center",
  },
});
