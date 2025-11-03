// components/tickets/TicketCardComponent.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS, FONTS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";

interface Props {
  item: TicketPurchasedMenuItem;
  onPress: () => void;
}

export default function TicketCardComponent({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Imagen con badge de fecha superpuesto */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{item.date}</Text>
        </View>
        {item.isFinished && (
          <View style={styles.finishedOverlay}>
            <Text style={styles.finishedOverlayText}>FINALIZADO</Text>
          </View>
        )}
      </View>

      {/* Contenido textual debajo de la imagen */}
      <View style={styles.infoContainer}>
        <View style={styles.textRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.eventName}
          </Text>
          <Text style={styles.readMore}>→</Text>
        </View>
        <Text style={styles.subtitle} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    marginVertical: 8,
    overflow: "hidden",
    // Sombra suave
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dateBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateBadgeText: {
    color: "#fff",
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
  },
  finishedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  finishedOverlayText: {
    color: "#fff",
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.subTitle,
  },
  infoContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
  },
  readMore: {
    marginLeft: 8,
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
  },
  subtitle: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
});
