// EventScreen.tsx
import React from "react";
import { SafeAreaView, ScrollView, View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { IconButton } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";

import Header from "@/components/layout/HeaderComponent";
import Footer from "@/components/layout/FooterComponent";
import ReviewComponent from "@/components/ReviewComponent";
import TicketSelector from "@/components/tickets/TicketSelector";

// <-- importamos nuestro custom hook
import { useEventDetail } from "@/hooks/useEventDetail";

import { COLORS, FONT_SIZES, RADIUS } from "@/styles/globalStyles";

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  // Consumimos la lógica del hook
  const {
    eventData,
    isFavorite,
    toggleFavorite,
    selectedTickets,
    updateTicketCount,
    subtotal,
    handleBuyPress,
    openMap,
    mockReviews,
  } = useEventDetail(id);

  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.notFoundContainer}>
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
        {/* Imagen principal */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: eventData.imageUrl }} style={styles.img} />
        </View>

        {/* Card con la info del evento */}
        <View style={styles.eventCard}>
          {/* Fila con título + corazón */}
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

          {/* Fecha y hora */}
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

          {/* Dirección + botón "Cómo llegar" */}
          <Text style={styles.addressText}>{eventData.address}</Text>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => openMap(eventData.address)}
          >
            <Text style={styles.mapButtonText}>Cómo llegar</Text>
          </TouchableOpacity>

          {/* Descripción */}
          <Text style={styles.description}>{eventData.description}</Text>
        </View>

        {/* Selección de tickets */}
        <View style={styles.ticketCard}>
          <Text style={styles.ticketCardTitle}>Selecciona tus entradas:</Text>

          {eventData.ticketsByDay.map((dayInfo) => {
            const baseKey = `day${dayInfo.dayNumber}`;
            const dayLabel =
              eventData.days === 1
                ? "Día único"
                : `Día ${dayInfo.dayNumber} de ${eventData.days}`;

            return (
              <View key={dayInfo.dayNumber} style={styles.dayBlock}>
                <Text style={styles.dayLabel}>{dayLabel}</Text>

                {/* Generales Early Birds */}
                {dayInfo.genEarlyQty > 0 && (
                  <TicketSelector
                    label={`Generales Early Birds ($${dayInfo.genEarlyPrice})`}
                    maxQty={dayInfo.genEarlyQty}
                    currentQty={selectedTickets[`${baseKey}-genEarly`] || 0}
                    onChange={(delta) =>
                      updateTicketCount(`${baseKey}-genEarly`, delta)
                    }
                  />
                )}

                {/* VIP Early Birds */}
                {dayInfo.vipEarlyQty > 0 && (
                  <TicketSelector
                    label={`VIP Early Birds ($${dayInfo.vipEarlyPrice})`}
                    maxQty={dayInfo.vipEarlyQty}
                    currentQty={selectedTickets[`${baseKey}-vipEarly`] || 0}
                    onChange={(delta) =>
                      updateTicketCount(`${baseKey}-vipEarly`, delta)
                    }
                  />
                )}

                {/* Generales */}
                {dayInfo.genQty > 0 && (
                  <TicketSelector
                    label={`Generales ($${dayInfo.genPrice})`}
                    maxQty={dayInfo.genQty}
                    currentQty={selectedTickets[`${baseKey}-gen`] || 0}
                    onChange={(delta) =>
                      updateTicketCount(`${baseKey}-gen`, delta)
                    }
                  />
                )}

                {/* VIP */}
                {dayInfo.vipQty > 0 && (
                  <TicketSelector
                    label={`VIP ($${dayInfo.vipPrice})`}
                    maxQty={dayInfo.vipQty}
                    currentQty={selectedTickets[`${baseKey}-vip`] || 0}
                    onChange={(delta) =>
                      updateTicketCount(`${baseKey}-vip`, delta)
                    }
                  />
                )}
              </View>
            );
          })}

          {/* Subtotal de entradas */}
          <Text style={styles.subtotalText}>
            Subtotal (sin cargo de servicio): ${subtotal}
          </Text>

          {/* Botón comprar */}
          <View style={styles.buyButtonContainer}>
            <TouchableOpacity style={styles.buyButton} onPress={handleBuyPress}>
              <Text style={styles.buyButtonText}>Comprar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reseñas (solo si recurrente) */}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
  },

  // Imagen principal
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: COLORS.borderInput,
  },
  img: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // Info del evento
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
  heartIcon: {
    backgroundColor: "transparent",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
  },
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
  mapButtonText: {
    color: COLORS.cardBg,
    fontWeight: "bold",
  },
  description: {
    marginTop: 4,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    textAlign: "justify",
    lineHeight: 20,
  },

  // Selección de tickets
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
  dayBlock: {
    marginBottom: 16,
  },
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
  buyButtonContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
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

  // Reseñas
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
