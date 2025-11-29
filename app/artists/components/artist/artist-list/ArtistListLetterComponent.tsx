// app/artists/components/artist/artist-list/ArtistListLetterComponent.tsx
// Encabezado de sección por letra (A, B, C...) con una burbuja y una línea divisoria.

import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { COLORS, FONTS } from "@/styles/globalStyles";

type Props = {
  letter: string;                    // Letra de la sección (ej: "A")
  containerStyle?: StyleProp<ViewStyle>; // Estilo opcional para el wrapper
};

export default function ArtistListLetter({ letter, containerStyle }: Props) {
  return (
    <View style={[styles.letterHeader, containerStyle]}>
      {/* Burbuja con la letra */}
      <View style={styles.letterBubble}>
        <Text style={styles.letterBubbleText}>{letter}</Text>
      </View>

      {/* Línea divisoria que se estira a la derecha */}
      <View style={styles.letterDivider} />
    </View>
  );
}

const styles = StyleSheet.create({
  letterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  letterBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  letterBubbleText: {
    color: COLORS.cardBg,
    fontFamily: FONTS.subTitleMedium,
  },
  letterDivider: {
    height: 1,
    flex: 1,
    backgroundColor: COLORS.borderInput,
  },
});
