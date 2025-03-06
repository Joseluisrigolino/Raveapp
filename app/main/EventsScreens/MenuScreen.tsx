import React from "react";
import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import FilterCarousel from "@/components/FilterCarousel";
import CardComponent from "@/components/CardComponent";

export default function MenuScreen() {
  const fiestaTipos = ["Rave", "Techno", "House", "LGBT", "Pop", "Electrónica"];

  const handleFilterPress = (filtro = "") => {
    console.log("Filtro seleccionado:", filtro);
  };

  const handleCardPress = (title = "") => {
    console.log("Card seleccionada:", title);
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        <FilterCarousel
          filtros={fiestaTipos}
          onFilterPress={handleFilterPress}
        />

        <View style={styles.containerCards}>
          {[...Array(5)].map((_, index) => (
            <CardComponent
              key={index}
              title={`Fiesta ${index + 1}`}
              text="Diviértete con amigos"
              foto={`https://picsum.photos/70${index}`}
              onPress={handleCardPress}
            />
          ))}
        </View>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  containerCards: {
    flex: 1,
    marginTop: 10,
  },
});
