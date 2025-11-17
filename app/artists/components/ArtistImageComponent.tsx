import React from "react";
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

// Componente genérico para mostrar la imagen de un artista.
// Comentarios en español; identificadores en inglés; texto visible en icon/placeholder.
type Props = {
  imageUrl?: string | null;
  size?: number; // tamaño en px (ancho/alto)
  borderRadius?: number; // opcional, si no se pasa usa size/2 (círculo)
  style?: ImageStyle | ViewStyle;
};

export default function ArtistImage({ imageUrl, size = 100, borderRadius, style }: Props) {
  const radius = typeof borderRadius === "number" ? borderRadius : Math.round(size / 2);

  if (imageUrl) {
    return (
      <Image
        source={getSafeImageSource(imageUrl)}
        style={[{ width: size, height: size, borderRadius: radius, backgroundColor: COLORS.borderInput }, style] as ImageStyle}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[{ width: size, height: size, borderRadius: radius, backgroundColor: "#ccc", alignItems: "center", justifyContent: "center" }, style] as unknown as ViewStyle}>
      <MaterialCommunityIcons name="image-off" size={Math.round(size * 0.36)} color={COLORS.textSecondary} />
    </View>
  );
}
