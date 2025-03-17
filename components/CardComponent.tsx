// components/CardComponent.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface CardProps {
  title: string;
  text: string;
  foto: string;
  date: string;
  onPress?: () => void;
}

export default function CardComponent({
  title,
  text,
  foto,
  date,
  onPress,
}: CardProps) {
  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: foto }} style={styles.image} />
        {/* Badge de fecha en la esquina inferior izquierda */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{date}</Text>
        </View>
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
    // Sombra suave:
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // para Android
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 200,
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
  infoContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
    fontSize: FONT_SIZES.body,
    marginBottom: 4,
  },
  eventSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
  },
});
