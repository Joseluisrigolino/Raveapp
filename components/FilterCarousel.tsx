import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text } from "react-native-paper";

const FilterCarousel = ({ filtros }: { filtros: string[] }) => {
  // Defino un componente FilterCarousel que recibe un prop llamado "filtros", que es un array de cadenas (strings).
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
    >
      {filtros.map(
        (
          filtro,
          index // Utilizo el método "map" para recorrer el array "filtros" y renderizar cada elemento.
        ) => (
          <View key={index} style={styles.filterItem}>
            {/* "key={index}" asegura que cada item tenga una clave única para el renderizado eficiente en React.*/}
            <Text style={styles.filterText}>{filtro}</Text>
            {/* "Text" es el componente que renderiza el texto de cada filtro.
              - "{filtro}" es el valor del filtro que será mostrado en pantalla.
          */}
          </View>
        )
      )}
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
