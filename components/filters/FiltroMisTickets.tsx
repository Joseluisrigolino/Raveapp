import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS, FONT_SIZES } from "@/styles/globalStyles";
import { fetchEstadosEntrada, ApiEstadoEntrada } from "@/utils/events/entradaApi";

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
        const es = await fetchEstadosEntrada();
        if (mounted) setEstados(Array.isArray(es) ? es : []);
      } catch {
        if (mounted) setEstados([]);
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
