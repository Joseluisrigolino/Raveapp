import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";

interface Props {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  secureEntry: boolean;
  setSecureEntry: (v: boolean | ((s: boolean) => boolean)) => void;
  canCreate: boolean;
  onCreate: () => void;
}

// Componente que renderiza la tarjeta de "Crear Nuevo Usuario"
// Comentarios en español, internals en inglés
export default function CreateUserControllerInfoComponent({
  username,
  setUsername,
  password,
  setPassword,
  secureEntry,
  setSecureEntry,
  canCreate,
  onCreate,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Crear Nuevo Usuario</Text>

      <Text style={styles.label}>Nombre de Usuario (Login)</Text>
      <TextInput
        mode="outlined"
        placeholder="Nombre controlador"
        placeholderTextColor="rgba(107,114,128,0.4)"
        value={username}
        onChangeText={setUsername}
        left={<TextInput.Icon icon="account-outline" color="#6b7280" />}
        style={styles.input}
        outlineStyle={{ borderRadius: 14 }}
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        mode="outlined"
        placeholder="••••••••"
        placeholderTextColor="rgba(107,114,128,0.4)"
        secureTextEntry={secureEntry}
        value={password}
        onChangeText={setPassword}
        left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
        right={<TextInput.Icon icon={secureEntry ? "eye" : "eye-off"} color="#6b7280" onPress={() => setSecureEntry((s: any) => !s)} />}
        style={styles.input}
        outlineStyle={{ borderRadius: 14 }}
      />

      <Button
        mode="contained"
        onPress={onCreate}
        disabled={!canCreate}
        style={styles.primaryBtn}
        contentStyle={{ height: 50 }}
        labelStyle={{ fontWeight: "700", color: "#ffffff" }}
        icon={({ size, color }) => <Icon name="person-add" size={size} color={color} />}
      >
        Crear Usuario Controlador
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    marginBottom: 12,
  },
  cardTitle: { fontWeight: "700", color: "#111827", marginBottom: 10 },
  label: { color: "#6b7280", marginBottom: 6, marginTop: 8 },
  input: { marginBottom: 8, backgroundColor: "#fff" },
  primaryBtn: { borderRadius: 12, backgroundColor: "#0f172a", marginTop: 8 },
});
