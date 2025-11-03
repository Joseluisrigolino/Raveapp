import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ReviewItem } from "@/app/reviews/types/ReviewProps";

// Importa estilos globales
import globalStyles, { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

interface ReviewComponentProps {
  reviews: ReviewItem[];
}

export default function ReviewComponent({ reviews }: ReviewComponentProps) {
  const totalRatings = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = reviews.length > 0 ? totalRatings / reviews.length : 0;

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name="star"
          size={16}
          color={i <= rating ? COLORS.starFilled : COLORS.starEmpty}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Reseñas del evento</Text>
      <View style={styles.headerRow}>
        <Text style={styles.averageRating}>{avgRating.toFixed(1)}</Text>
        {renderStars(Math.round(avgRating))}
        <Text style={styles.opinionsCount}>
          {reviews.length} {reviews.length === 1 ? "opinión" : "opiniones"}
        </Text>
      </View>

      {reviews.length === 0 ? (
        <Text style={styles.noReviews}>No hay reseñas todavía</Text>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.user}>{review.user}</Text>
              {renderStars(review.rating)}
              <Text style={styles.daysAgo}>Hace {review.daysAgo} días</Text>
            </View>
            <Text style={styles.comment}>{review.comment}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: FONT_SIZES.subTitle, // 18-20
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  averageRating: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    marginRight: 4,
    color: COLORS.textPrimary,
  },
  starsRow: {
    flexDirection: "row",
    marginRight: 8,
  },
  opinionsCount: {
    fontSize: FONT_SIZES.smallText, // 14
    color: COLORS.textSecondary,
  },
  noReviews: {
    fontStyle: "italic",
    color: COLORS.textSecondary,
  },
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderInput, // "#eee"
    paddingTop: 8,
    marginTop: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  user: {
    fontWeight: "bold",
    marginRight: 8,
    color: COLORS.textPrimary,
  },
  daysAgo: {
    marginLeft: "auto",
    fontSize: FONT_SIZES.smallText,
    color: COLORS.textSecondary,
  },
  comment: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
});
