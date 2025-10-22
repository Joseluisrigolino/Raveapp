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
    <View>
      {loadingEntradas && (
        <View style={{ paddingVertical: 8, alignItems: 'center' }}>
          <Text>Cargando entradas...</Text>
        </View>
      )}

      {!loadingEntradas && noEntradasAvailable ? (
        <View style={[styles.ticketSection, { alignItems: 'center' }]}>
          <Text style={{ color: COLORS.textSecondary }}>Entradas no disponibles.</Text>
        </View>
      ) : (
        !loadingEntradas && fechas.map((f, idx) => {
          const entradas = entradasPorFecha[f.idFecha] || [];
          const disabledDay = activeDayId !== null && activeDayId !== f.idFecha;
          return (
            <View key={f.idFecha} style={styles.ticketSection}>
              <Text style={styles.sectionTitle}>Seleccionar Entradas</Text>
              {fechas.length > 1 && (
                <Text style={styles.dayLabel}>{`Día ${idx + 1}`}</Text>
              )}

              {entradas.length === 0 ? (
                <Text style={{ color: COLORS.textSecondary }}>No hay entradas para esta fecha.</Text>
              ) : (
                entradas.map((ent) => {
                  const entryKey = `entrada-${ent.idEntrada}`;
                  return (
                    <TicketSelector
                      key={entryKey}
                      label={ent.nombreTipo}
                      rightText={`$${ent.precio}`}
                      stacked
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

      {/* Subtotal arriba del botón a lo largo */}
      <View style={{ marginHorizontal: 16, marginTop: 8 }}>
        <Text style={styles.subtotalText}>Subtotal: ${subtotal}</Text>
        <TouchableOpacity
          style={[
            styles.buyButtonFull,
            (noEntradasAvailable || subtotal <= 0) && styles.buyButtonDisabled,
          ]}
          onPress={onBuy}
          disabled={noEntradasAvailable || subtotal <= 0}
        >
          <Text style={styles.buyButtonText}>Comprar Entradas</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
