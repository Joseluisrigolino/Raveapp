import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Divider } from "react-native-paper";
import CreateUserControllerWarningComponent from "./CreateUserControllerWarningComponent";

// Props para la card de usuarios ya creados
interface CreateUserControllerAlreadyExistingComponentProps {
  children?: React.ReactNode;
}

// Card que contiene la lista de usuarios ya creados
// Comentarios en español, internals en inglés
// Card que contiene la lista de usuarios ya creados
export default function CreateUserControllerAlreadyExistingComponent({ children }: CreateUserControllerAlreadyExistingComponentProps) {
  return (
    <View style={styles.cardList}>
      <Text style={styles.cardTitle}>Usuarios Creados</Text>
      <Divider style={styles.divider} />
      {children}

      {/* warning abajo de la lista */}
      <CreateUserControllerWarningComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  cardList: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    marginTop: 12,
  },
  cardTitle: { fontWeight: "700", color: "#111827", marginBottom: 10 },
  divider: { marginVertical: 10, backgroundColor: "#e6e9ef" },
});
