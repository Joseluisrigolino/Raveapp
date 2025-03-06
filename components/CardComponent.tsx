import * as React from "react";
import { StyleSheet } from "react-native";
import { Card, Paragraph, TouchableRipple } from "react-native-paper";
import TitlePers from "./TitleComponent";

// Importa tus estilos
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

const CardComponent = ({
  title = "",
  text = "",
  foto = "",
  onPress = () => {},
}) => (
  <TouchableRipple onPress={() => onPress()} borderless>
    <Card style={styles.card}>
      <Card.Content>
        <TitlePers text={title} />
        <Paragraph style={styles.paragraph}>{text}</Paragraph>
      </Card.Content>
      <Card.Cover source={{ uri: foto }} style={styles.cardCover} />
    </Card>
  </TouchableRipple>
);

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    overflow: "hidden",
  },
  paragraph: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
  },
  cardCover: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
});

export default CardComponent;
