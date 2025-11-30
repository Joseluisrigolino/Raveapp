import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";

// Componente que muestra beneficios/razones para usar RaveApp
export default function LoginUserWhyRaveAppComponent() {
  // Renderiza los beneficios principales de la app
  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Por qué RaveApp?</Text>

      {/* Beneficio: entradas verificadas */}
      <View style={styles.row}>
        <View style={styles.iconCircle}><Icon name="confirmation-number" size={20} color="#0f172a" /></View>
        <Text style={styles.text}>Entradas verificadas al instante</Text>
      </View>

      {/* Beneficio: compra segura */}
      <View style={styles.row}>
        <View style={styles.iconCircle}><Icon name="verified-user" size={20} color="#0f172a" /></View>
        <Text style={styles.text}>Compra 100% segura</Text>
      </View>

      {/* Beneficio: eventos cerca */}
      <View style={styles.row}>
        <View style={styles.iconCircle}><Icon name="event" size={20} color="#0f172a" /></View>
        <Text style={styles.text}>Los mejores eventos cerca de ti</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, marginHorizontal: 12, backgroundColor: "#f9fafb", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#e6e9ef" },
  title: { fontWeight: "700", color: "#111827", marginBottom: 8, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center", marginRight: 10, borderWidth: 1, borderColor: "#e6e9ef" },
  text: { color: "#374151" },
});
