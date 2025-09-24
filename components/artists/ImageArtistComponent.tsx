import React from "react";
import { Image, StyleSheet, Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;
const IMG_SIZE = screenWidth > 600 ? 250 : 200;

interface Props {
  image: string;
}

const ImageArtistComponent: React.FC<Props> = ({ image }) => (
  <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
);

const styles = StyleSheet.create({
  image: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: IMG_SIZE / 2,
    alignSelf: "center",
    marginBottom: 20,
  },
});

export default ImageArtistComponent;
