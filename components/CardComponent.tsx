import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Paragraph, TouchableRipple } from "react-native-paper";
import TitlePers from "./TitleComponent";

const CardComponent = ({ title = "", text = "", foto = "", onPress }) => (
  <TouchableRipple onPress={() => onPress(title)} borderless>
    <Card style={styles.card}>
      <Card.Content>
        <TitlePers text={title} />
        <Paragraph>{text}</Paragraph>
      </Card.Content>
      <Card.Cover source={{ uri: foto }} style={styles.cardCover} />
    </Card>
  </TouchableRipple>
);

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    width: "100%", // Ocupa todo el ancho disponible
  },
  cardCover: {
    width: "100%", // Imagen ocupa todo el ancho de la tarjeta
    height: 200,
    resizeMode: "cover",
  },
});

export default CardComponent;
