// src/screens/NewsScreens/components/new/NewsRelatedEventCardComponent.tsx

import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

type Props = {
  eventId?: string | null;
  title?: string | null;
  imageUrl?: string | null;
  onPress?: () => void;
};

export default function NewsRelatedEventCardComponent({
  eventId,
  title,
  imageUrl,
  onPress,
}: Props) {
  if (!eventId) return null;

  return (
    <View style={styles.relatedCard}>
      <View style={styles.relatedHeader}>
        {imageUrl ? (
          <Image
            source={getSafeImageSource(imageUrl)}
            style={styles.relatedThumb}
          />
        ) : (
          <View style={styles.relatedIconWrap}>
            <MaterialCommunityIcons
              name="calendar-blank"
              size={20}
              color={COLORS.textPrimary}
            />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.relatedTitle}>Evento relacionado</Text>
          <Text style={styles.relatedSubtitle} numberOfLines={2}>
            {title || "Ver evento"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.relatedBtn}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Text style={styles.relatedBtnText}>Ver evento completo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  relatedCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  relatedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  relatedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.borderInput,
  },
  relatedTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  relatedSubtitle: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  relatedBtn: {
    backgroundColor: "#0F172A",
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedBtnText: {
    color: COLORS.backgroundLight,
    fontWeight: "600",
  },
});
