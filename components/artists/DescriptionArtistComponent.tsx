import React from "react";
import { Text, StyleSheet } from "react-native";
import { FONTS, FONT_SIZES, COLORS } from "@/styles/globalStyles";

interface Props {
  description: string;
}

const DescriptionArtistComponent: React.FC<Props> = ({ description }) => (
  <Text style={styles.description}>{description}</Text>
);

const styles = StyleSheet.create({
  description: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.body * 1.4,
  },
});

export default DescriptionArtistComponent;
