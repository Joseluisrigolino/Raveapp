import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native";
import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import { Button, Text, Title } from "react-native-paper";
import BuyTicket from "@/components/BuyTicketsComponent";

export default function EventScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: "https://picsum.photos/700" }}
          style={styles.img}
        />
        <Title style={styles.title}>Fiesta 1</Title>
        <View style={styles.info}>
        <Button  icon="calendar">
          <Text>18/06/2025 de 10hs a 15hs</Text>
        </Button>
        <Button icon="map-marker" onPress={() => console.log("Buscar en mapa")}>
          <Text>Cochabamba 1356, San Isidro</Text>
        </Button>
        <Text style={styles.description}>Lorem ipsum dolor sit amet consectetur adipiscing elit sem, venenatis pretium ante malesuada mollis mattis sociis ac blandit, justo nostra auctor tincidunt ullamcorper feugiat praesent. Tortor hendrerit leo nullam blandit nostra consequat lacinia auctor, sapien sociosqu torquent dictum laoreet integer per magnis, convallis non ridiculus dignissim sagittis ante augue. Non cursus iaculis erat maecenas vehicula himenaeos, tincidunt dis imperdiet habitant sapien cubilia at, scelerisque hac sollicitudin tristique metus.</Text>
        </View>
        <BuyTicket></BuyTicket>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  img: {
    width: "100%",
    height: 300,
    alignSelf: "flex-start",
  },
  title: {
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginLeft: 8,
  },
  info: {
    alignItems: "flex-start",
  },
  description: {
    margin: 10,
    fontSize: 17,
  },
});
