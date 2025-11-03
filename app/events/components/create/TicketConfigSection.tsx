// components/events/create/TicketConfigSection.tsx
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

// Import doble (named + default) y fallbacks defensivos
import theme, {
  COLORS as NAMED_COLORS,
  RADIUS as NAMED_RADIUS,
} from "@/styles/globalStyles";

const COLORS = NAMED_COLORS ?? (theme as any)?.COLORS ?? {
  backgroundLight: "#FFFFFF",
  cardBg: "#F8F8F8",
  borderInput: "#E0E0E0",
  textPrimary: "#2C2C2C",
  textSecondary: "#6C6C6C",
  primary: "#8E2DE2",
};
const RADIUS = NAMED_RADIUS ?? (theme as any)?.RADIUS ?? { card: 10 };

export type DaySaleConfig = {
  saleStart: Date;
  sellUntil: Date;
};

interface Props {
  daySaleConfigs?: DaySaleConfig[]; // puede venir undefined
  setSaleCfg: (index: number, key: keyof DaySaleConfig, val: Date) => void;
}

const GREEN = "#17a34a";

// Dos campos separados (Fecha | Hora)
function TwoFieldDateTime({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [tmpDate, setTmpDate] = useState<Date>(value || new Date());

  const openDate = () => {
    setTmpDate(value || new Date());
    setShowDate(true);
  };
  const openTime = () => {
    setTmpDate(value || new Date());
    setShowTime(true);
  };

  const fmtDate = (d?: Date) =>
    d ? d.toLocaleDateString(undefined, { dateStyle: "medium" }) : "Seleccionar fecha";
  const fmtTime = (d?: Date) =>
    d ? d.toLocaleTimeString(undefined, { timeStyle: "short" }) : "Seleccionar hora";

  const pickerCommonPropsDate: any =
    Platform.OS === "ios" ? { textColor: "#111111" } : { themeVariant: "light" };
  const pickerCommonPropsTime: any =
    Platform.OS === "ios" ? { textColor: "#111111" } : { themeVariant: "light", is24Hour: true };

  return (
    <>
      <View style={styles.rowTwo}>
        <TouchableOpacity style={[styles.dtButton, styles.dtButtonSmall]} onPress={openDate}>
          <MaterialCommunityIcons name="calendar" size={18} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.dtButtonText}>{fmtDate(value)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dtButton, styles.dtButtonSmall]} onPress={openTime}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.dtButtonText}>{fmtTime(value)}</Text>
        </TouchableOpacity>
      </View>

      {Platform.OS === "ios" ? (
        <>
          <Modal visible={showDate} transparent animationType="fade">
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, styles.modalInner, { backgroundColor: COLORS.cardBg }]}>
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
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#E5E7EB" }]} onPress={() => setShowDate(false)}>
                    <Text style={[styles.actionText, { color: COLORS.textPrimary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: GREEN }]}
                    onPress={() => {
                      setShowDate(false);
                      onChange(tmpDate);
                    }}
                  >
                    <Text style={styles.actionText}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={showTime} transparent animationType="fade">
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, styles.modalInner, { backgroundColor: COLORS.cardBg }]}>
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
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#E5E7EB" }]} onPress={() => setShowTime(false)}>
                    <Text style={[styles.actionText, { color: COLORS.textPrimary }]}>Cancelar</Text>
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
                onChange(d);
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

/** ================== Sección Configuración de Entradas ================== */
export default function TicketConfigSection({
  daySaleConfigs,
  setSaleCfg,
}: Props) {
  // Defensa: si viene undefined/null, usamos []
  const items = Array.isArray(daySaleConfigs) ? daySaleConfigs : [];

  return (
    <>
      {items.map((cfg, i) => (
        <View key={`cfg-${i}`} style={styles.card}>
          <Text style={styles.dayTitle}>Día {i + 1}</Text>

          <Text style={styles.label}>Inicio de venta</Text>
          <TwoFieldDateTime value={cfg.saleStart} onChange={(val) => setSaleCfg(i, "saleStart", val)} />

          <Text style={[styles.label, { marginTop: 8 }]}>
            Vender Generales/VIP hasta
          </Text>
          <TwoFieldDateTime value={cfg.sellUntil} onChange={(val) => setSaleCfg(i, "sellUntil", val)} />
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
  dtButtonSmall: { flex: 1 },
  dtButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  rowTwo: { flexDirection: "row", alignItems: "center", gap: 10 },

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
