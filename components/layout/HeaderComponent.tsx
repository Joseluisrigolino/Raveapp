import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

export default function HeaderComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RaveApp</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 70,
    backgroundColor: COLORS.cardBg,           // Blanco puro
    borderBottomWidth: 2,                     // Línea inferior más marcada
    borderBottomColor: COLORS.borderInput,    // Gris claro
    justifyContent: "center",                 // Centra verticalmente
    alignItems: "center",                     // Centra horizontalmente
  },
  title: {
    fontFamily: FONTS.titleBold,              // Poppins-Bold
    fontSize: FONT_SIZES.titleMain,           // 22px
    color: COLORS.textPrimary,                // Gris oscuro
    textAlign: "center",                      // Centra el texto
    // textTransform y letterSpacing eliminados para respetar mayúsculas/minúsculas
  },
});
