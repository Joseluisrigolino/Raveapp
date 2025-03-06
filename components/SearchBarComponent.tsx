// components/SearchBarComponent.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";
import { SearchBarProps } from "@/interfaces/SearchBarProps";

import globalStyles, { COLORS } from "@/styles/globalStyles";

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Buscar...",
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        left={<TextInput.Icon icon="magnify" color={COLORS.textPrimary} size={24} />}
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
    backgroundColor: globalStyles.COLORS.cardBg, // Blanco
  },
});

export default SearchBar;
