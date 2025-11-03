// components/events/manage/Filters.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { fetchEventStates, ApiEstadoEvento } from "@/app/events/apis/eventApi";

export type FilterValue = number | "all";

type Option = { code: number | "all"; label: string };

interface Props {
  /** valor seleccionado: número de estado o "all" */
  value: FilterValue;
  /** callback cuando cambia el filtro */
  onChange: (v: FilterValue) => void;
  /**
   * opcional: te devuelvo los estados cargados desde la API
   * para que el padre los use si necesita (p.ej. para pedir por lote).
   */
  onStatesLoaded?: (states: { code: number; label: string }[]) => void;
}

export default function ManageEventFilters({
  value,
  onChange,
  onStatesLoaded,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<Option[]>([
    { code: "all", label: "Todos" },
  ]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchEventStates(); // [{cdEstado, dsEstado}, ...]
        const apiOptions = (Array.isArray(list) ? list : [])
          .filter((s: ApiEstadoEvento) => Number.isFinite(Number(s?.cdEstado)))
          .sort((a, b) => Number(a.cdEstado) - Number(b.cdEstado))
          .map((s) => ({ code: Number(s.cdEstado), label: String(s.dsEstado || "") }));

        if (!apiOptions.length) {
          // Fallback defensivo si la API no responde
          const fallback = [
            { code: 0, label: "Por Aprobar" },
            { code: 1, label: "Aprobado" },
            { code: 2, label: "En venta" },
            { code: 3, label: "Fin Venta" },
            { code: 4, label: "Finalizado" },
            { code: 5, label: "Cancelado" },
            // si tu API maneja "Rechazado" (6), lo podés sumar acá en fallback
          ];
          if (mounted) {
            setOptions([{ code: "all", label: "Todos" }, ...fallback]);
            onStatesLoaded?.(fallback);
          }
          return;
        }

        if (mounted) {
          setOptions([{ code: "all", label: "Todos" }, ...apiOptions]);
          onStatesLoaded?.(apiOptions);
        }
      } catch {
        // mismo fallback si hay error
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
          onStatesLoaded?.(fallback);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [onStatesLoaded]);

  const current = useMemo(
    () => options.find((o) => o.code === value),
    [options, value]
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {options.map((opt) => {
          const isActive = opt.code === value;
          return (
            <TouchableOpacity
              key={String(opt.code)}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onChange(opt.code)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {loading && (
          <View style={[styles.chip, { paddingHorizontal: 10 }]}>
            <ActivityIndicator />
          </View>
        )}
      </ScrollView>

      {!!current && current.code !== "all" && (
        <Text style={styles.helper}>
          Filtrando por: <Text style={{ fontWeight: "700" }}>{current.label}</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 8, paddingTop: 8 },
  scroll: { marginBottom: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: COLORS.textPrimary,
    minHeight: 36,
  },
  chipActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
    shadowColor: COLORS.textPrimary,
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipText: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },
  chipTextActive: {
    color: COLORS.cardBg,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
  },
  helper: {
    marginLeft: 8,
    marginBottom: 4,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption ?? 12,
  },
});
