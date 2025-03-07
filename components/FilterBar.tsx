// components/owner/FilterBar.tsx
import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface FilterBarProps {
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  orderBy: string;
  onOrderByChange: (value: string) => void;
  searchText: string;
  onSearchTextChange: (value: string) => void;
}

export default function FilterBar({
  filterStatus,
  onFilterStatusChange,
  orderBy,
  onOrderByChange,
  searchText,
  onSearchTextChange,
}: FilterBarProps) {
  return (
    <View style={styles.filterBarContainer}>
      {/* FILTRO DE ESTADO */}
      <View style={styles.filterBlock}>
        <Text style={styles.label}>Mostrar:</Text>
        <TextInput
          style={styles.input}
          value={filterStatus}
          onChangeText={onFilterStatusChange}
          placeholder="todos / vigente / pendiente / finalizado"
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      {/* ORDEN */}
      <View style={styles.filterBlock}>
        <Text style={styles.label}>Ordenar:</Text>
        <TextInput
          style={styles.input}
          value={orderBy}
          onChangeText={onOrderByChange}
          placeholder="asc / desc"
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      {/* BÚSQUEDA */}
      <View style={[styles.filterBlock, { flex: 1 }]}>
        <Text style={styles.label}>Buscar:</Text>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={searchText}
          onChangeText={onSearchTextChange}
          placeholder="Buscar evento"
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBarContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  filterBlock: {
    marginRight: 12,
  },
  label: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 120,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardBg,
  },
});
