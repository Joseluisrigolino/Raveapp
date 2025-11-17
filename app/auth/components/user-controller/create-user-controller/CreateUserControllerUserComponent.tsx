import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";

interface Props {
  username: string;
  onDelete?: () => void;
}

// Fila que representa un usuario creado
// Comentarios en español, internals en inglés
export default function CreateUserControllerUserComponent({ username, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.avatar}><Icon name="person" size={18} color="#0f172a" /></View>
        <Text style={styles.title}>{username}</Text>
      </View>
      {!!onDelete && (
        <Pressable onPress={onDelete} hitSlop={8}>
          <Icon name="delete-outline" size={20} color="#991b1b" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    marginBottom: 8,
  },
  left: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  title: { color: "#111827", fontWeight: "600" },
});
