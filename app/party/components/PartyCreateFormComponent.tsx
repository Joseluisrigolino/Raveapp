// app/party/components/PartyCreateFormComponent.tsx
import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { COLORS, RADIUS } from "@/styles/globalStyles";

type Props = {
  value: string;
  loading?: boolean;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
};

export default function PartyCreateFormComponent({
  value,
  loading = false,
  onChangeText,
  onSubmit,
}: Props) {
  const disabled = loading || !value.trim();

  return (
    <View style={styles.row}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Nombre de la fiesta.."
        style={styles.input}
      />
      <TouchableOpacity
        style={[styles.addButton, { opacity: disabled ? 0.5 : 1 }]}
        onPress={onSubmit}
        disabled={disabled}
      >
        <Text style={styles.addText}>{loading ? "…" : "+"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  input: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    // Match the add button height so both have same vertical size
    height: 56,
    paddingVertical: 0,
    // Ensure text is vertically centered on Android
    textAlignVertical: "center",
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  addText: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: -2 },
});
