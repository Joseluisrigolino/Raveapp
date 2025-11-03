// src/components/artists/ArtistCardComponent.tsx

import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Artist } from "@/app/artists/types/Artist";

type Props = {
  artist: Artist;
  onPress: () => void;
};

export default function ArtistCardComponent({ artist, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {artist.image ? (
        <Image
          source={{ uri: artist.image }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          {/* Aquí podrías poner un icono de “sin foto” si querés */}
        </View>
      )}
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
