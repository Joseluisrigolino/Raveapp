import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";

import globalStyles from "@/styles/globalStyles";

interface FilterCarouselProps {
  filtros: string[];
  onFilterPress: (filtro: string) => void;
  selectedFilter: string;
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
    backgroundColor: globalStyles.COLORS.secondary, // Negro (#121212)
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  filterText: {
    color: globalStyles.COLORS.cardBg, // Blanco (#FFFFFF)
    fontFamily: globalStyles.FONTS.titleBold, // Por ejemplo
    fontSize: globalStyles.FONT_SIZES.button,  // 16
    fontWeight: "bold",
  },
  // Estilo cuando está activo
  activeFilterItem: {
    backgroundColor: globalStyles.COLORS.cardBg,    // Blanco (#FFFFFF)
    borderWidth: 2,
    borderColor: globalStyles.COLORS.textPrimary,   // Gris oscuro
  },
  activeFilterText: {
    color: globalStyles.COLORS.textPrimary, // Gris oscuro
  },
});

export default FilterCarousel;
