// components/artists/ArtistCardComponent.tsx
import React from "react";
import { Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES } from "@/styles/globalStyles";

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
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={{ uri: artistImage }} style={styles.image} />
      <Text style={styles.name} numberOfLines={2}>
        {artistName}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: "center",
    margin: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  name: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
});
