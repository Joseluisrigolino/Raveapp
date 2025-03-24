// components/SearchBarComponent.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";
import { SearchBarProps } from "@/interfaces/SearchBarProps";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

/**
 * SearchBar que se ve con fondo blanco, ícono de lupa, etc.
 */
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
        left={<TextInput.Icon icon="magnify" color={COLORS.textPrimary} />}
        style={styles.input}
        outlineStyle={styles.outline}
        textColor={COLORS.textPrimary}
        placeholderTextColor={COLORS.textSecondary}
      />
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.cardBg, // Blanco
    borderRadius: RADIUS.card,
    fontSize: FONT_SIZES.body,
  },
  outline: {
    borderRadius: RADIUS.card,
    borderColor: COLORS.borderInput,
    borderWidth: 1,
  },
});
