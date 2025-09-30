// components/events/create/ScheduleSection.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "@/styles/globalStyles";

type DaySchedule = {
  start: Date;
  end: Date;
};

interface Props {
  daySchedules: DaySchedule[];
  setSchedule: (index: number, key: keyof DaySchedule, val: Date) => void;
}

const GREEN = "#17a34a";

/** ================== Campo Fecha+Hora con modal ================== */
function DirectDateTimeField({
  value,
  onChange,
  placeholder = "Seleccionar fecha y hora",
}: {
  value: Date;
  onChange: (d: Date) => void;
  placeholder?: string;
}) {
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
    Platform.OS === "ios"
      ? { textColor: "#111111" }
      : { themeVariant: "light" };

  const pickerCommonPropsTime: any =
    Platform.OS === "ios"
      ? { textColor: "#111111" }
      : { themeVariant: "light", is24Hour: true };

  return (
    <>
      <TouchableOpacity style={styles.dtButton} onPress={open}>
        <MaterialCommunityIcons
          name="calendar-clock"
          size={18}
          color={COLORS.textPrimary}
          style={{ marginRight: 6 }}
        />
        <Text style={styles.dtButtonText}>{fmt(value)}</Text>
      </TouchableOpacity>

      {/* FECHA & HORA: iOS usa modales personalizados, Android usa pickers nativos (no modal) */}
      {Platform.OS === "ios" ? (
        <>
          {/* FECHA (iOS) */}
          <Modal visible={showDate} transparent animationType="fade">
            <View style={styles.modalBackdrop}>
              <View
                style={[
                  styles.modalCard,
                  styles.modalInner,
                  { backgroundColor: COLORS.cardBg },
                ]}
              >
                <Text style={styles.modalTitle}>Seleccionar fecha</Text>
                <DateTimePicker
                  value={tmpDate}
                  mode="date"
                  display={"spinner"}
                  {...pickerCommonPropsDate}
                  onChange={(_, d) => {
                    if (d) setTmpDate(d);
                  }}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#E5E7EB" }]}
                    onPress={() => setShowDate(false)}
                  >
                    <Text
                      style={[styles.actionText, { color: COLORS.textPrimary }]}
                    >
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: GREEN }]}
                    onPress={() => {
                      setShowDate(false);
                      setShowTime(true);
                    }}
                  >
                    <Text style={styles.actionText}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* HORA (iOS) */}
          <Modal visible={showTime} transparent animationType="fade">
            <View style={styles.modalBackdrop}>
              <View
                style={[
                  styles.modalCard,
                  styles.modalInner,
                  { backgroundColor: COLORS.cardBg },
                ]}
              >
                <Text style={styles.modalTitle}>Seleccionar hora</Text>
                <DateTimePicker
                  value={tmpDate}
                  mode="time"
                  display={"spinner"}
                  {...pickerCommonPropsTime}
                  onChange={(_, d) => {
                    if (d) {
                      const merged = new Date(tmpDate);
                      merged.setHours(d.getHours(), d.getMinutes(), 0, 0);
                      setTmpDate(merged);
                    }
                  }}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#E5E7EB" }]}
                    onPress={() => setShowTime(false)}
                  >
                    <Text
                      style={[styles.actionText, { color: COLORS.textPrimary }]}
                    >
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: GREEN }]}
                    onPress={() => {
                      setShowTime(false);
                      onChange(tmpDate);
                    }}
                  >
                    <Text style={styles.actionText}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <>
          {/* Android: usar pickers nativos fuera de Modal para evitar doble diálogo */}
          {showDate && (
            <DateTimePicker
              value={tmpDate}
              mode="date"
              display={"calendar"}
              {...pickerCommonPropsDate}
              onChange={(event: any, d?: Date) => {
                if (!d || (event && event.type === "dismissed")) {
                  setShowDate(false);
                  return;
                }
                setTmpDate(d);
                setShowDate(false);
                // Abrir picker de hora inmediatamente
                setTimeout(() => setShowTime(true), 50);
              }}
            />
          )}

          {showTime && (
            <DateTimePicker
              value={tmpDate}
              mode="time"
              display={"clock"}
              {...pickerCommonPropsTime}
              onChange={(event: any, d?: Date) => {
                if (!d || (event && event.type === "dismissed")) {
                  setShowTime(false);
                  return;
                }
                const merged = new Date(tmpDate);
                merged.setHours(d.getHours(), d.getMinutes(), 0, 0);
                setShowTime(false);
                onChange(merged);
              }}
            />
          )}
        </>
      )}
    </>
  );
}

/** ================== Sección Horarios por Día ================== */
export default function ScheduleSection({ daySchedules, setSchedule }: Props) {
  return (
    <>
      {daySchedules.map((d, i) => (
        <View key={`sch-${i}`} style={styles.card}>
          <Text style={styles.dayTitle}>Día {i + 1}</Text>

          <Text style={styles.label}>Inicio</Text>
          <DirectDateTimeField
            value={d.start}
            onChange={(val) => setSchedule(i, "start", val)}
          />

          <Text style={[styles.label, { marginTop: 8 }]}>Finalización</Text>
          <DirectDateTimeField
            value={d.end}
            onChange={(val) => setSchedule(i, "end", val)}
          />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 14,
    marginBottom: 14,
  },

  // textos
  label: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  dayTitle: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  // botón fecha/hora
  dtButton: {
    width: "100%",
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  dtButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },

  // modal base reutilizable
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    overflow: "hidden",
    maxHeight: "90%",
  },
  modalInner: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  actionBtn: {
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
  },
});
