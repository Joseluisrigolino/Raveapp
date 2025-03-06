import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface DateTimeInputProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: "date" | "time" | "datetime";
}

export default function DateTimeInputComponent({
  label,
  value,
  onChange,
  mode = "datetime",
}: DateTimeInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatDateTime = (date: Date) => {
    if (!date) return "Seleccionar fecha/hora";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} - ${hours}:${minutes}hs`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity style={styles.fakeInput} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateText}>{formatDateTime(value)}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value}
          mode={mode === "datetime" ? "date" : mode}
          is24Hour={true}
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    width: 300,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 4,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
  },
  fakeInput: {
    backgroundColor: COLORS.backgroundLight, // "#F3F3F3"
    borderRadius: RADIUS.card,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dateText: {
    color: COLORS.textPrimary,
  },
});
