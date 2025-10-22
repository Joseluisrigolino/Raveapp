import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function ResenasDelEvento() {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Reseñas del evento</Text>
        <View style={styles.avgRow}>
          <View style={styles.starsRowSmall}>
            <MaterialCommunityIcons name="star" size={16} color="#FFCC00" />
            <MaterialCommunityIcons name="star" size={16} color="#FFCC00" />
            <MaterialCommunityIcons name="star" size={16} color="#FFCC00" />
            <MaterialCommunityIcons name="star-half" size={16} color="#FFCC00" />
            <MaterialCommunityIcons name="star-outline" size={16} color="#FFCC00" />
          </View>
          <Text style={styles.avgText}>3.5 (2 reseñas)</Text>
        </View>
      </View>

      <View style={styles.reviewItem}>
        <View style={styles.reviewRow}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={20} color={COLORS.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>Carlos Menem</Text>
              <Text style={styles.timeAgo}>3 días atrás</Text>
            </View>
            <View style={styles.starsRow}>
              <MaterialCommunityIcons name="star" size={18} color="#FFCC00" />
              <MaterialCommunityIcons name="star" size={18} color="#FFCC00" />
              <MaterialCommunityIcons name="star" size={18} color="#FFCC00" />
              <MaterialCommunityIcons name="star" size={18} color="#FFCC00" />
              <MaterialCommunityIcons name="star-outline" size={18} color="#FFCC00" />
            </View>
            <Text style={styles.comment}>Excelente evento, me encantó la música y el ambiente.</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.reviewItem}>
        <View style={styles.reviewRow}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={20} color={COLORS.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>Teté Coustarot</Text>
              <Text style={styles.timeAgo}>5 días atrás</Text>
            </View>
            <View style={styles.starsRow}>
              <MaterialCommunityIcons name="star" size={18} color="#FFCC00" />
              <MaterialCommunityIcons name="star" size={18} color="#FFCC00" />
              <MaterialCommunityIcons name="star" size={18} color="#FFCC00" />
              <MaterialCommunityIcons name="star-outline" size={18} color="#FFCC00" />
              <MaterialCommunityIcons name="star-outline" size={18} color="#FFCC00" />
            </View>
            <Text style={styles.comment}>¡Increíble experiencia! Sin duda volvería a asistir.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 30,
    padding: 14,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    textDecorationLine: "underline",
  },
  avgRow: { alignItems: "flex-end" },
  starsRowSmall: { flexDirection: "row", marginBottom: 2 },
  avgText: { color: COLORS.primary, fontFamily: FONTS.bodyRegular, fontSize: FONT_SIZES.body - 1 },

  reviewItem: { paddingVertical: 8 },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  reviewerName: { fontFamily: FONTS.subTitleMedium, color: COLORS.textPrimary, fontSize: FONT_SIZES.body },
  timeAgo: { color: COLORS.primary, fontSize: FONT_SIZES.body - 2 },
  starsRow: { flexDirection: "row", marginBottom: 8 },
  comment: { color: COLORS.textPrimary, fontFamily: FONTS.bodyRegular, lineHeight: FONT_SIZES.body * 1.4 },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 8 },
});
