import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";

const FilterCarousel = ({ filtros, onFilterPress }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
    >
      {filtros.map((filtro = "", index = "") => (
        <TouchableRipple
          key={index}
          onPress={() => onFilterPress(filtro)}
          style={styles.filterItem}
        >
          <Text style={styles.filterText}>{filtro}</Text>
        </TouchableRipple>
      ))}
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
    backgroundColor: "#000000",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  filterText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default FilterCarousel;
