// components/FilterBar.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface FilterBarProps {
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  // Opcionales
  orderBy?: string; // "asc" | "desc"
  onOrderByChange?: (value: string) => void;
  showOrder?: boolean; // por defecto true
  statusOptions?: string[]; // por defecto ["todos","vigente","pendiente","finalizado"]
  searchPlaceholder?: string;
}

/**
 * Filtro manual (sin Picker):
 * - Botón "Estado: X" => despliega lista con "todos", "vigente", "pendiente", "finalizado"
 * - Botón "Orden: Y" => despliega lista con "asc", "desc"
 * - Input para búsqueda
 */
export default function FilterBar({
  filterStatus,
  onFilterStatusChange,
  searchText,
  onSearchTextChange,
  orderBy = "asc",
  onOrderByChange,
  showOrder = true,
  statusOptions,
  searchPlaceholder,
}: FilterBarProps) {
  // Controla si se ve la lista de estados
  const [showStatusList, setShowStatusList] = useState(false);
  // Controla si se ve la lista de orden
  const [showOrderList, setShowOrderList] = useState(false);

  // Opciones de estado
  const internalStatusOptions = statusOptions && statusOptions.length
    ? statusOptions
    : ["todos", "vigente", "pendiente", "finalizado"];
  // Opciones de orden
  const orderOptions = ["asc", "desc"];

  // Manejo de pulsar estado
  const handleStatusSelect = (status: string) => {
    onFilterStatusChange(status);
    setShowStatusList(false);
  };

  // Manejo de pulsar orden
  const handleOrderSelect = (ord: string) => {
    onOrderByChange?.(ord);
    setShowOrderList(false);
  };

  return (
    <View style={styles.container}>
      {/* FILTRO DE ESTADO */}
      <Text style={styles.label}>Estado:</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowStatusList(!showStatusList)}
      >
        <Text>{filterStatus || "Seleccionar estado"}</Text>
      </TouchableOpacity>

      {showStatusList && (
        <View style={styles.dropdownContainer}>
          {internalStatusOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.dropdownItem}
              onPress={() => handleStatusSelect(opt)}
            >
              <Text>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* FILTRO DE ORDEN */}
      {showOrder ? (
        <>
          <Text style={[styles.label, { marginTop: 12 }]}>Orden:</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowOrderList(!showOrderList)}
          >
            <Text>{orderBy === "asc" ? "asc" : "desc"}</Text>
          </TouchableOpacity>

          {showOrderList && (
            <View style={styles.dropdownContainer}>
              {orderOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.dropdownItem}
                  onPress={() => handleOrderSelect(opt)}
                >
                  <Text>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      ) : null}

      {/* BÚSQUEDA POR TEXTO */}
      <Text style={[styles.label, { marginTop: 12 }]}>Buscar evento:</Text>
      <TextInput
        style={styles.searchInput}
        placeholder={searchPlaceholder || "Escribe nombre de evento..."}
        placeholderTextColor={COLORS.textSecondary}
        value={searchText}
        onChangeText={onSearchTextChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    padding: 8,
  },
  label: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: COLORS.cardBg,
    marginBottom: 4,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    marginBottom: 4,
  },
  dropdownItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardBg,
  },
});
