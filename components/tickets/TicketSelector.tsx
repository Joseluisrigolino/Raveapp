// components/TicketSelector/TicketSelector.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback } from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import SelectField from "@/components/common/selectField";

/**
 * Componente para seleccionar cantidad con input numérico (0 - max).
 */
interface TicketSelectorProps {
  label: string;
  rightText?: string; // texto alineado a la derecha (ej: precio)
  stacked?: boolean; // si true, muestra el selector debajo en otra fila
  maxQty: number; // límite superior permitido para la compra
  currentQty: number; // cantidad actual seleccionada
  onChangeQty: (qty: number) => void; // establece cantidad absoluta
  disabled?: boolean;
}

export default function TicketSelector({
  label,
  rightText,
  stacked = false,
  maxQty,
  currentQty,
  onChangeQty,
  disabled = false,
}: TicketSelectorProps) {
  const clampedValue = useMemo(() => {
    const n = Number.isFinite(currentQty) ? currentQty : 0;
    if (n < 0) return 0;
    if (n > maxQty) return maxQty;
    return n;
  }, [currentQty, maxQty]);

  const [open, setOpen] = useState(false);
  const maxAllowed = Math.min(10, Math.max(0, maxQty || 0));
  const options = useMemo(() => Array.from({ length: maxAllowed + 1 }, (_, i) => i), [maxAllowed]);

  return (
    <View style={styles.containerRelative}>
      <View style={styles.ticketCard}>
        <View style={styles.ticketSelectorRow}>
          <Text style={styles.ticketSelectorLabel}>{label}</Text>
          {rightText ? <Text style={styles.priceText}>{rightText}</Text> : null}
        </View>
        <View style={[styles.ticketSelectorActions, stacked && { marginTop: 6, justifyContent: 'flex-start' }]}>
          <SelectField
            label=""
            value={String(clampedValue)}
            placeholder="0 entradas"
            onPress={() => { if (!disabled) setOpen((v) => !v); }}
            isOpen={open}
            disabled={disabled}
            containerStyle={{ width: stacked ? '100%' as any : 96, alignItems: stacked ? 'stretch' as any : 'flex-end', marginBottom: 0 }}
            fieldStyle={{ width: stacked ? '100%' as any : 96, height: 36, borderRadius: 12, paddingHorizontal: 10 }}
            labelStyle={{ width: 0, height: 0, marginBottom: 0 }}
            valueStyle={{ textAlign: stacked ? 'left' as any : 'center' }}
          />
        </View>
      </View>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContentWrapper}>
          <View style={styles.modalCard}>
            <ScrollView
              style={styles.menuScrollView}
              contentContainerStyle={{ paddingVertical: 4 }}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {options.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onChangeQty(n);
                    setOpen(false);
                  }}
                >
                  <Text style={{ color: COLORS.textPrimary, textAlign: "center", fontSize: 16 }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  containerRelative: {
    position: "relative",
    zIndex: 10,
  },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  ticketSelectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 2,
  },
  ticketSelectorLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  priceText: { color: COLORS.textPrimary, fontWeight: "700" },
  ticketSelectorActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  modalContentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: 180,
    maxHeight: 260,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    // Shadow
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  menuScrollView: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
});
