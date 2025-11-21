// app/party/components/PartyListItemComponent.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Party } from "@/app/party/apis/partysApi";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

type Props = {
  party: Party;
  onEdit: (party: Party) => void;
  onDelete: (party: Party) => void;
  onOpenRatings: (party: Party) => void;
};

function formatRating(avg?: number | null, count?: number | null) {
  if (avg != null && count != null && count > 0) {
    return `${avg.toFixed(1)} (${count} reseñas)`;
  }
  return "Sin calificaciones aún";
}

export default function PartyListItemComponent({
  party,
  onEdit,
  onDelete,
  onOpenRatings,
}: Props) {
  return (
    <View style={styles.listRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.partyName} numberOfLines={1}>
          {party.nombre || "(sin nombre)"}
        </Text>

        <TouchableOpacity
          onPress={() => onOpenRatings(party)}
          style={styles.ratingRow}
        >
          <MaterialCommunityIcons name="star" size={14} color="#fbbf24" />
          <Text style={styles.ratingText}>
            {formatRating(party.ratingAvg, party.reviewsCount)}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onEdit(party)}
          style={styles.iconBtn}
        >
          <MaterialCommunityIcons
            name="square-edit-outline"
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onDelete(party)}
          style={styles.iconBtn}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderInput,
  },
  partyName: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  ratingText: { color: COLORS.textSecondary, marginLeft: 8 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { padding: 8, borderRadius: RADIUS.card },
});
