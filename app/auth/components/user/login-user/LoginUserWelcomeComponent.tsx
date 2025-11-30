import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

import React from "react";


// Props para el componente de bienvenida
interface LoginUserWelcomeComponentProps {
  title?: string;
  subtitle?: string;
}

// Componente que renderiza el título y subtítulo de la pantalla de login
export default function LoginUserWelcomeComponent({
  title = "RaveApp",
  subtitle = "Tu pase al mejor ritmo",
}: LoginUserWelcomeComponentProps) {
  // Renderiza el título y subtítulo centrados
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 24, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 4 },
  subtitle: { color: "#6b7280", marginBottom: 12 },
});
