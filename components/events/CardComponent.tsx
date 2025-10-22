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
import { getSafeImageSource } from "@/utils/image";

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
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrapper}>
        <Image source={getSafeImageSource(foto)} style={styles.image} />

        {/* Corazón dentro de chip circular blanco */}
        <TouchableOpacity
          onPress={handleHeartPress}
          disabled={disableFavorite || !onToggleFavorite}
          style={styles.heartChip}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={COLORS.negative}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.eventTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.eventSubtitle} numberOfLines={2}>{text}</Text>

        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>{date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 170,
    backgroundColor: COLORS.cardBg,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heartChip: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  infoContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: 16,
    marginBottom: 6,
  },
  eventSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
