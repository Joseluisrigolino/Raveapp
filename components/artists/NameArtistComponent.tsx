import React from "react";
import { Text, StyleSheet } from "react-native";
import { FONTS, FONT_SIZES, COLORS } from "@/styles/globalStyles";

interface Props {
  name: string;
}

const NameArtistComponent: React.FC<Props> = ({ name }) => (
  <Text style={styles.title}>{name}</Text>
);

const styles = StyleSheet.create({
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textDecorationLine: "underline",
  },
});

export default NameArtistComponent;
