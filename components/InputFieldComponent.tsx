// components/InputFieldComponent.tsx
import * as React from "react";
import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";

interface InputFieldProps {
  label?: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label = "",
  secureTextEntry = false,
  value = "",
  onChangeText = () => {},
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        label={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
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
  },
});

export default InputField;
