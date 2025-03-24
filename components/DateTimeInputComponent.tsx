// DateTimeInputComponent.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface DateTimeInputProps {
  label: string;
  value: Date;
  onChange: (newDate: Date) => void;
}

/**
 * Muestra dos botones: uno para elegir la fecha, otro para la hora.
 * Al hacer tap, abre un DateTimePicker en modo 'date' o 'time'.
 */
export default function DateTimeInputComponent({
  label,
  value,
  onChange,
}: DateTimeInputProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Manejo del cambio de fecha
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Conservar hora/minutos de "value"
      const newDate = new Date(value);
      newDate.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      onChange(newDate);
    }
  };

  // Manejo del cambio de hora
  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      // Conservar día/mes/año de "value"
      const newDate = new Date(value);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      onChange(newDate);
    }
  };

  // Helpers para formatear
  function formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  function formatTime(date: Date): string {
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${min}hs`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Fila con botón de fecha y botón de hora */}
      <View style={styles.row}>
        {/* Botón de fecha */}
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialCommunityIcons
            name="calendar"
            size={20}
            color={COLORS.cardBg}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.buttonText}>{formatDate(value)}</Text>
        </TouchableOpacity>

        {/* Botón de hora */}
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color={COLORS.cardBg}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.buttonText}>{formatTime(value)}</Text>
        </TouchableOpacity>
      </View>

      {/* Picker de fecha */}
      {showDatePicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Picker de hora */}
      {showTimePicker && (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 16,
  },
  label: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 140,
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },
});
