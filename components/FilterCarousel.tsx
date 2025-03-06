import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";

interface FilterCarouselProps {
  filtros: string[];
  onFilterPress: (filtro: string) => void;
  selectedFilter: string; // <-- NUEVO
}

const FilterCarousel = ({ filtros, onFilterPress, selectedFilter }: FilterCarouselProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
    >
      {filtros.map((filtro, index) => {
        const isActive = (filtro === selectedFilter);

        return (
          <TouchableRipple
            key={index}
            onPress={() => onFilterPress(filtro)}
            style={[styles.filterItem, isActive && styles.activeFilterItem]}
          >
            <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
              {filtro}
            </Text>
          </TouchableRipple>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  carousel: {
    marginTop: 20,
    marginBottom: 15,
    paddingLeft: 10,
  },
  filterItem: {
    marginRight: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#000",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  filterText: {
    color: "white",
    fontWeight: "bold",
  },
  // Estilo cuando está activo
  activeFilterItem: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
  },
  activeFilterText: {
    color: "#000",
  },
});

export default FilterCarousel;
