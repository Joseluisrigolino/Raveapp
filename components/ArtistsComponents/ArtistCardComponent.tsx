// components/ArtistCardComponent.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import globalStyles, { FONT_SIZES, COLORS } from "@/styles/globalStyles";

interface ArtistCardProps {
  artistName: string;
  artistImage: string;
  onPress?: () => void;
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
    backgroundColor: globalStyles.COLORS.cardBg, // Blanco
    borderRadius: 8, // Podrías usar globalStyles.RADIUS.card
    padding: 8,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 6,
  },
  name: {
    fontSize: FONT_SIZES.body,  // 14-16
    color: COLORS.textPrimary,  // Gris oscuro
    fontWeight: "bold",
    textAlign: "center",
  },
});
