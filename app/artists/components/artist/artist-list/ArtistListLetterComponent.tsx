import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS, FONTS } from "@/styles/globalStyles";

// Componente que renderiza la burbuja con la letra y la línea divisoria
// Usar internals en inglés, comentarios en español, texto visible (letra) como viene
type Props = {
  letter: string;
  containerStyle?: ViewStyle;
};

export default function ArtistListLetter({ letter, containerStyle }: Props) {
  return (
    <View style={[styles.letterHeader, containerStyle]}>
      <View style={styles.letterBubble}>
        <Text style={styles.letterBubbleText}>{letter}</Text>
      </View>
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
