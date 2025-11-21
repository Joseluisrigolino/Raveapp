// src/screens/NewsScreens/components/list/NewsListCardComponent.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { NewsItem } from "@/interfaces/NewsProps";
import { COLORS, FONTS, FONT_SIZES } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/400x200?text=Sin+imagen";

type Props = {
  item: NewsItem;
  onPress: () => void;
};

export default function NewsListCardComponent({ item, onPress }: Props) {
  const dateLabel = item.dtPublicado
    ? new Date(item.dtPublicado).toLocaleDateString()
    : "";

  const excerpt = String(item.contenido || "")
    .replace(/\n+/g, " ")
    .trim();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={getSafeImageSource(item.imagen || PLACEHOLDER_IMAGE)}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.cardContent}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name="clock-time-three-outline"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.metaText}>{dateLabel}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.titulo}
        </Text>

        {!!excerpt && (
          <Text style={styles.excerpt} numberOfLines={2}>
            {excerpt}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.borderInput,
  },
  cardContent: {
    padding: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  excerpt: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
