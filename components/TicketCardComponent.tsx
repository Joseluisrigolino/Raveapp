// components/TicketCardComponent.tsx
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

interface TicketCardProps {
  item: TicketPurchasedMenuItem;
  onPress?: () => void;
}

export default function TicketCardComponent({ item, onPress }: TicketCardProps) {
  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.title}>{item.eventName}</Text>
      <Text style={styles.date}>{item.date}</Text>
      {item.isFinished && (
        <Text style={styles.finishedLabel}>Finalizado</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: "45%", // Ajusta según cuántas columnas
    backgroundColor: "#fff",
    margin: 8,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    padding: 8,
  },
  image: {
    width: "100%",
    height: 100,
    marginBottom: 8,
    borderRadius: 8,
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
  },
  date: {
    textAlign: "center",
    marginVertical: 4,
  },
  finishedLabel: {
    color: "red",
    fontWeight: "bold",
  },
});
