import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import TicketSelector from "@/app/tickets/components/TicketSelector";
import { styles } from "./styles";
import { COLORS } from "@/styles/globalStyles";

type UiEntrada = any;

type Props = {
  fechas: { idFecha: string; inicio?: string; fin?: string }[];
  entradasPorFecha: Record<string, UiEntrada[]>;
  loadingEntradas: boolean;
  selectedTickets: Record<string, number>;
  // Cambia la cantidad absoluta para una entrada
  setTicketQty: (key: string, qty: number) => void;
  subtotal: number;
  noEntradasAvailable: boolean;
  onBuy: () => void;
  isAdmin?: boolean;
};

export default function SeccionEntradas({ fechas, entradasPorFecha, loadingEntradas, selectedTickets, setTicketQty, subtotal, noEntradasAvailable, onBuy, isAdmin }: Props) {
  const formatDay = (f: { inicio?: string; fin?: string }): { date: string; time?: string } => {
    const res = { date: "", time: undefined as string | undefined };
    try {
      if (f?.inicio) {
        const d = new Date(f.inicio);
        const day = d.getDate().toString().padStart(2, "0");
        const month = d.toLocaleString("es-ES", { month: "short" }).replace(".", "");
        const year = d.getFullYear();
        res.date = `${day} ${month} ${year}`;
        if (f?.fin) {
          const e = new Date(f.fin);
          const pad = (n: number) => n.toString().padStart(2, "0");
          res.time = `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(e.getHours())}:${pad(e.getMinutes())} hs`;
        }
      }
    } catch {}
    return res;
  };
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
          const meta = formatDay(f);
          return (
            <View key={f.idFecha} style={styles.ticketSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={18} color={COLORS.info} style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>
                  {fechas.length > 1 ? `Día ${idx + 1}` : `Entradas`}
                </Text>
              </View>
              {meta.date ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons name="clock-time-four-outline" size={16} color={COLORS.info} style={{ marginRight: 6 }} />
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '600' }}>{meta.date}</Text>
                  {meta.time ? <Text style={{ color: COLORS.textSecondary, marginLeft: 8 }}>{meta.time}</Text> : null}
                </View>
              ) : null}
              <Text style={[styles.dayLabel, { marginBottom: 8, color: COLORS.textSecondary }]}>Tipos de entrada</Text>

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
            (noEntradasAvailable || subtotal <= 0 || isAdmin) && styles.buyButtonDisabled,
          ]}
          onPress={() => {
            if (isAdmin) {
              Alert.alert("Acceso restringido", "Sos administrador y no podés comprar entradas.");
            } else {
              onBuy();
            }
          }}
          // NOTE: no deshabilitamos el touch en admins porque `disabled` evita ejecutar onPress,
          // queremos que al tocar muestre la alerta. Mantener solo las condiciones funcionales.
          disabled={noEntradasAvailable || subtotal <= 0}
        >
          <Text style={styles.buyButtonText}>Comprar Entradas</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
