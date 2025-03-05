import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

interface DateTimeInputProps {
  label: string;
  /** Valor actual de la fecha/hora como Date */
  value: Date;
  /** Lógica para actualizar la fecha/hora en el padre */
  onChange: (date: Date) => void;
  /** Modo del picker: "date", "time" o "datetime". Por defecto "datetime". */
  mode?: "date" | "time" | "datetime";
}

/**
 * Componente para abrir un calendario/hora nativo (compatible con Expo).
 * Al presionar, abre un DateTimePicker y actualiza `value`.
 */
export default function DateTimeInputComponent({
  label,
  value,
  onChange,
  mode = "datetime",
}: DateTimeInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Se llama cada vez que se elige la fecha/hora
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  // Formatear la fecha/hora para mostrar en pantalla
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

      {/* Al presionar, abrimos el picker */}
      <TouchableOpacity style={styles.fakeInput} onPress={() => setShowPicker(true)}>
        <Text>{formatDateTime(value)}</Text>
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
  },
  fakeInput: {
    backgroundColor: "#F3F3F3",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
