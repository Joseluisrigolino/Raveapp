import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Paragraph, TouchableRipple } from "react-native-paper";
import TitlePers from "./TitleComponent";

const CardComponent = ({ title = "", text = "", foto = "", onPress }) => (
  <View style={styles.container}>
    <TouchableRipple onPress={() => onPress(title)} borderless>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <TitlePers text={title} />
          <Paragraph>{text}</Paragraph>
        </Card.Content>
        {/* Aseguramos que la imagen ocupe el ancho completo */}
        <Card.Cover source={{ uri: foto }} style={styles.cardCover} />
      </Card>
    </TouchableRipple>
  </View>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  card: {
    marginTop: 10,
    marginBottom: 15,
    width: "100%", // Asegura que la tarjeta ocupe todo el ancho disponible
  },
  cardContent: {
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 15,
    width: "100%",
  },
  cardCover: {
    width: "100%", // Hace que la imagen ocupe todo el ancho de la tarjeta
    height: 200, // Ajusta la altura a tu preferencia
    resizeMode: "cover", // Asegura que la imagen se expanda correctamente
  },
});

export default CardComponent;
