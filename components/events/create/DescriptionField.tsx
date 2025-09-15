// components/events/create/DescriptionField.tsx
import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "@/styles/globalStyles";

interface Props {
  value: string;
  onChange: (t: string) => void;
  placeholder?: string;
}

export default function DescriptionField({
  value,
  onChange,
  placeholder = "La descripción de tu evento va aquí.",
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={COLORS.textSecondary}
      />
      <Text style={styles.hint}>
        Tip: contá line-up, dress code, políticas de ingreso y lo que haga único
        al evento.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  hint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
});
