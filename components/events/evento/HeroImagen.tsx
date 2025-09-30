import React from "react";
import { TouchableOpacity, Image } from "react-native";
import { styles } from "./styles";

type Props = {
  imageUrl?: string | null;
  onPress?: () => void;
};

export default function HeroImagen({ imageUrl, onPress }: Props) {
  if (!imageUrl || imageUrl.trim() === "") return null;
  return (
    <TouchableOpacity style={styles.heroImageWrapper} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: imageUrl }} style={styles.heroImage} />
    </TouchableOpacity>
  );
}
