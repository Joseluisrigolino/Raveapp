// src/screens/NewsScreens/components/list/NewsEmptyPlaceholderComponent.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

export default function NewsEmptyPlaceholderComponent() {
  return (
    <View style={styles.centered}>
      <View className="" style={styles.card}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name="newspaper-variant-outline"
            size={34}
            color={COLORS.textSecondary}
          />
        </View>
        <Text style={styles.title}>No hay noticias por ahora</Text>
        <Text style={styles.subtitle}>
          Por el momento, no hay noticias para mostrar. Próximamente estaremos
          subiendo las últimas novedades.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: 320,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.smallText,
  },
});
