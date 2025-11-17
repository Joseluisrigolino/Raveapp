// Componente para mostrar la imagen principal del artista
import React from "react";
import { View, Image, Text, StyleSheet, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

type Props = {
  image?: string | null;
  style?: any;
};

export default function ArtistProfileImage({ image, style }: Props) {
  const screenWidth = Dimensions.get("window").width;
  const height = screenWidth > 600 ? 300 : 220;

  if (image) {
    return (
      <Image
        source={getSafeImageSource(image)}
        style={[{ width: "100%", height, borderRadius: 14, backgroundColor: COLORS.borderInput, marginBottom: 16 }, style]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[{ width: "100%", height, borderRadius: 14, backgroundColor: "#cfd6de", alignItems: "center", justifyContent: "center", marginBottom: 16 }, style]}>
      <MaterialCommunityIcons name="music" size={36} color={COLORS.textSecondary} />
      <Text style={styles.placeholderText}>Imagen del artista</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholderText: { marginTop: 6, color: COLORS.textSecondary },
});
