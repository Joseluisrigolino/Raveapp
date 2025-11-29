// app/artists/components/ArtistCardComponent.tsx
// Tarjeta simple de artista para la grilla de ArtistsScreen.

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import ArtistImage from "@/app/artists/components/ArtistImageComponent";
import { Artist } from "@/app/artists/types/Artist";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

type Props = {
  artist: Artist;              // Artista a mostrar
  onPress: () => void;         // Acción al tocar la tarjeta (ir al detalle)
  style?: StyleProp<ViewStyle>; // Estilo opcional para el contenedor
};

export default function ArtistCardComponent({ artist, onPress, style }: Props) {
  return (
    // Tarjeta clickeable: al tocar, navega al detalle del artista
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.8}>
      {/* Imagen del artista (el componente interno ya maneja placeholder / fallback) */}
      <ArtistImage imageUrl={artist.image} size={100} style={styles.image} />

      {/* Nombre del artista debajo de la imagen */}
      <Text style={styles.name} numberOfLines={1}>
        {artist.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal de la tarjeta
  card: {
    alignItems: "center",
    marginVertical: 8,
  },
  // La imagen se fuerza cuadrada y redonda (avatar grande)
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.cardBg,
  },
  // Nombre del artista
  name: {
    marginTop: 6,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
});
