// components/events/create/DirectDateTimeField.tsx
import React, { useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type Props = {
  value: Date;
  onChange: (d: Date) => void;
  placeholder?: string;
};

const GREEN = "#17a34a";

export default function DirectDateTimeField({
  value,
  onChange,
  placeholder = "Seleccionar fecha y hora",
}: Props) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [tmpDate, setTmpDate] = useState<Date>(value || new Date());

  const open = () => {
    setTmpDate(value || new Date());
    setShowDate(true);
  };

  const fmt = (d?: Date) =>
    d
      ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : placeholder;

  const pickerCommonPropsDate: any =
    Platform.OS === "ios" ? { textColor: "#111111" } : { themeVariant: "light" };

  const pickerCommonPropsTime: any =
    Platform.OS === "ios"
      ? { textColor: "#111111" }
      : { themeVariant: "light", is24Hour: true };

  return (
    <>
      <TouchableOpacity
        style={{
          width: "100%",
          backgroundColor: COLORS.backgroundLight,
          borderWidth: 1,
          borderColor: COLORS.borderInput,
          borderRadius: RADIUS.card,
          paddingHorizontal: 12,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
        onPress={open}
      >
        <MaterialCommunityIcons
          name="calendar-clock"
          size={18}
          color={"#111"}
          style={{ marginRight: 6 }}
        />
        <Text
          style={{
            color: COLORS.textPrimary,
            fontWeight: "600",
            fontSize: FONT_SIZES.body,
          }}
        >
          {fmt(value)}
        </Text>
      </TouchableOpacity>

      {/* FECHA */}
      <Modal visible={showDate} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: RADIUS.card,
              paddingHorizontal: 14,
              paddingTop: 12,
              paddingBottom: 10,
            }}
          >
            <Text
              style={{
                color: COLORS.textPrimary,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              Seleccionar fecha
            </Text>
            <DateTimePicker
              value={tmpDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              {...pickerCommonPropsDate}
              onChange={(_, d) => d && setTmpDate(d)}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 }}
            >
              <TouchableOpacity
                style={{
                  borderRadius: RADIUS.card,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: "#E5E7EB",
                }}
                onPress={() => setShowDate(false)}
              >
                <Text style={{ color: "#111", fontWeight: "700" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderRadius: RADIUS.card,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: GREEN,
                }}
                onPress={() => {
                  setShowDate(false);
                  setShowTime(true);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* HORA */}
      <Modal visible={showTime} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: RADIUS.card,
              paddingHorizontal: 14,
              paddingTop: 12,
              paddingBottom: 10,
            }}
          >
            <Text style={{ color: COLORS.textPrimary, fontWeight: "700", marginBottom: 6 }}>
              Seleccionar hora
            </Text>
            <DateTimePicker
              value={tmpDate}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "clock"}
              {...pickerCommonPropsTime}
              onChange={(_, d) => {
                if (d) {
                  const merged = new Date(tmpDate);
                  merged.setHours(d.getHours(), d.getMinutes(), 0, 0);
                  setTmpDate(merged);
                }
              }}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 }}
            >
              <TouchableOpacity
                style={{
                  borderRadius: RADIUS.card,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: "#E5E7EB",
                }}
                onPress={() => setShowTime(false)}
              >
                <Text style={{ color: "#111", fontWeight: "700" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderRadius: RADIUS.card,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: GREEN,
                }}
                onPress={() => {
                  setShowTime(false);
                  onChange(tmpDate);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
