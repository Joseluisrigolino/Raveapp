// components/InputFieldComponent.tsx
import * as React from "react";
import { StyleSheet, View, KeyboardTypeOptions, ViewStyle, TextStyle } from "react-native";
import { TextInput } from "react-native-paper";

interface InputFieldProps {
  label?: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label = "",
  secureTextEntry = false,
  value = "",
  onChangeText = () => {},
  keyboardType,
  maxLength,
  containerStyle,
  inputStyle,
  disabled = false,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input, inputStyle]}
        label={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        maxLength={maxLength}
        disabled={disabled}
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
