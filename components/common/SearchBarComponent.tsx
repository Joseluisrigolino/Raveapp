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
  placeholder = "Buscar eventos...",
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        mode="outlined"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        left={<TextInput.Icon icon="magnify" color={COLORS.textSecondary} />}
        style={styles.input}
        contentStyle={styles.content}
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
    marginHorizontal: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 14,
    height: 40,
    fontSize: FONT_SIZES.body,
  },
  content: {
    height: 40,
    paddingVertical: 0,
  },
  outline: {
    borderRadius: 14,
    borderColor: COLORS.borderInput,
    borderWidth: 1,
  },
});
