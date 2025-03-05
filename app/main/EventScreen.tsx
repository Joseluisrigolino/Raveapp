import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Button, Text, Title, IconButton } from "react-native-paper";
import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import BuyTicket from "@/components/BuyTicketsComponent";
import SoundCloud from "@/components/SoundCloudComponent";

// NUEVO: importamos ReviewComponent
import ReviewComponent from "@/components/ReviewComponent";
import { ReviewItem } from "@/interfaces/ReviewProps";

// Ejemplo de reseñas
const mockReviews: ReviewItem[] = [
  {
    id: 1,
    user: "Usuario99",
    comment: "Me gustó mucho la fiesta. Gente muy agradable. Volvería a ir.",
    rating: 5,
    daysAgo: 6,
  },
  {
    id: 2,
    user: "Usuario27",
    comment:
      "Me gustó mucho la fiesta. La única crítica es que esperé 15 minutos en la fila para ingresar.",
    rating: 4,
    daysAgo: 6,
  },
];

const openMap = () => {
  const address = encodeURIComponent("tandil 4341, villa ballester");
  const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
  Linking.openURL(url);
};

export default function EventScreen() {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "https://picsum.photos/700" }}
            style={styles.img}
          />
          {/* Botón de corazón en la esquina inferior derecha de la imagen */}
          <IconButton
            icon={isFavorite ? "heart" : "heart-outline"}
            iconColor={isFavorite ? "red" : "black"}
            size={30}
            style={styles.heartButton}
            onPress={() => setIsFavorite(!isFavorite)}
          />
        </View>

        <Title style={styles.title}>Fiesta 1</Title>
        <View style={styles.info}>
          <Button icon="calendar">
            <Text>18/06/2025 de 10hs a 15hs</Text>
          </Button>
          <Button icon="map-marker" onPress={openMap}>
            <Text style={{ color: "blue", textDecorationLine: "underline" }}>
              Tandil 4341, Villa Ballester
            </Text>
          </Button>
          <Text style={styles.description}>
            Lorem ipsum dolor sit amet consectetur adipiscing elit sem,
            venenatis pretium ante malesuada mollis mattis sociis ac blandit,
            justo nostra auctor tincidunt ullamcorper feugiat praesent...
          </Text>
        </View>
        <BuyTicket />
        <View style={styles.btnBuyView}>
          <TouchableOpacity style={styles.btnBuy}>
            <Text style={styles.btnBuyTxt}>Comprar</Text>
          </TouchableOpacity>
        </View>
        {/* <SoundCloud trackUrl="https://soundcloud.com/skrillex/sets/skrillex-remixes" /> */}

        {/* NUEVO: Sección de reseñas con la nueva UI */}
        <ReviewComponent reviews={mockReviews} />
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
  },
  img: {
    width: "100%",
    height: 300,
    alignSelf: "flex-start",
  },
  heartButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 20,
  },
  title: {
    fontWeight: "bold",
    marginLeft: 8,
  },
  info: {
    alignItems: "flex-start",
  },
  description: {
    margin: 10,
    fontSize: 17,
  },
  btnBuyView: {
    alignItems: "flex-end",
    marginRight: 20,
  },
  btnBuy: {
    backgroundColor: "#000000",
    height: 50,
    width: 150,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  btnBuyTxt: {
    color: "white",
    fontSize: 20,
  },
});
