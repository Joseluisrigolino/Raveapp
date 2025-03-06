// components/ArtistCardComponent.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

interface ArtistCardProps {
  artistName: string;
  artistImage: string;
  onPress?: () => void; // <-- para manejar el toque
}

export default function ArtistCard({
  artistName,
  artistImage,
  onPress,
}: ArtistCardProps) {
  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <Image source={{ uri: artistImage }} style={styles.image} />
      <Text style={styles.name}>{artistName}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 120,
    alignItems: "center",
    margin: 8,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
