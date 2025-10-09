// components/events/create/DescriptionField.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "@/styles/globalStyles";
import InputDesc from "@/components/common/inputDesc";

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
      <InputDesc
        label="Descripción"
        value={value}
        isEditing={true}
        onBeginEdit={() => {}}
        onChangeText={onChange}
        placeholder={placeholder}
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
  hint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
});
