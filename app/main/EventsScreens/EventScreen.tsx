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
  Linking,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ReviewComponent from "@/components/events/ReviewComponent";
import TicketSelector from "@/components/tickets/TicketSelector";

import { fetchEvents } from "@/utils/events/eventApi";
import { ExtendedEventItem } from "@/utils/events/eventHelpers";
import { ReviewItem } from "@/interfaces/ReviewProps";
import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const [eventData, setEventData] = useState<ExtendedEventItem | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);

  const mockReviews: ReviewItem[] = [
    {
      id: 1,
      user: "Usuario99",
      comment: "Me gustó mucho la fiesta.",
      rating: 5,
      daysAgo: 6,
    },
    {
      id: 2,
      user: "Usuario27",
      comment: "Buena organización, pero faltó variedad.",
      rating: 4,
      daysAgo: 6,
    },
  ];

  useEffect(() => {
    if (!id) return;
    fetchEvents()
      .then((list) => {
        const found = list.find((e) => e.id === id);
        if (found) {
          setEventData({
            ...found,
            ticketsByDay: (found as any).ticketsByDay ?? [],
            days:
              (found as any).days ?? (found as any).ticketsByDay?.length ?? 0,
            isRecurrent: (found as any).isRecurrent ?? false,
          } as ExtendedEventItem);
        }
      })
      .catch((err) => console.error("Error cargando evento:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFavorite = () => setIsFavorite((prev) => !prev);

  const openMap = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
    Linking.openURL(url);
  };

  const updateTicketCount = (key: string, delta: number) => {
    setSelectedTickets((prev) => {
      const cur = prev[key] || 0;
      const next = cur + delta;
      if (next < 0) return prev;
      return { ...prev, [key]: next };
    });
  };

  const calculateSubtotal = (): number => {
    if (!eventData || !Array.isArray(eventData.ticketsByDay)) return 0;
    let subtotal = 0;
    eventData.ticketsByDay.forEach((day) => {
      const base = `day${day.dayNumber}`;
      const types = [
        {
          qty: day.genEarlyQty,
          key: `${base}-genEarly`,
          price: day.genEarlyPrice,
        },
        {
          qty: day.vipEarlyQty,
          key: `${base}-vipEarly`,
          price: day.vipEarlyPrice,
        },
        { qty: day.genQty, key: `${base}-gen`, price: day.genPrice },
        { qty: day.vipQty, key: `${base}-vip`, price: day.vipPrice },
      ];
      types.forEach((t) => {
        if (t.qty > 0) {
          subtotal += (selectedTickets[t.key] || 0) * t.price;
        }
      });
    });
    return subtotal;
  };

  const subtotal = calculateSubtotal();

  const handleBuyPress = () => {
    if (!eventData) return;
    const sel = encodeURIComponent(JSON.stringify(selectedTickets));
    router.push(
      `/main/TicketsScreens/BuyTicketScreen?id=${eventData.id}&selection=${sel}`
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loaderContainer}>
          <Text style={styles.notFoundText}>Evento no encontrado.</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: eventData.imageUrl }} style={styles.img} />
        </View>

        <View style={styles.eventCard}>
          <View style={styles.titleRow}>
            <Text style={styles.eventTitle}>{eventData.title}</Text>
            <IconButton
              icon={isFavorite ? "heart" : "heart-outline"}
              iconColor={isFavorite ? COLORS.negative : COLORS.textPrimary}
              size={30}
              style={styles.heartIcon}
              onPress={toggleFavorite}
            />
          </View>

          <View style={styles.infoRow}>
            <IconButton
              icon="calendar"
              size={20}
              iconColor={COLORS.textPrimary}
              style={{ margin: 0 }}
            />
            <Text style={styles.infoText}>
              {eventData.date} de {eventData.timeRange}
            </Text>
          </View>

          <Text style={styles.addressText}>{eventData.address}</Text>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => openMap(eventData.address)}
          >
            <Text style={styles.mapButtonText}>Cómo llegar</Text>
          </TouchableOpacity>

          <Text style={styles.description}>{eventData.description}</Text>
        </View>

        {Array.isArray(eventData.ticketsByDay) && (
          <View style={styles.ticketCard}>
            <Text style={styles.ticketCardTitle}>Selecciona tus entradas:</Text>
            {eventData.ticketsByDay.map((day) => {
              const base = `day${day.dayNumber}`;
              const label =
                eventData.days === 1
                  ? "Día único"
                  : `Día ${day.dayNumber} de ${eventData.days}`;
              return (
                <View key={day.dayNumber} style={styles.dayBlock}>
                  <Text style={styles.dayLabel}>{label}</Text>
                  {day.genEarlyQty > 0 && (
                    <TicketSelector
                      label={`Generales Early Birds ($${day.genEarlyPrice})`}
                      maxQty={day.genEarlyQty}
                      currentQty={selectedTickets[`${base}-genEarly`] || 0}
                      onChange={(delta) =>
                        updateTicketCount(`${base}-genEarly`, delta)
                      }
                    />
                  )}
                  {day.vipEarlyQty > 0 && (
                    <TicketSelector
                      label={`VIP Early Birds ($${day.vipEarlyPrice})`}
                      maxQty={day.vipEarlyQty}
                      currentQty={selectedTickets[`${base}-vipEarly`] || 0}
                      onChange={(delta) =>
                        updateTicketCount(`${base}-vipEarly`, delta)
                      }
                    />
                  )}
                  {day.genQty > 0 && (
                    <TicketSelector
                      label={`Generales ($${day.genPrice})`}
                      maxQty={day.genQty}
                      currentQty={selectedTickets[`${base}-gen`] || 0}
                      onChange={(delta) =>
                        updateTicketCount(`${base}-gen`, delta)
                      }
                    />
                  )}
                  {day.vipQty > 0 && (
                    <TicketSelector
                      label={`VIP ($${day.vipPrice})`}
                      maxQty={day.vipQty}
                      currentQty={selectedTickets[`${base}-vip`] || 0}
                      onChange={(delta) =>
                        updateTicketCount(`${base}-vip`, delta)
                      }
                    />
                  )}
                </View>
              );
            })}

            <Text style={styles.subtotalText}>
              Subtotal (sin cargo de servicio): ${subtotal}
            </Text>
            <View style={styles.buyButtonContainer}>
              <TouchableOpacity
                style={styles.buyButton}
                onPress={handleBuyPress}
              >
                <Text style={styles.buyButtonText}>Comprar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {eventData.isRecurrent && (
          <View style={styles.reviewCard}>
            <ReviewComponent reviews={mockReviews} />
          </View>
        )}
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body },
  scrollContent: { paddingBottom: 24 },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: COLORS.borderInput,
  },
  img: { width: "100%", height: "100%", resizeMode: "cover" },
  eventCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.card,
    padding: 16,
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventTitle: {
    fontSize: FONT_SIZES.subTitle,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
    maxWidth: "85%",
  },
  heartIcon: { backgroundColor: "transparent" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  infoText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body },
  addressText: {
    marginBottom: 8,
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  mapButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  mapButtonText: { color: COLORS.cardBg, fontWeight: "bold" },
  description: {
    marginTop: 4,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "justify",
    lineHeight: 20,
  },
  ticketCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.card,
    padding: 16,
    elevation: 2,
  },
  ticketCardTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  dayBlock: { marginBottom: 16 },
  dayLabel: {
    fontSize: FONT_SIZES.body,
    fontWeight: "bold",
    color: COLORS.info,
    marginBottom: 6,
  },
  subtotalText: {
    textAlign: "right",
    marginTop: 8,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  buyButtonContainer: { alignItems: "flex-end", marginTop: 8 },
  buyButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.card,
    width: 150,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  buyButtonText: {
    color: COLORS.cardBg,
    fontSize: FONT_SIZES.button,
    fontWeight: "bold",
  },
  reviewCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: RADIUS.card,
    padding: 16,
    elevation: 2,
  },
});
