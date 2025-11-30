import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";

// Componente que muestra el texto de advertencia dentro de la card de usuarios creados
// Componente que muestra el texto de advertencia dentro de la card de usuarios creados
export default function CreateUserControllerWarningComponent() {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipIcon}><Icon name="info" size={16} color="#0f172a" /></View>
      <Text style={styles.tipText}>Si alguien se queda sin acceso, simplemente eliminálo y crea otro usuario nuevo con otra contraseña</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tipRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  tipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  tipText: { color: "#6b7280", flex: 1 },
});
