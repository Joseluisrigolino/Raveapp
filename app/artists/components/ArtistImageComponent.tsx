// app/artists/components/ArtistImageComponent.tsx
// Avatar genérico de artista (círculo por defecto).
// Se usa en listas, cards, etc. Si no hay imagen, muestra un ícono de placeholder.

import React from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  View,
  ViewStyle,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

type ArtistImageProps = {
  imageUrl?: string | null;                 // URL de la imagen (puede ser null)
  size?: number;                            // tamaño en px (ancho/alto)
  borderRadius?: number;                    // opcional, si no se pasa usa size/2 (círculo)
  style?: StyleProp<ImageStyle | ViewStyle>; // estilos extra (margen, etc.)
};

export default function ArtistImage({
  imageUrl,
  size = 100,
  borderRadius,
  style,
}: ArtistImageProps) {
  // si no pasan borderRadius, armamos un círculo en base al size
  const radius =
    typeof borderRadius === "number" ? borderRadius : Math.round(size / 2);

  // Si tenemos URL, mostramos la imagen real
  if (imageUrl) {
    return (
      <Image
        source={getSafeImageSource(imageUrl)}
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: COLORS.borderInput,
          },
          style as ImageStyle,
        ]}
        resizeMode="cover"
      />
    );
  }

  // Si no hay imagen, mostramos un círculo gris con ícono genérico
  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
        style as ViewStyle,
      ]}
    >
      <MaterialCommunityIcons
        name="image-off"
        size={Math.round(size * 0.36)}
        color={COLORS.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
});
