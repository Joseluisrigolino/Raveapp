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
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  hideFavorite?: boolean; // si true, no renderiza el corazón
  // Badge de estado opcional (para tickets comprados, etc.)
  badgeLabel?: string;
  badgeColor?: string; // fondo del badge
  badgeTextColor?: string; // color del texto
  // Zona opcional para acciones/controles dentro de la card (debajo de la fecha)
  footer?: React.ReactNode;
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
  hideFavorite = false,
  badgeLabel,
  badgeColor = COLORS.primary,
  badgeTextColor = '#FFFFFF',
  footer,
}: CardProps) {
  const handleHeartPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (!disableFavorite && onToggleFavorite) onToggleFavorite();
  };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrapper}>
        <Image source={getSafeImageSource(foto)} style={styles.image} />

        {/* Corazón dentro de chip circular blanco (oculto si hideFavorite) */}
        {!hideFavorite && (
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
        )}
        {badgeLabel ? (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}> 
            <Text style={[styles.badgeText, { color: badgeTextColor }]} numberOfLines={1}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.eventTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.eventSubtitle} numberOfLines={2}>{text}</Text>

        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>{date}</Text>
        </View>

        {footer ? <View style={styles.footerWrap}>{footer}</View> : null}
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
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    maxWidth: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: 12,
    letterSpacing: 0.3,
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
  footerWrap: {
    marginTop: 10,
  },
});
