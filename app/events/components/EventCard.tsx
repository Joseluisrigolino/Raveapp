import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";
import { fetchGenres, ApiGenero } from "@/app/events/apis/eventApi";
import { EventItemWithExtras } from "@/app/events/apis/eventApi";

export type EventCardProps = {
  event: EventItemWithExtras;
  onPress?: () => void;
  onToggleLike?: () => void;
  isLiked?: boolean;
  disableFavorite?: boolean;
  hideFavorite?: boolean;
};

export default function EventCard({
  event,
  onPress,
  onToggleLike,
  isLiked = false,
  disableFavorite = false,
  hideFavorite = false,
}: EventCardProps) {
  const [genreNames, setGenreNames] = useState<string[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingGenres(true);
        const list = await fetchGenres();
        if (!mounted) return;
        const map = new Map(list.map((g: ApiGenero) => [g.cdGenero, g.dsGenero]));
        const codes: number[] = Array.isArray(event.genero) ? event.genero.map(Number) : [];
        const names = codes
          .map((c) => map.get(c) || String(c))
          .filter(Boolean)
          .slice(0, 4);
        setGenreNames(names);
      } catch {
        setGenreNames([]);
      } finally {
        setLoadingGenres(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [event.genero]);

  const flags = {
    isAfter: Boolean((event as any).isAfter),
    isLGBT: Boolean((event as any).isLGBT),
  };

  const handleHeartPress = (e: any) => {
    e?.stopPropagation?.();
    if (!disableFavorite && onToggleLike) onToggleLike();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageArea}>
        <Image
          source={getSafeImageSource(event.imageUrl)}
          style={styles.image}
        />

        {!hideFavorite && (
          <TouchableOpacity
            onPress={handleHeartPress}
            disabled={disableFavorite || !onToggleLike}
            style={styles.heartChip}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={COLORS.negative}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoArea}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        <Text style={styles.date} numberOfLines={1}>
          {event.date}
        </Text>

        <View style={styles.tagsRow}>
          {loadingGenres ? (
            <ActivityIndicator size="small" color={COLORS.textSecondary} />
          ) : (
            genreNames.map((g) => (
              <View key={g} style={styles.genreChip}>
                <Text style={styles.genreText} numberOfLines={1}>
                  {g}
                </Text>
              </View>
            ))
          )}

          {flags.isLGBT && (
            <LinearGradient
              colors={["#1f8e3a", "#f4c400", "#ff2d6f", "#7b1fa2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.genreChip, styles.lgbtGradient]}
            >
              <Text style={[styles.genreText, styles.lgbtText]}>LGTB</Text>
            </LinearGradient>
          )}

          {flags.isAfter && (
            <View style={[styles.genreChip, styles.afterChip]}>
              <Text style={[styles.genreText, styles.afterText]}>AFTER</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 448 / 320,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    marginVertical: 8,
  },
  imageArea: {
    flex: 0.62,
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heartChip: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoArea: {
    flex: 0.38,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: 16,
  },
  date: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  tagsRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  genreChip: {
    backgroundColor: "#111111",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  genreText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  lgbtChip: {
    backgroundColor: "#28a745",
  },
  lgbtText: {
    color: "#FFFFFF",
  },
  afterChip: {
    backgroundColor: "#9F2B60",
  },
  afterText: {
    color: "#FFFFFF",
  },
  lgbtGradient: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
});
