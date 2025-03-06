import * as React from "react";
import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";

// Importa tus estilos globales
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface InputFieldProps {
  label?: string;
  secureTextEntry?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label = "",
  secureTextEntry = false,
}) => {
  const [text, setText] = React.useState("");

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        label={label}
        value={text}
        onChangeText={setText}
        secureTextEntry={secureTextEntry}
        mode="outlined"
        outlineColor={COLORS.borderInput}
        activeOutlineColor={COLORS.primary}
        theme={{
          colors: {
            text: COLORS.textPrimary,
            placeholder: COLORS.textSecondary,
            background: COLORS.cardBg,
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  input: {
    width: "85%",
    fontSize: FONT_SIZES.body,
    backgroundColor: COLORS.cardBg, // Blanco
    borderRadius: RADIUS.card,
  },
});

export default InputField;
