import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import TicketSelector from "@/components/tickets/TicketSelector";
import { styles } from "./styles";
import { COLORS } from "@/styles/globalStyles";

type UiEntrada = any;

type Props = {
  fechas: { idFecha: string }[];
  entradasPorFecha: Record<string, UiEntrada[]>;
  loadingEntradas: boolean;
  selectedTickets: Record<string, number>;
  // Cambia la cantidad absoluta para una entrada
  setTicketQty: (key: string, qty: number) => void;
  subtotal: number;
  noEntradasAvailable: boolean;
  onBuy: () => void;
};

export default function SeccionEntradas({ fechas, entradasPorFecha, loadingEntradas, selectedTickets, setTicketQty, subtotal, noEntradasAvailable, onBuy }: Props) {
  // Determinar si hay un día "activo" (con alguna cantidad > 0)
  const activeDayId = useMemo(() => {
    for (const f of fechas) {
      const entradas = entradasPorFecha[f.idFecha] || [];
      for (const ent of entradas) {
        const entryKey = `entrada-${ent.idEntrada}`;
        if ((selectedTickets[entryKey] || 0) > 0) return f.idFecha;
      }
    }
    return null as string | null;
  }, [fechas, entradasPorFecha, selectedTickets]);

  return (
    <View style={styles.ticketSection}>
      <Text style={styles.sectionTitle}>Selecciona tus entradas</Text>

      {loadingEntradas && (
        <View style={{ paddingVertical: 8 }}>
          <Text>Cargando entradas...</Text>
        </View>
      )}

      {!loadingEntradas && noEntradasAvailable ? (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <Text style={{ color: COLORS.textSecondary }}>Entradas no disponibles.</Text>
        </View>
      ) : (
        !loadingEntradas &&
        fechas.map((f, idx) => {
          const entradas = entradasPorFecha[f.idFecha] || [];
          const disabledDay = activeDayId !== null && activeDayId !== f.idFecha;
          const dayHasQty = entradas.some((ent) => (selectedTickets[`entrada-${ent.idEntrada}`] || 0) > 0);
          return (
            <View key={f.idFecha} style={[styles.dayBlock, disabledDay && { opacity: 0.45 }]}>
              <Text style={styles.dayLabel}>
                {fechas.length > 1 ? `Día ${idx + 1} de ${fechas.length}` : "Día único"}
              </Text>

              {dayHasQty && (
                <TouchableOpacity
                  accessibilityLabel="Limpiar selección del día"
                  style={styles.clearDayBtn}
                  onPress={() => {
                    entradas.forEach((ent) => setTicketQty(`entrada-${ent.idEntrada}`, 0));
                  }}
                >
                  <MaterialCommunityIcons name="trash-can" size={18} color="#fff" />
                </TouchableOpacity>
              )}

              {entradas.length === 0 ? (
                <Text style={{ color: COLORS.textSecondary }}>No hay entradas para esta fecha.</Text>
              ) : (
                entradas.map((ent) => {
                  const entryKey = `entrada-${ent.idEntrada}`;
                  return (
                    <TicketSelector
                      key={entryKey}
                      label={`${ent.nombreTipo} ($${ent.precio})`}
                      maxQty={Math.min(10, ent.maxCompra ?? 10)}
                      currentQty={selectedTickets[entryKey] || 0}
                      onChangeQty={(qty) => setTicketQty(entryKey, qty)}
                      disabled={disabledDay}
                    />
                  );
                })
              )}
            </View>
          );
        })
      )}

      <View style={styles.subtotalRow}>
        <Text style={styles.subtotalText}>Subtotal: ${subtotal}</Text>
        <TouchableOpacity
          style={[
            styles.buyButton,
            (noEntradasAvailable || subtotal <= 0) && styles.buyButtonDisabled,
          ]}
          onPress={onBuy}
          disabled={noEntradasAvailable || subtotal <= 0}
        >
          <Text style={styles.buyButtonText}>Comprar</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
