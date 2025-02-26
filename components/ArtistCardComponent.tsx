// components/ArtistCard.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { ArtistCardProps } from "../interfaces/ArtistCardProps";

const ArtistCard: React.FC<ArtistCardProps> = ({ artistName, artistImage }) => {
  return (
    <View style={styles.cardContainer}>
      <Image source={{ uri: artistImage }} style={styles.artistImage} />
      <Text style={styles.artistName}>{artistName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '30%',
    margin: 5,
    alignItems: 'center',
  },
  artistImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'black',
  },
  artistName: {
    textAlign: 'center',
    marginTop: 5,
  },
});

export default ArtistCard;
