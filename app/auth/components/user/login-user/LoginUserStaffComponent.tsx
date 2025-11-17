import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Link } from "expo-router";
import ROUTES from "@/routes";

// Sección: acceso para staff / controlador de evento
export default function LoginUserStaffComponent() {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}><Icon name="admin-panel-settings" size={28} color="#0f172a" /></View>
      <Text style={styles.prompt}>¿Eres staff de evento?</Text>

      <Link href={ROUTES.LOGIN.CONTROLLER as any} asChild>
        <Button mode="outlined" icon="qrcode" accessibilityRole="button" contentStyle={styles.buttonContent} style={styles.button} labelStyle={{ fontWeight: "700", color: "#0f172a" }}>
          Acceso Controlador
        </Button>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24, marginHorizontal: 12, alignItems: "center", backgroundColor: "#ffffff", borderRadius: 14, paddingVertical: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: "#e6e9ef" },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  prompt: { fontSize: 14, color: "#6b7280", marginBottom: 12, fontWeight: "500" },
  button: { borderRadius: 25, height: 50, justifyContent: "center", borderColor: "#0f172a", backgroundColor: "#ffffff", width: "100%" },
  buttonContent: { height: 50 },
});
