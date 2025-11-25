// app/party/components/PartyReviewCardComponent.tsx
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { PartyReview } from "../services/usePartyRatings";

type Props = {
  review: PartyReview;
};

function formatDateEsLong(iso: string) {
  try {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, "0");
    const month = d.toLocaleString("es-ES", { month: "long" });
    const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
    const year = d.getFullYear();
    return `${day} ${capMonth} ${year}`;
  } catch {
    return iso;
  }
}

function renderStars(rating: number) {
  const stars: JSX.Element[] = [];
  for (let i = 1; i <= 5; i++) {
    const name =
      rating >= i
        ? "star"
        : rating >= i - 0.5
        ? "star-half-full"
        : "star-outline";
    const color =
      name === "star" || name === "star-half-full"
        ? "#f59e0b"
        : COLORS.textSecondary;

    stars.push(
      <MaterialCommunityIcons
        key={i}
        name={name as any}
        size={16}
        color={color}
      />
    );
  }
  return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
}

export default function PartyReviewCardComponent({ review }: Props) {
  return (
    <View style={styles.reviewCard}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {review.userAvatar && review.userAvatar.trim().length > 0 ? (
            <Image
              source={{ uri: review.userAvatar }}
              style={styles.avatarImg}
              resizeMode="cover"
              accessible
              accessibilityLabel={`Avatar de ${review.userName}`}
            />
          ) : (
            <View style={styles.avatarCircle} />
          )}
          <View>
            <Text style={styles.userName}>{review.userName}</Text>
            <Text style={styles.dateText}>
              {formatDateEsLong(review.dateISO)}
            </Text>
          </View>
        </View>
        {renderStars(review.rating)}
      </View>
      <Text style={styles.commentText}>{review.comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    padding: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.borderInput,
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.borderInput,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
  },
  userName: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.subTitleMedium,
    fontSize: 14,
  },
  dateText: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  commentText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    marginTop: 8,
    lineHeight: 20,
  },
});
