// src/screens/NewsScreens/components/new/NewsHeroComponent.tsx

import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

type Props = {
  title: string;
  imageUrl?: string | null;
  dateLabel?: string;
};

export default function NewsHeroComponent({ title, imageUrl, dateLabel }: Props) {
  return (
    <View>
      {imageUrl ? (
        <Image
          source={getSafeImageSource(imageUrl)}
          style={styles.newsImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.newsImage, styles.noImage]}>
          <Text style={styles.noImageText}>Imagen de la noticia</Text>
        </View>
      )}

      {!!dateLabel && (
        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.metaText}>{dateLabel}</Text>
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  newsImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginBottom: 0,
  },
  noImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.borderInput,
  },
  noImageText: {
    color: COLORS.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  title: {
    marginTop: 8,
    fontSize: 24,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
});
