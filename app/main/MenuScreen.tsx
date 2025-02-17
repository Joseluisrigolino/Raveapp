import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import CardComponent from "@/components/CardComponent";
import FilterCarousel from "@/components/FilterCarousel";

export default function MenuScreen() {
  // Tipos de fiesta que se mostrarán en el carrusel
  const fiestaTipos = ["Rave", "Techno", "House", "LGBT", "Pop", "Electrónica"];

  return (
    <ScrollView style={styles.mainContainer}>
      <FilterCarousel filtros={fiestaTipos} />

      <View style={styles.container}>
        <CardComponent
          title="Fiesta en casa"
          text="Preparense para una fiesta divertida en casa"
          foto="https://picsum.photos/700"
        />
        <CardComponent
          title="Fiesta en casa"
          text="Preparense para una fiesta divertida en casa"
          foto="https://picsum.photos/701"
        />
        <CardComponent
          title="Fiesta en casa"
          text="Preparense para una fiesta divertida en casa"
          foto="https://picsum.photos/702"
        />
        <CardComponent
          title="Fiesta en casa"
          text="Preparense para una fiesta divertida en casa"
          foto="https://picsum.photos/703"
        />
        <CardComponent
          title="Fiesta en casa"
          text="Preparense para una fiesta divertida en casa"
          foto="https://picsum.photos/704"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    marginTop: 10,
  },
});
