import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS, FONT_SIZES } from "@/styles/globalStyles";
import { fetchEstadosEntrada, ApiEstadoEntrada } from "@/app/events/apis/entradaApi";

// Filtros definitivos solicitados. Solo se muestran estos códigos, en este orden.
// Se ignoran estados adicionales que pueda devolver la API.
const STATIC_FILTERS_ORDERED: Array<{ cdEstado: number; dsEstado: string }> = [
  { cdEstado: 4, dsEstado: 'Entradas a próximos eventos' },   // (ej: pagada / activa futura)
  { cdEstado: 5, dsEstado: 'Entradas pendientes de pago' },   // pendiente
  { cdEstado: 2, dsEstado: 'Entradas utilizadas' },           // controlada
  { cdEstado: 6, dsEstado: 'Entradas no utilizadas' },        // no usada luego del evento
  { cdEstado: 3, dsEstado: 'Entradas anuladas' },             // cancelada / anulada
];

interface FiltroMisTicketsProps {
  // ids de estado seleccionados (cdEstado)
  selectedEstadoIds: number[];
  onToggleEstado: (id: number) => void;
  onClear?: () => void;
  // opcional para scroll anidado (coincidente con FiltersSection)
  nestedScrollEnabled?: boolean;
}

export default function FiltroMisTickets(props: FiltroMisTicketsProps) {
  const { selectedEstadoIds, onToggleEstado, onClear, nestedScrollEnabled } = props;
  const [estados, setEstados] = useState<ApiEstadoEntrada[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Llamada solo para quizá validar existencia, pero no añadimos códigos extra.
        await fetchEstadosEntrada().catch(() => [] as any[]);
        if (mounted) setEstados(STATIC_FILTERS_ORDERED as any);
      } catch {
        if (mounted) setEstados(STATIC_FILTERS_ORDERED as any);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const isSelected = (id: number) => selectedEstadoIds.includes(id);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      >
        {estados.map((e) => {
          const id = Number(e.cdEstado);
          const label = e.dsEstado ?? `Estado ${id}`;
          const active = isSelected(id);
          return (
            <TouchableOpacity
              key={id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => onToggleEstado(id)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
        {typeof onClear === "function" && (
          <TouchableOpacity style={[styles.filterChip, styles.clearChip]} onPress={() => onClear && onClear()}>
            <Text style={[styles.filterChipText, styles.clearText]}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundLight,
    paddingBottom: 8,
  },
  horizontalScroll: {
    marginHorizontal: 12,
    marginTop: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.chip,
    marginRight: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  filterChipActive: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.textSecondary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    marginLeft: 0,
  },
  filterChipTextActive: {
    color: COLORS.textPrimary,
  },
  clearChip: {
    backgroundColor: COLORS.negative,
    borderColor: COLORS.negative,
  },
  clearText: {
    color: COLORS.cardBg,
    fontWeight: "700",
  },
});
