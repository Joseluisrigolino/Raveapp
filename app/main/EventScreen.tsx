import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Linking,
} from "react-native";
import Header from "@/components/HeaderComponent";
import Footer from "@/components/FooterComponent";
import { Button, Text, Title } from "react-native-paper";
import BuyTicket from "@/components/BuyTicketsComponent";

const openMap = () => {
  const address = encodeURIComponent("tandil 4341, Villa Ballester");
  const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
  Linking.openURL(url);
};

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
          <Button icon="calendar">
            <Text>18/06/2025 de 10hs a 15hs</Text>
          </Button>
          <Button
            icon="map-marker"
            onPress={openMap}
          >
            <Text style={{ color: "blue", textDecorationLine: "underline" }}>Tandil 4341, Villa Ballester</Text>
          </Button>
          <Text style={styles.description}>
            Lorem ipsum dolor sit amet consectetur adipiscing elit sem,
            venenatis pretium ante malesuada mollis mattis sociis ac blandit,
            justo nostra auctor tincidunt ullamcorper feugiat praesent. Tortor
            hendrerit leo nullam blandit nostra consequat lacinia auctor, sapien
            sociosqu torquent dictum laoreet integer per magnis, convallis non
            ridiculus dignissim sagittis ante augue. Non cursus iaculis erat
            maecenas vehicula himenaeos, tincidunt dis imperdiet habitant sapien
            cubilia at, scelerisque hac sollicitudin tristique metus.
          </Text>
        </View>
        <BuyTicket></BuyTicket>
        <View style={styles.btnBuyView}>
          <TouchableOpacity style={styles.btnBuy}>
            <Text style={styles.btnBuyTxt}>Comprar</Text>
          </TouchableOpacity>
        </View>
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
    marginRight: 20
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
