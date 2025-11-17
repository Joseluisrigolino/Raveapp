// src/components/artists/ArtistCardComponent.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import ArtistImage from "@/app/artists/components/ArtistImageComponent";
import { Artist } from "@/app/artists/types/Artist";

type Props = {
  artist: Artist;
  onPress: () => void;
};

export default function ArtistCardComponent({ artist, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <ArtistImage imageUrl={artist.image} size={100} style={styles.image} />
      <Text style={styles.name}>{artist.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    margin: 8,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
  },
  placeholder: {
    backgroundColor: "#ccc",  // tono de gris para indicar “sin imagen”
  },
  name: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
