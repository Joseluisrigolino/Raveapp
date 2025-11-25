// app/party/components/PartyRatingsHeaderComponent.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SearchBarComponent from "@/components/common/SearchBarComponent";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { PartyRatingsSortKey } from "../services/usePartyRatings";

type Props = {
  partyName: string;
  search: string;
  onChangeSearch: (value: string) => void;
  sort: PartyRatingsSortKey;
  onToggleSort: () => void;
};

function sortLabel(sort: PartyRatingsSortKey) {
  if (sort === "best") return "Mejor puntuación";
  if (sort === "worst") return "Peor puntuación";
  return "Más recientes";
}

export default function PartyRatingsHeaderComponent({
  partyName,
  search,
  onChangeSearch,
  sort,
  onToggleSort,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reseñas - {partyName || "Fiesta"}</Text>

      <SearchBarComponent
        value={search}
        onChangeText={onChangeSearch}
        placeholder="Buscar reseñas..."
      />

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Ordenar por:</Text>
        <TouchableOpacity
          style={styles.sortPicker}
          onPress={onToggleSort}
          activeOpacity={0.8}
        >
          <Text style={styles.sortPickerText}>{sortLabel(sort)}</Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={18}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  title: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    textAlign: "left",
    marginBottom: 10,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 8,
  },
  sortLabel: { color: COLORS.textSecondary },
  sortPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.cardBg,
  },
  sortPickerText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodyRegular,
  },
});
