// components/CardComponent.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface CardProps {
  title: string;
  text: string;
  foto: string;
  date: string;
  onPress?: () => void;

  // Favoritos
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  disableFavorite?: boolean;
}

export default function CardComponent({
  title,
  text,
  foto,
  date,
  onPress,
  isFavorite = false,
  onToggleFavorite,
  disableFavorite = false,
}: CardProps) {
  const handleHeartPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (!disableFavorite && onToggleFavorite) onToggleFavorite();
  };

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: foto }} style={styles.image} />

        {/* Fecha */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{date}</Text>
        </View>

        {/* Corazón sin fondo: outline rojo si no está marcado, sólido rojo si marcado */}
        <TouchableOpacity
          onPress={handleHeartPress}
          disabled={disableFavorite || !onToggleFavorite}
          style={styles.heartBtn}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isFavorite ? "heart" : "heart-outline"}
            size={28}
            color={COLORS.negative} // siempre rojo; cambia el ícono (relleno vs contorno)
          />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.eventSubtitle} numberOfLines={2}>
          {text}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: COLORS.backgroundLight,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dateBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#000",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    // sin fondo ni borde: el “borde” lo da el ícono outline rojo
    // se deja sólo el ícono para el look “limpio”
  },
  infoContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.subTitle,
    marginBottom: 4,
  },
  eventSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
  },
});
