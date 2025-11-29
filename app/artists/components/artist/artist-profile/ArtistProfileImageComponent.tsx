// app/artists/components/artist/artist-profile/ArtistProfileImageComponent.tsx
// Renderiza la imagen principal del artista en su perfil.
// Si no hay imagen, muestra un placeholder con ícono.

import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  ImageStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

type ArtistProfileImageProps = {
  image?: string | null;               // URL de la imagen (puede ser null)
  style?: ViewStyle | ImageStyle;      // estilos extra para ajustar el contenedor
};

export default function ArtistProfileImage({
  image,
  style,
}: ArtistProfileImageProps) {
  // Ajustamos la altura según el ancho de pantalla (celu vs tablet)
  const screenWidth = Dimensions.get("window").width;
  const height = screenWidth > 600 ? 300 : 220;

  // Si tenemos URL de imagen, renderizamos la foto
  if (image) {
    return (
      <Image
        source={getSafeImageSource(image)}
        style={[
          styles.imageBase,
          { height },
          style as ImageStyle,
        ]}
        resizeMode="cover"
      />
    );
  }

  // Si no hay imagen, mostramos un bloque gris con ícono y texto
  return (
    <View
      style={[
        styles.placeholderContainer,
        { height },
        style as ViewStyle,
      ]}
    >
      <MaterialCommunityIcons
        name="music"
        size={36}
        color={COLORS.textSecondary}
      />
      <Text style={styles.placeholderText}>Imagen del artista</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // base para la imagen real
  imageBase: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: COLORS.borderInput,
    marginBottom: 16,
  },
  // contenedor del placeholder cuando no hay imagen
  placeholderContainer: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#cfd6de",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 6,
    color: COLORS.textSecondary,
  },
});
