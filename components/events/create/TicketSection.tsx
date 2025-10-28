// components/events/create/TicketSection.tsx
import React from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";
import { COLORS, RADIUS } from "@/styles/globalStyles";

export type DayTickets = {
  genQty: string;
  genPrice: string;
  ebGenQty: string;
  ebGenPrice: string;
  vipQty: string;
  vipPrice: string;
  ebVipQty: string;
  ebVipPrice: string;
};

interface Props {
  daysTickets: DayTickets[];
  setTicket: (index: number, key: keyof DayTickets, val: string) => void;
  totalPerDay: (d: DayTickets) => number;
  /** Nombres que llegan desde la BD (GetTiposEntrada) */
  labels?: {
    general?: string;
    earlyGeneral?: string;
    vip?: string;
    earlyVip?: string;
  };
}

export default function TicketsSection({
  daysTickets,
  setTicket,
  totalPerDay,
  labels,
}: Props) {
  const L = {
    general: labels?.general || "Entradas Generales",
    earlyGeneral: labels?.earlyGeneral || "Early Bird General",
    vip: labels?.vip || "Entradas VIP",
    earlyVip: labels?.earlyVip || "Early Bird VIP",
  };

  return (
    <>
      {daysTickets.map((d, i) => {
        const enableEBGen = (parseInt(d.genQty || "0", 10) || 0) > 0;
        const enableEBVip = (parseInt(d.vipQty || "0", 10) || 0) > 0;

        return (
          <View key={`tk-${i}`} style={styles.card}>
            <Text style={styles.dayTitle}>Día {i + 1}</Text>

            {/* Generales */}
            <Text style={styles.fieldTitle}>{L.general} *</Text>
            <View style={styles.rowTwo}
            >
              <TextInput
                style={[styles.input, styles.inputHalf]}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                value={d.genQty}
                onChangeText={(v) => setTicket(i, "genQty", v.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                value={d.genPrice}
                onChangeText={(v) => setTicket(i, "genPrice", v.replace(/[^0-9]/g, ''))}
                placeholder="Precio"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.divider} />

            {/* Early Bird General */}
            <Text style={styles.fieldTitle}>{L.earlyGeneral} (opcional)</Text>
            <View style={styles.rowTwo}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputHalf,
                  !enableEBGen && styles.inputDisabled,
                ]}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                value={d.ebGenQty}
                onChangeText={(v) => setTicket(i, "ebGenQty", v.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                editable={enableEBGen}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputHalf,
                  !enableEBGen && styles.inputDisabled,
                ]}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                value={d.ebGenPrice}
                onChangeText={(v) => setTicket(i, "ebGenPrice", v.replace(/[^0-9]/g, ''))}
                placeholder="Precio EarlyBird"
                placeholderTextColor={COLORS.textSecondary}
                editable={enableEBGen}
              />
            </View>
            <View style={styles.divider} />

            {/* VIP */}
            <Text style={styles.fieldTitle}>{L.vip} (opcional)</Text>
            <View style={styles.rowTwo}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                value={d.vipQty}
                onChangeText={(v) => setTicket(i, "vipQty", v.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                value={d.vipPrice}
                onChangeText={(v) => setTicket(i, "vipPrice", v.replace(/[^0-9]/g, ''))}
                placeholder="Precio"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.divider} />

            {/* Early Bird VIP */}
            <Text style={styles.fieldTitle}>{L.earlyVip} (opcional)</Text>
            <View style={styles.rowTwo}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputHalf,
                  !enableEBVip && styles.inputDisabled,
                ]}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                value={d.ebVipQty}
                onChangeText={(v) => setTicket(i, "ebVipQty", v.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                editable={enableEBVip}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputHalf,
                  !enableEBVip && styles.inputDisabled,
                ]}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                value={d.ebVipPrice}
                onChangeText={(v) => setTicket(i, "ebVipPrice", v.replace(/[^0-9]/g, ''))}
                placeholder="Precio EarlyBird"
                placeholderTextColor={COLORS.textSecondary}
                editable={enableEBVip}
              />
            </View>

            {/* Total del día */}
            <Text style={styles.totalLine}>
              Total entradas:{" "}
              <Text style={{ color: "#17a34a", fontWeight: "700" }}>
                {totalPerDay(d)}
              </Text>
            </Text>
          </View>
        );
      })}
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

  row: { flexDirection: "row", alignItems: "center" },
  rowTwo: { flexDirection: "row", alignItems: "center", gap: 10 },

  // textos
  fieldTitle: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 6,
  },
  dayTitle: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  totalLine: {
    marginTop: 10,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  // inputs
  input: {
    width: "100%",
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
  },
  inputSm: { width: 140, marginRight: 10 },
  inputHalf: { flex: 1 },
  inputDisabled: {
    backgroundColor: COLORS.borderInput,
    color: COLORS.textSecondary,
  },

  hint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderInput,
    marginTop: 10,
  },
});
