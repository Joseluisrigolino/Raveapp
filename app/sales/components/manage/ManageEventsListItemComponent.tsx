import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { EventItemWithExtras } from "@/app/events/apis/eventApi";
import { COLORS, RADIUS } from "@/styles/globalStyles";
import { getSafeImageSource } from "@/utils/image";

type Props = {
  event: EventItemWithExtras;
  onPress: () => void;
};

export default function ManageEventsListItemComponent({ event, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.row}>
        {event.imageUrl ? (
          <Image
            source={getSafeImageSource(event.imageUrl)}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle}>{event.title}</Text>
          <Text style={styles.cardMeta}>{event.type}</Text>
          <Text style={styles.cardMeta}>
            {event.date}
            {event.timeRange ? `  •  ${event.timeRange}` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.reportBtn} onPress={onPress}>
          <Text style={styles.reportText}>Ver Reporte →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: RADIUS.card,
    padding: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  row: { flexDirection: "row", alignItems: "center" },
  image: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.cardBg,
  },
  imageFallback: { backgroundColor: COLORS.borderInput },
  cardTitle: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  cardMeta: { color: COLORS.textSecondary, marginTop: 2 },
  cardFooter: { marginTop: 10, alignItems: "flex-end" },
  reportBtn: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reportText: { color: "#fff", fontWeight: "700" },
});
