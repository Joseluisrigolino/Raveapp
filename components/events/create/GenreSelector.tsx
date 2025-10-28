// components/events/create/GenreSelector.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "@/styles/globalStyles";
import { ApiGenero } from "@/utils/events/eventApi";

interface Props {
  genres: ApiGenero[];
  selectedGenres: number[];
  onToggle: (id: number) => void;
}

export default function GenreSelector({
  genres,
  selectedGenres,
  onToggle,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.genreGrid}>
        {genres.length === 0 ? (
          <Text style={styles.hint}>(Sin géneros disponibles)</Text>
        ) : (
          genres.map((g) => {
            const sel = selectedGenres.includes(g.cdGenero);
            return (
              <TouchableOpacity
                key={g.cdGenero}
                style={[styles.chip, sel && styles.chipOn]}
                onPress={() => onToggle(g.cdGenero)}
              >
                <Text style={[styles.chipText, sel && styles.chipTextOn]}>
                  {g.dsGenero}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.card,
    padding: 14,
    marginBottom: 14,
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 2,
  },
  chip: {
    width: "31%", // 3 columnas aprox.
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    backgroundColor: COLORS.cardBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  chipOn: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  chipText: { color: COLORS.textPrimary, fontWeight: '600', textAlign: 'center' },
  chipTextOn: { color: COLORS.cardBg, fontWeight: '700' },
  hint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
});
