import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { styles } from "./styles";

type Props = {
  title: string;
  isFavorite: boolean;
  favBusy?: boolean;
  onToggleFavorite: () => void;
  showFavorite?: boolean;
  dateText?: string;
};

export default function TituloEvento({ title, isFavorite, favBusy, onToggleFavorite, showFavorite = true, dateText }: Props) {
  return (
    <TouchableOpacity style={styles.titleRow} activeOpacity={0.8} onPress={() => console.log("Título presionado") }>
      <View style={styles.titleCol}>
        <Text style={styles.title}>{title}</Text>
        {!!dateText && <Text style={styles.dateUnderTitle}>{dateText}</Text>}
      </View>
      {showFavorite && (
        <TouchableOpacity onPress={onToggleFavorite} disabled={favBusy} style={styles.heartBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }} activeOpacity={0.7}>
          <MaterialCommunityIcons name={isFavorite ? "heart" : "heart-outline"} size={28} color="#E53935" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
