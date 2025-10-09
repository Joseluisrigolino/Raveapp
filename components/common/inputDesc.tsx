import React, { useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import type { InputTextProps } from "@/components/common/inputText";

export default function InputDesc({
  label,
  value,
  isEditing,
  onBeginEdit,
  onChangeText,
  keyboardType = "default",
  placeholder,
  containerStyle,
  inputStyle,
  labelStyle,
  editable = true,
  autoFocus = false,
}: InputTextProps) {
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (isEditing && autoFocus && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isEditing, autoFocus]);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      {isEditing ? (
        <TextInput
          ref={inputRef}
          style={[styles.input, styles.textarea, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder || label}
          blurOnSubmit={false}
          autoCorrect={false}
          selectionColor={COLORS.primary}
          returnKeyType="default"
          editable={editable}
          multiline
          textAlignVertical="top"
        />
      ) : (
        <View style={styles.rowNoLabel}>
          <Text style={[styles.valueText, { flex: 1 }]} numberOfLines={3}>
            {value || "–"}
          </Text>
          <TouchableOpacity onPress={onBeginEdit} style={styles.icon}>
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
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
  rowNoLabel: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    marginBottom: 12,
  },
  valueText: {
    flex: 1,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  icon: { padding: 4 },
  input: {
    width: "90%",
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    color: "#111827",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  textarea: {
    minHeight: 140,
    paddingVertical: 12,
  },
});
