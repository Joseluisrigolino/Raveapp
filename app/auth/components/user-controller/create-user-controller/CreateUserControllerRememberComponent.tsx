import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";

// Componente que muestra el recordatorio informativo
// Comentarios en español, internals en inglés
export default function CreateUserControllerRememberComponent() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.accent} />
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Icon name="info" size={18} color="#0f172a" />
          </View>
          <Text style={styles.text}><Text style={styles.bold}>Recordá:</Text> si alguien olvida la contraseña, tenés que eliminar ese usuario y crear uno nuevo. No existe recuperación de contraseña.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 8 },
  card: {
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    paddingLeft: 20,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    backgroundColor: "#fde68a",
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  text: { color: "#374151", flex: 1, lineHeight: 18 },
  bold: { fontWeight: "700", color: "#374151" },
});
