import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import CardComponent from "@/app/events/components/CardComponent";
import { TicketPurchasedMenuItem } from "@/interfaces/TicketPurchasedMenuItem";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

// Meta visual de estados de ENTRADAS (badge)
const ESTADO_ENTRADA_META: Record<
  number,
  { label: string; short?: string; bg: string; color: string }
> = {
  2: { label: "Pagada", short: "Pagada", bg: "#D926AA", color: "#FFFFFF" },
  3: { label: "Asignada", short: "Asignada", bg: "#673AB7", color: "#FFFFFF" },
  4: { label: "Controlada", short: "Controlada", bg: "#2E7D32", color: "#FFFFFF" },
  5: { label: "Cancelada", short: "Cancelada", bg: "#B00020", color: "#FFFFFF" },
  6: { label: "Transferida", short: "Transferida", bg: "#0277BD", color: "#FFFFFF" },
};

type Props = {
  loading: boolean;
  error: string | null;
  tickets: TicketPurchasedMenuItem[];
  userReviewsSet: Set<string>;
  onPressTicket: (item: TicketPurchasedMenuItem) => void;
  onPressReview: (item: TicketPurchasedMenuItem) => void;
};

const TicketsPurchasedList: React.FC<Props> = ({
  loading,
  error,
  tickets,
  userReviewsSet,
  onPressTicket,
  onPressReview,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.messageText}>{error}</Text>;
  }

  if (!tickets || tickets.length === 0) {
    return (
      <Text style={styles.messageText}>No tienes tickets comprados.</Text>
    );
  }

  const controlledMatch = (s?: string) => {
    const t = (s || "").toLowerCase();
    return (
      t.includes("controlada") ||
      t.includes("controlado") ||
      t.includes("verificada") ||
      t.includes("escaneada") ||
      t.includes("canjeada")
    );
  };

  return (
    <View style={styles.containerCards}>
      {tickets.map((item) => {
        const anyItem: any = item as any;

        const fiestaIdRaw =
          typeof anyItem?.fiestaId !== "undefined" && anyItem?.fiestaId !== null
            ? String(anyItem.fiestaId).trim()
            : "";
        const fiestaId = fiestaIdRaw || undefined;

        const showReviewBtn =
          controlledMatch(anyItem?.estadoLabel) && !!fiestaIdRaw;
        const hasReview = fiestaId ? userReviewsSet.has(fiestaId) : false;

        const estadoCd =
          typeof anyItem?.estadoCd === "number" ? anyItem.estadoCd : undefined;
        const meta = estadoCd !== undefined ? ESTADO_ENTRADA_META[estadoCd] : undefined;
        const count =
          typeof anyItem.ticketsCount === "number" ? anyItem.ticketsCount : 1;

        const badgeLabelBase = meta
          ? anyItem?.estadoLabel || meta.short || meta.label
          : undefined;
        const badgeLabel =
          badgeLabelBase && count > 1
            ? `${badgeLabelBase} (${count})`
            : badgeLabelBase;

        const footer = showReviewBtn ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => onPressReview(item)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="star"
              size={18}
              color={COLORS.backgroundLight}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryButtonText}>
              {hasReview ? "Ver reseña" : "Dejar reseña"}
            </Text>
          </TouchableOpacity>
        ) : null;

        return (
          <CardComponent
            key={item.id}
            title={item.eventName}
            text={item.description}
            date={item.date}
            foto={item.imageUrl}
            hideFavorite
            onPress={() => onPressTicket(item)}
            footer={footer}
            badgeLabel={badgeLabel}
            badgeColor={meta?.bg}
            badgeTextColor={meta?.color}
          />
        );
      })}
    </View>
  );
};

export default TicketsPurchasedList;

const styles = StyleSheet.create({
  loadingContainer: {
    paddingTop: 20,
  },
  messageText: {
    marginTop: 20,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  containerCards: {
    marginTop: 0,
    paddingHorizontal: 12,
    rowGap: 16,
  },
  primaryButton: {
    marginTop: 8,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.button,
    color: COLORS.backgroundLight,
    textAlign: "center",
  },
});
