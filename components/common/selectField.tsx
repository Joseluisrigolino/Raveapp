import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
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
  const showPlaceholder = !value || !value.trim();

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
          {showPlaceholder ? placeholder || "Seleccioná una opción" : value}
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
  wrapper: { width: "100%", alignItems: "center" },
  label: {
    width: "90%",
    fontSize: FONT_SIZES.body + 2,
    fontFamily: FONTS.subTitleMedium,
    color: COLORS.textPrimary,
    textAlign: "left",
    marginBottom: 4,
  },
  field: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  valueText: {
    flex: 1,
    marginRight: 8,
    color: "#111827",
    fontFamily: FONTS.bodyRegular,
  },
});
