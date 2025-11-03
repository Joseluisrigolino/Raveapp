import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import SearchBarComponent from "@/components/common/SearchBarComponent";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { fetchEventStates, ApiEstadoEvento } from "@/app/events/apis/eventApi";
import type { FilterValue } from "@/app/events/components/manage/Filters";

type Props = {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  onStatesLoaded?: (states: { code: number; label: string }[]) => void;
  searchText?: string;
  onSearchTextChange?: (val: string) => void;
  placeholder?: string;
};

export default function FiltersAdministrarEventos({
  value,
  onChange,
  onStatesLoaded,
  searchText = "",
  onSearchTextChange,
  placeholder = "Buscar por nombre...",
}: Props) {
  // Estados traídos desde la API (la original ManageEventFilters hace esto)
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<{ code: number | "all"; label: string }[]>([
    { code: "all", label: "Todos" },
  ]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchEventStates();
        const apiOptions = (Array.isArray(list) ? list : [])
          .filter((s: ApiEstadoEvento) => Number.isFinite(Number(s?.cdEstado)))
          .sort((a, b) => Number(a.cdEstado) - Number(b.cdEstado))
          .map((s) => ({ code: Number(s.cdEstado), label: String(s.dsEstado || "") }));

        if (!apiOptions.length) {
          const fallback = [
            { code: 0, label: "Por Aprobar" },
            { code: 1, label: "Aprobado" },
            { code: 2, label: "En venta" },
            { code: 3, label: "Fin Venta" },
            { code: 4, label: "Finalizado" },
            { code: 5, label: "Cancelado" },
          ];
          if (mounted) {
            setOptions([{ code: "all", label: "Todos" }, ...fallback]);
            onStatesLoaded?.(fallback as any);
          }
          return;
        }

        if (mounted) {
          setOptions([{ code: "all", label: "Todos" }, ...apiOptions]);
          onStatesLoaded?.(apiOptions as any);
        }
      } catch {
        const fallback = [
          { code: 0, label: "Por Aprobar" },
          { code: 1, label: "Aprobado" },
          { code: 2, label: "En venta" },
          { code: 3, label: "Fin Venta" },
          { code: 4, label: "Finalizado" },
          { code: 5, label: "Cancelado" },
        ];
        if (mounted) {
          setOptions([{ code: "all", label: "Todos" }, ...fallback]);
          onStatesLoaded?.(fallback as any);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [onStatesLoaded]);

  const current = useMemo(() => options.find((o) => o.code === value), [options, value]);

  const handleChange = onSearchTextChange ?? (() => {});

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {options.map((opt) => {
          const isActive = opt.code === value;
          return (
            <TouchableOpacity
              key={String(opt.code)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onChange(opt.code as any)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
        {loading && (
          <View style={[styles.filterChip, { paddingHorizontal: 10 }]}>
            <ActivityIndicator />
          </View>
        )}
      </ScrollView>

      <View style={styles.searchContainer}>
        <SearchBarComponent value={searchText} onChangeText={handleChange} placeholder={placeholder} />
      </View>
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
  searchContainer: {
    marginHorizontal: 12,
    marginTop: 10,
  },
});
