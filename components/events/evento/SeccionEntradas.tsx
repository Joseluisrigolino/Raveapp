import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import TicketSelector from "@/components/tickets/TicketSelector";
import { styles } from "./styles";
import { COLORS } from "@/styles/globalStyles";

type UiEntrada = any;

type Props = {
  fechas: { idFecha: string }[];
  entradasPorFecha: Record<string, UiEntrada[]>;
  loadingEntradas: boolean;
  selectedTickets: Record<string, number>;
  updateTicketCount: (key: string, delta: number) => void;
  subtotal: number;
  noEntradasAvailable: boolean;
  onBuy: () => void;
};

export default function SeccionEntradas({ fechas, entradasPorFecha, loadingEntradas, selectedTickets, updateTicketCount, subtotal, noEntradasAvailable, onBuy }: Props) {
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
          return (
            <View key={f.idFecha} style={styles.dayBlock}>
              <Text style={styles.dayLabel}>
                {fechas.length > 1 ? `Día ${idx + 1} de ${fechas.length}` : "Día único"}
              </Text>

              {entradas.length === 0 ? (
                <Text style={{ color: COLORS.textSecondary }}>No hay entradas para esta fecha.</Text>
              ) : (
                entradas.map((ent) => {
                  const entryKey = `entrada-${ent.idEntrada}`;
                  return (
                    <TicketSelector
                      key={entryKey}
                      label={`${ent.nombreTipo} ($${ent.precio})`}
                      maxQty={ent.maxCompra}
                      currentQty={selectedTickets[entryKey] || 0}
                      onChange={(d) => updateTicketCount(entryKey, d)}
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
