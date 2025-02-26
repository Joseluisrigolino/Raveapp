// components/SearchBarComponent.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";
import { SearchBarProps } from "@/interfaces/SearchBarProps";

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Buscar...", // Valor por defecto, pero se puede sobrescribir
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        left={<TextInput.Icon icon="magnify" color="#000" size={24} />}
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
  },
  input: {
    backgroundColor: "#fff", // Asegura que el fondo sea blanco para contraste
  },
});

export default SearchBar;
