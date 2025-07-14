// app/main/EventsScreens/EventScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { IconButton, Avatar } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

import ProtectedRoute from "@/utils/auth/ProtectedRoute";
import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ReviewComponent from "@/components/events/ReviewComponent";
import TicketSelector from "@/components/tickets/TicketSelector";

import { fetchEvents } from "@/utils/events/eventApi";
import { ExtendedEventItem } from "@/utils/events/eventHelpers";
import { ReviewItem } from "@/interfaces/ReviewProps";
import { COLORS, FONT_SIZES, FONTS, RADIUS } from "@/styles/globalStyles";

const screenWidth = Dimensions.get("window").width;
const IMAGE_SIZE = 200;

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const [eventData, setEventData] = useState<ExtendedEventItem | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const mockReviews: ReviewItem[] = [
    { id: 1, user: "Usuario99", comment: "Me gustó mucho la fiesta.", rating: 5, daysAgo: 6 },
    { id: 2, user: "Usuario27", comment: "Buena organización, pero faltó variedad.", rating: 4, daysAgo: 6 },
  ];

  useEffect(() => {
    if (!id) return setLoading(false);
    fetchEvents()
      .then(list => {
        const found = list.find(e => e.id === id);
        if (found) {
          setEventData({
            ...found,
            ticketsByDay: (found as any).ticketsByDay || [],
            days: (found as any).days || (found as any).ticketsByDay?.length || 0,
            isRecurrent: (found as any).isRecurrent || false,
          } as ExtendedEventItem);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFavorite = () => setIsFavorite(f => !f);

  const updateTicketCount = (key: string, delta: number) => {
    setSelectedTickets(prev => {
      const next = (prev[key] || 0) + delta;
      if (next < 0) return prev;
      return { ...prev, [key]: next };
    });
  };

  const calculateSubtotal = () => {
    if (!eventData) return 0;
    let sum = 0;
    eventData.ticketsByDay.forEach(day => {
      const types = [
        ["genEarly", day.genEarlyQty, day.genEarlyPrice],
        ["vipEarly", day.vipEarlyQty, day.vipEarlyPrice],
        ["gen", day.genQty, day.genPrice],
        ["vip", day.vipQty, day.vipPrice],
      ] as const;
      types.forEach(([keySuffix, max, price]) => {
        if (max > 0) {
          const key = `day${day.dayNumber}-${keySuffix}`;
          sum += (selectedTickets[key] || 0) * price;
        }
      });
    });
    return sum;
  };
  const subtotal = calculateSubtotal();

  const handleBuyPress = () => {
    if (!eventData) return;
    const sel = encodeURIComponent(JSON.stringify(selectedTickets));
    router.push(`/main/TicketsScreens/BuyTicketScreen?id=${eventData.id}&selection=${sel}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderWrapper}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }
  if (!eventData) {
    return (
      <SafeAreaView style={styles.loaderWrapper}>
        <Text style={styles.errorText}>Evento no encontrado.</Text>
      </SafeAreaView>
    );
  }

  // mock avatars:
  const likeAvatars = Array.from({ length: Math.min(5, eventData.likes || 0) }).map(
    (_, i) => `https://i.pravatar.cc/150?img=${i + 20}`
  );

  return (
    <ProtectedRoute allowedRoles={["admin",  "user","owner"]}>
      <SafeAreaView style={styles.container}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Title & favorite */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{eventData.title}</Text>
            <IconButton
              icon={isFavorite ? "heart" : "heart-outline"}
              size={28}
              iconColor={isFavorite ? COLORS.negative : COLORS.textPrimary}
              onPress={toggleFavorite}
            />
          </View>

          {/* Date & Location */}
          <View style={styles.infoRow}>
            <IconButton icon="calendar-month" size={20} iconColor={COLORS.primary} />
            <Text style={styles.infoText}>
              {eventData.date} • {eventData.timeRange}
            </Text>
            <IconButton icon="map-marker" size={20} iconColor={COLORS.primary} />
            <Text style={styles.infoText}>{eventData.address}</Text>
          </View>

          {/* Likes */}
          <View style={styles.likesRow}>
            <IconButton icon="heart" size={24} iconColor={COLORS.negative} onPress={() => {}} />
            <View style={styles.avatarGroup}>
              {likeAvatars.map((uri, idx) => (
                <Avatar.Image
                  key={idx}
                  source={{ uri }}
                  size={32}
                  style={[styles.avatar, { marginLeft: idx === 0 ? 0 : -12 }]}
                />
              ))}
            </View>
            <Text style={styles.likeCount}>
              {eventData.likes} personas gustan esto
            </Text>
          </View>

          {/* Main: image + description */}
          <View style={styles.mainRow}>
            <Image source={{ uri: eventData.imageUrl }} style={styles.image} />
            <Text style={styles.description}>{eventData.description}</Text>
          </View>

          {/* Ticket selector */}
          <View style={styles.ticketSection}>
            <Text style={styles.sectionTitle}>Selecciona tus entradas</Text>
            {eventData.ticketsByDay.map(day => {
              const label =
                eventData.days > 1
                  ? `Día ${day.dayNumber} de ${eventData.days}`
                  : "Día único";
              return (
                <View key={day.dayNumber} style={styles.dayBlock}>
                  <Text style={styles.dayLabel}>{label}</Text>
                  {day.genEarlyQty > 0 && (
                    <TicketSelector
                      label={`General Early ($${day.genEarlyPrice})`}
                      maxQty={day.genEarlyQty}
                      currentQty={
                        selectedTickets[`day${day.dayNumber}-genEarly`] || 0
                      }
                      onChange={d =>
                        updateTicketCount(`day${day.dayNumber}-genEarly`, d)
                      }
                    />
                  )}
                  {day.vipEarlyQty > 0 && (
                    <TicketSelector
                      label={`VIP Early ($${day.vipEarlyPrice})`}
                      maxQty={day.vipEarlyQty}
                      currentQty={
                        selectedTickets[`day${day.dayNumber}-vipEarly`] || 0
                      }
                      onChange={d =>
                        updateTicketCount(`day${day.dayNumber}-vipEarly`, d)
                      }
                    />
                  )}
                  {day.genQty > 0 && (
                    <TicketSelector
                      label={`General ($${day.genPrice})`}
                      maxQty={day.genQty}
                      currentQty={selectedTickets[`day${day.dayNumber}-gen`] || 0}
                      onChange={d =>
                        updateTicketCount(`day${day.dayNumber}-gen`, d)
                      }
                    />
                  )}
                  {day.vipQty > 0 && (
                    <TicketSelector
                      label={`VIP ($${day.vipPrice})`}
                      maxQty={day.vipQty}
                      currentQty={selectedTickets[`day${day.dayNumber}-vip`] || 0}
                      onChange={d =>
                        updateTicketCount(`day${day.dayNumber}-vip`, d)
                      }
                    />
                  )}
                </View>
              );
            })}

            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalText}>Subtotal: ${subtotal}</Text>
              <TouchableOpacity style={styles.buyButton} onPress={handleBuyPress}>
                <Text style={styles.buyButtonText}>Comprar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reviews if recurrent */}
          {eventData.isRecurrent && (
            <View style={styles.reviewSection}>
              <Text style={styles.sectionTitle}>Reseñas</Text>
              <ReviewComponent reviews={mockReviews} />
            </View>
          )}
        </ScrollView>
        <Footer />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loaderWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, paddingBottom: 32 },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.titleBold,
    fontSize: FONT_SIZES.titleMain,
    color: COLORS.textPrimary,
    textDecorationLine: "underline",
    flex: 1,
    marginRight: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  infoText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginHorizontal: 4,
  },

  likesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarGroup: {
    flexDirection: "row",
    marginLeft: 4,
  },
  avatar: {
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  likeCount: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },

  mainRow: {
    flexDirection: screenWidth > 600 ? "row" : "column",
    alignItems: screenWidth > 600 ? "flex-start" : "center",
    marginBottom: 24,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    marginRight: screenWidth > 600 ? 16 : 0,
    marginBottom: screenWidth > 600 ? 0 : 16,
  },
  description: {
    flex: 1,
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.body * 1.5,
    textAlign: "justify",
  },

  ticketSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.subTitle,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  dayBlock: { marginBottom: 16 },
  dayLabel: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.info,
    marginBottom: 8,
  },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  subtotalText: {
    fontFamily: FONTS.subTitleMedium,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
  },
  buyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buyButtonText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.button,
    color: COLORS.cardBg,
  },

  reviewSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.card,
    padding: 16,
    elevation: 2,
  },

  errorText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: FONT_SIZES.body,
    color: COLORS.negative,
  },
});
