import React, { useState } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView, Text } from "react-native";
import { IconButton } from "react-native-paper";
import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import FilterCarousel from "@/components/FilterCarousel";
import CardComponent from "@/components/CardComponent";

export default function FavEventScreen() {
  const fiestaTipos = ["Rave", "Techno", "House", "LGBT", "Pop", "Electrónica"];
  const [favorites, setFavorites] = useState(
    Array(5)
      .fill(true)
      .map((_, index) => ({
        id: index,
        title: `Fiesta ${index + 1}`,
        text: "Diviértete con amigos",
        foto: `https://picsum.photos/70${index}`,
      }))
  );

  const handleFilterPress = (filtro = "") => {
    console.log("Filtro seleccionado:", filtro);
  };

  const handleCardPress = (title = "") => {
    console.log("Card seleccionada:", title);
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => prev.filter((event) => event.id !== id));
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header />
      <Text style={styles.screenTitle}>Eventos favoritos</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <FilterCarousel
          filtros={fiestaTipos}
          onFilterPress={handleFilterPress}
        />

        <View style={styles.containerCards}>
          {favorites.length > 0 ? (
            favorites.map((event) => (
              <View key={event.id} style={styles.cardContainer}>
                <CardComponent
                  title={event.title}
                  text={event.text}
                  foto={event.foto}
                  onPress={handleCardPress}
                />
                <IconButton
                  icon="heart"
                  iconColor="red"
                  size={30}
                  style={styles.heartButton}
                  onPress={() => toggleFavorite(event.id)}
                />
              </View>
            ))
          ) : (
            <Text style={styles.noFavoritesText}>
              No tiene ningún evento guardado en favorito
            </Text>
          )}
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
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  containerCards: {
    flex: 1,
    marginTop: 10,
    alignItems: "center",
  },
  cardContainer: {
    position: "relative",
    width: "100%",
    marginBottom: 20,
  },
  heartButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 20,
  },
  noFavoritesText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
    color: "gray",
  },
});
