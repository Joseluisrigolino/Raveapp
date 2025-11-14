import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
// Import sin tipos: definimos declaración mínima para evitar error TS si no existe @types
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";

interface SelectFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
  disabled?: boolean;
  isOpen?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
  fieldStyle?: ViewStyle;
}

export default function SelectField({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
  isOpen = false,
  containerStyle,
  labelStyle,
  valueStyle,
  fieldStyle,
}: SelectFieldProps) {
  // Defender contra valores no string (p.ej. null, undefined, números)
  const safeValue = typeof value === 'string' ? value : (value != null ? String(value) : '');
  const showPlaceholder = !safeValue || !safeValue.trim();

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.field, disabled && { opacity: 0.6 }, fieldStyle]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text
          style={[
            styles.valueText,
            showPlaceholder && { color: COLORS.textSecondary },
            valueStyle,
          ]}
          numberOfLines={1}
        >
          {showPlaceholder ? placeholder || "Seleccioná una opción" : safeValue}
        </Text>
        <MaterialCommunityIcons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={22}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", alignItems: "flex-start" },
  label: {
    width: "100%",
    fontSize: FONT_SIZES.body + 2,
    fontFamily: FONTS.subTitleMedium,
    color: COLORS.textPrimary,
    textAlign: "left",
    marginBottom: 4,
  },
  field: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  valueText: {
    flex: 1,
    marginRight: 8,
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodyRegular,
  },
});
